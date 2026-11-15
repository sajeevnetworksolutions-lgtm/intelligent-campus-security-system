import os
import time
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any, Tuple, List

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

from app.core.config import settings
from app.ml.preprocessing import DatasetPreprocessor

class MLModelTrainer:
    def __init__(self, output_dir: str = settings.TRAINED_MODELS_DIR):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(settings.GRAPHS_DIR, exist_ok=True)
        os.makedirs(os.path.join(settings.RESULTS_DIR, "confusion_matrices"), exist_ok=True)

    def train_and_evaluate(
        self,
        algorithm: str,
        model_name: str,
        dataset_path: str,
        target_column: str = "attack_cat",
        test_size: float = 0.25,
        random_state: int = 42,
        hyperparameters: Dict[str, Any] = None
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Train the requested machine learning algorithm on genuine dataset data,
        evaluate on a separate held-out test set, and compute research-grade metrics.
        """
        hyperparameters = hyperparameters or {}
        df = pd.read_csv(dataset_path)
        
        preprocessor = DatasetPreprocessor()
        X_train, X_test, y_train, y_test, feature_names, target_names = preprocessor.fit_transform(
            df=df, target_col=target_column, test_size=test_size, random_state=random_state
        )

        n_classes = len(target_names)
        normal_idx = target_names.index("Normal") if "Normal" in target_names else 0

        # Model instantiations
        start_train_time = time.time()
        
        if algorithm == "RandomForest":
            n_estimators = int(hyperparameters.get("n_estimators", 100))
            max_depth = hyperparameters.get("max_depth", 15)
            if max_depth is not None:
                max_depth = int(max_depth)
            model = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=random_state,
                n_jobs=-1
            )
            model.fit(X_train, y_train)

        elif algorithm == "DecisionTree":
            max_depth = hyperparameters.get("max_depth", 12)
            if max_depth is not None:
                max_depth = int(max_depth)
            criterion = hyperparameters.get("criterion", "gini")
            model = DecisionTreeClassifier(
                max_depth=max_depth,
                criterion=criterion,
                random_state=random_state
            )
            model.fit(X_train, y_train)

        elif algorithm == "SVM":
            # For efficiency and scalability on large datasets, use linear or rbf with probability=True on a representative sample if large
            kernel = hyperparameters.get("kernel", "rbf")
            C = float(hyperparameters.get("C", 1.0))
            max_train_samples = 4000 # Keep training time reasonable for SVM
            if len(X_train) > max_train_samples:
                idx = np.random.choice(len(X_train), max_train_samples, replace=False)
                X_train_sub, y_train_sub = X_train[idx], y_train[idx]
            else:
                X_train_sub, y_train_sub = X_train, y_train

            model = SVC(
                kernel=kernel,
                C=C,
                probability=True,
                random_state=random_state
            )
            model.fit(X_train_sub, y_train_sub)

        elif algorithm == "IsolationForest":
            # Unsupervised anomaly detection. Normal traffic is treated as inliers (1), attacks as outliers (-1)
            contamination = float(hyperparameters.get("contamination", 0.35))
            model = IsolationForest(
                contamination=contamination,
                random_state=random_state,
                n_jobs=-1
            )
            # Fit only on normal traffic for pure novelty/anomaly detection
            normal_mask = (y_train == normal_idx)
            X_train_normal = X_train[normal_mask]
            model.fit(X_train_normal)

        elif algorithm == "XGBoost":
            n_estimators = int(hyperparameters.get("n_estimators", 100))
            learning_rate = float(hyperparameters.get("learning_rate", 0.1))
            max_depth = int(hyperparameters.get("max_depth", 6))
            model = XGBClassifier(
                n_estimators=n_estimators,
                learning_rate=learning_rate,
                max_depth=max_depth,
                random_state=random_state,
                eval_metric="mlogloss",
                n_jobs=-1
            )
            model.fit(X_train, y_train)

        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        train_duration_sec = round(time.time() - start_train_time, 3)

        # Testing & Latency Evaluation
        inference_start = time.time()
        if algorithm == "IsolationForest":
            # Raw output is 1 for inlier (Normal), -1 for outlier (Attack)
            raw_preds = model.predict(X_test)
            # Map to target index: 1 -> normal_idx, -1 -> attack (assign to first attack class or synthetic attack)
            attack_idx = 1 if normal_idx == 0 else 0
            y_pred = np.where(raw_preds == 1, normal_idx, attack_idx)
        else:
            y_pred = model.predict(X_test)
            
        total_inference_time = time.time() - inference_start
        detection_time_ms = round((total_inference_time / len(X_test)) * 1000, 4)

        # Standard Research Metrics Computation
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        cm_list = cm.tolist()

        # Binary False Positive Rate calculation (Normal vs Attack)
        # Normal is Negative (N), Attack is Positive (P)
        y_test_bin = (y_test != normal_idx).astype(int)
        y_pred_bin = (y_pred != normal_idx).astype(int)
        cm_bin = confusion_matrix(y_test_bin, y_pred_bin, labels=[0, 1])
        tn, fp, fn, tp = cm_bin.ravel() if cm_bin.shape == (2, 2) else (0, 0, 0, 0)
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        # Detailed per-class metrics
        clf_report = classification_report(
            y_test, y_pred, 
            target_names=[str(t) for t in target_names], 
            output_dict=True, 
            zero_division=0
        )
        
        per_class_metrics = {}
        for target in target_names:
            t_str = str(target)
            if t_str in clf_report:
                per_class_metrics[t_str] = {
                    "precision": round(float(clf_report[t_str]["precision"]), 4),
                    "recall": round(float(clf_report[t_str]["recall"]), 4),
                    "f1_score": round(float(clf_report[t_str]["f1-score"]), 4),
                    "support": int(clf_report[t_str]["support"])
                }

        # Feature Importance (if supported)
        feat_importance = {}
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feat_importance = {
                feature_names[i]: round(float(importances[i]), 4)
                for i in np.argsort(importances)[::-1][:15]
            }

        # Save Artifacts
        model_filename = f"{model_name.replace(' ', '_').lower()}.joblib"
        model_file_path = os.path.join(self.output_dir, model_filename)
        joblib.dump(model, model_file_path)

        preprocessor_filename = f"{model_name.replace(' ', '_').lower()}_preprocessor.joblib"
        preprocessor_file_path = os.path.join(self.output_dir, preprocessor_filename)
        preprocessor.save(preprocessor_file_path)

        # Plot & Save Confusion Matrix
        cm_img_path = self._generate_confusion_matrix_plot(cm, target_names, model_name)

        summary_metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "false_positive_rate": round(fpr, 4),
            "detection_time_ms": round(detection_time_ms, 4),
            "training_duration_sec": train_duration_sec,
            "feature_names": feature_names,
            "target_names": target_names,
            "model_path": model_file_path,
            "preprocessor_path": preprocessor_file_path,
            "cm_image_path": cm_img_path
        }

        detailed_metrics = {
            "confusion_matrix": cm_list,
            "classification_report": clf_report,
            "per_class_metrics": per_class_metrics,
            "feature_importance": feat_importance
        }

        return summary_metrics, detailed_metrics

    def _generate_confusion_matrix_plot(self, cm: np.ndarray, target_names: List[str], model_name: str) -> str:
        """Plot and save confusion matrix heatmap."""
        plt.figure(figsize=(8, 6), dpi=120)
        sns.heatmap(
            cm, 
            annot=True, 
            fmt="d", 
            cmap="Blues", 
            xticklabels=target_names, 
            yticklabels=target_names
        )
        plt.title(f"Confusion Matrix: {model_name}\nSSIT Campus Cybersecurity IDS", fontsize=12, fontweight="bold")
        plt.ylabel("Ground Truth Class")
        plt.xlabel("Predicted Class")
        plt.tight_layout()

        safe_name = model_name.replace(" ", "_").lower()
        out_path = os.path.join(settings.RESULTS_DIR, "confusion_matrices", f"cm_{safe_name}.png")
        plt.savefig(out_path)
        plt.close()
        return out_path
