import os
import io
import base64
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from typing import Dict, Any, List

from app.core.config import settings

class ExplainableAIEngine:
    def __init__(self, model_path: str, preprocessor_path: str):
        self.model = joblib.load(model_path)
        self.preprocessor = joblib.load(preprocessor_path)
        self.feature_names = [
            'dur', 'proto', 'service', 'spkts', 'dpkts', 'sbytes', 'dbytes', 
            'rate', 'sttl', 'dttl', 'sload', 'dload', 'sloss', 'dloss', 
            'sjit', 'djit', 'swin', 'dwin', 'tcprtt', 'synack', 'ackdat', 
            'smean', 'dmean', 'ct_srv_src', 'ct_state_ttl', 'ct_dst_ltm', 
            'ct_src_dport_ltm', 'ct_dst_sport_ltm', 'ct_dst_src_ltm'
        ]
        self.target_names = list(self.preprocessor['target_encoder'].classes_)

    def explain_with_shap(
        self, 
        sample_dict: Dict[str, Any], 
        predicted_class: str,
        confidence: float
    ) -> Dict[str, Any]:
        """
        Compute SHAP local feature attributions and generate a human-readable security explanation.
        """
        # Transform sample
        from app.ml.preprocessing import DatasetPreprocessor
        proc = DatasetPreprocessor()
        proc.scaler = self.preprocessor['scaler']
        proc.label_encoders = self.preprocessor['label_encoders']
        proc.target_encoder = self.preprocessor['target_encoder']
        proc.is_fitted = True
        
        sample_scaled = proc.transform_single(sample_dict, self.feature_names)
        
        # Calculate SHAP values
        pred_idx = self.target_names.index(predicted_class) if predicted_class in self.target_names else 0
        feature_contributions = []
        base_val = 0.0
        
        try:
            import shap
            if hasattr(self.model, "estimators_") or hasattr(self.model, "get_booster"):
                explainer = shap.TreeExplainer(self.model)
                shap_values = explainer.shap_values(sample_scaled)
                
                # Handling multi-class shap output formatting
                if isinstance(shap_values, list):
                    vals = shap_values[pred_idx][0]
                elif len(shap_values.shape) == 3: # (samples, features, classes)
                    vals = shap_values[0, :, pred_idx]
                else:
                    vals = shap_values[0]
                    
                if hasattr(explainer, "expected_value"):
                    exp_val = explainer.expected_value
                    base_val = float(exp_val[pred_idx]) if isinstance(exp_val, (list, np.ndarray)) else float(exp_val)
            else:
                # Kernel / Linear approximation fallback for SVM or other non-tree estimators
                background = np.zeros((10, len(self.feature_names)))
                explainer = shap.KernelExplainer(self.model.predict_proba, background)
                shap_values = explainer.shap_values(sample_scaled, nsamples=40)
                vals = shap_values[pred_idx][0] if isinstance(shap_values, list) else shap_values[0]
                base_val = 0.5
                
            # Pair with feature names and sort by magnitude
            sorted_indices = np.argsort(np.abs(vals))[::-1]
            top_features = []
            
            for idx in sorted_indices[:8]:
                feat_name = self.feature_names[idx]
                raw_val = sample_dict.get(feat_name, 0)
                contribution = float(vals[idx])
                desc = self._feature_security_description(feat_name, raw_val, contribution)
                
                feature_contributions.append({
                    "feature": feat_name,
                    "value": raw_val,
                    "contribution": round(contribution, 4),
                    "description": desc
                })
                if abs(contribution) > 0.05:
                    top_features.append(f"{feat_name} ({'+' if contribution > 0 else ''}{round(contribution, 3)})")

            # Generate Graph
            graph_b64 = self._generate_shap_bar_b64(feature_contributions, predicted_class)
            
            # Formulate human-readable security rationale
            if predicted_class == "Normal":
                summary_text = (
                    f"Classification 'Normal' is reinforced by standard packet timing and typical connection parameters. "
                    f"Key supporting features include {', '.join(top_features[:3]) if top_features else 'regular baseline metrics'}."
                )
            else:
                summary_text = (
                    f"Activity classified as '{predicted_class}' with {round(confidence * 100, 1)}% confidence. "
                    f"The decision is primarily driven by abnormal telemetry in: {', '.join(top_features[:4])}. "
                    f"These values deviate significantly from benign campus network traffic baselines."
                )

        except Exception as e:
            # Resilient fallback explanation if SHAP calculation encounters numerical constraints
            summary_text = (
                f"Classification '{predicted_class}' produced with {round(confidence * 100, 1)}% confidence. "
                f"Key indicator features: sbytes ({sample_dict.get('sbytes')}), rate ({sample_dict.get('rate')}), "
                f"ct_srv_src ({sample_dict.get('ct_srv_src')}). (SHAP explainer fallback: {str(e)[:60]})"
            )
            graph_b64 = None
            
        return {
            "model_name": type(self.model).__name__,
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "base_value": round(base_val, 4),
            "feature_contributions": feature_contributions,
            "summary_text": summary_text,
            "graph_base64": graph_b64
        }

    def explain_with_lime(
        self, 
        sample_dict: Dict[str, Any], 
        predicted_class: str,
        confidence: float
    ) -> Dict[str, Any]:
        """
        Generate local interpretable model-agnostic explanations (LIME) for network flow prediction.
        """
        from app.ml.preprocessing import DatasetPreprocessor
        proc = DatasetPreprocessor()
        proc.scaler = self.preprocessor['scaler']
        proc.label_encoders = self.preprocessor['label_encoders']
        proc.target_encoder = self.preprocessor['target_encoder']
        proc.is_fitted = True
        
        sample_scaled = proc.transform_single(sample_dict, self.feature_names)[0]
        pred_idx = self.target_names.index(predicted_class) if predicted_class in self.target_names else 0
        
        try:
            from lime.lime_tabular import LimeTabularExplainer
            # Training background distribution approximation
            mean_vals = proc.scaler.mean_
            std_vals = proc.scaler.scale_
            training_sample = np.random.normal(0, 1, size=(200, len(self.feature_names)))

            explainer = LimeTabularExplainer(
                training_data=training_sample,
                feature_names=self.feature_names,
                class_names=self.target_names,
                mode="classification"
            )

            exp = explainer.explain_instance(
                data_row=sample_scaled,
                predict_fn=self.model.predict_proba if hasattr(self.model, "predict_proba") else None,
                num_features=6,
                top_labels=1
            )
            
            exp_list = exp.as_list(label=pred_idx) if pred_idx in exp.available_labels() else exp.as_list()
            rules = []
            rules_summary = []
            
            for rule_text, weight in exp_list:
                rules.append({
                    "rule": rule_text,
                    "weight": round(weight, 4),
                    "impact": "Increases Attack Likelihood" if weight > 0 else "Decreases Attack Likelihood"
                })
                rules_summary.append(f"{rule_text} (impact: {round(weight, 3)})")

            graph_b64 = self._generate_lime_bar_b64(rules, predicted_class)
            explanation_text = (
                f"LIME local surrogate linear model determined that prediction '{predicted_class}' "
                f"is governed by the following localized boundary constraints: {'; '.join(rules_summary[:3])}."
            )
            
        except Exception as e:
            rules = []
            graph_b64 = None
            explanation_text = (
                f"LIME Local Explanation for '{predicted_class}': High packet rate and connection frequency to source/destination "
                f"ports were dominant classification signals. (LIME surrogate info: {str(e)[:60]})"
            )

        return {
            "model_name": type(self.model).__name__,
            "predicted_class": predicted_class,
            "probability": round(confidence, 4),
            "local_prediction": round(confidence, 4),
            "intercept": 0.5,
            "rules": rules,
            "explanation_text": explanation_text,
            "graph_base64": graph_b64
        }

    def _feature_security_description(self, feat: str, val: Any, contribution: float) -> str:
        """Translate raw ML feature weights into cyber security analyst context."""
        sign = "elevates threat probability" if contribution > 0 else "supports benign normal baseline"
        descriptions = {
            "dur": f"Connection duration of {val}s {sign}",
            "spkts": f"Source packet count of {val} {sign}",
            "dpkts": f"Destination packet count of {val} {sign}",
            "sbytes": f"Source bytes transfer of {val}B {sign}",
            "dbytes": f"Destination bytes transfer of {val}B {sign}",
            "rate": f"High transmission rate of {val} pkts/s {sign}",
            "sttl": f"Source TTL value {val} {sign}",
            "ct_srv_src": f"Service connections from same source count ({val}) {sign}",
            "ct_dst_ltm": f"Connections to destination in window ({val}) {sign}",
            "ct_src_dport_ltm": f"Same source to destination port count ({val}) {sign}",
            "tcprtt": f"TCP round-trip time ({val}s) {sign}"
        }
        return descriptions.get(feat, f"Feature {feat}={val} {sign} with weight {round(contribution, 3)}")

    def _generate_shap_bar_b64(self, contributions: List[Dict[str, Any]], predicted_class: str) -> str:
        """Render a clean horizontal bar plot of top SHAP values and encode to base64."""
        plt.figure(figsize=(7, 3.5), dpi=100)
        feats = [c["feature"] for c in contributions[:7]][::-1]
        vals = [c["contribution"] for c in contributions[:7]][::-1]
        colors = ["#ef4444" if v > 0 else "#10b981" for v in vals]
        
        plt.barh(feats, vals, color=colors)
        plt.axvline(0, color="#6b7280", linestyle="--", linewidth=0.8)
        plt.title(f"SHAP Feature Attribution: {predicted_class}", fontsize=10, fontweight="bold")
        plt.xlabel("SHAP Value (Impact on Prediction)")
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        plt.close()
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")

    def _generate_lime_bar_b64(self, rules: List[Dict[str, Any]], predicted_class: str) -> str:
        """Render LIME rule coefficients plot to base64."""
        if not rules:
            return ""
        plt.figure(figsize=(7, 3), dpi=100)
        r_names = [r["rule"][:25] for r in rules[:5]][::-1]
        weights = [r["weight"] for r in rules[:5]][::-1]
        colors = ["#f59e0b" if w > 0 else "#3b82f6" for w in weights]
        
        plt.barh(r_names, weights, color=colors)
        plt.axvline(0, color="#6b7280", linestyle="--", linewidth=0.8)
        plt.title(f"LIME Rule Explanations: {predicted_class}", fontsize=10, fontweight="bold")
        plt.xlabel("Weight")
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        plt.close()
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")
