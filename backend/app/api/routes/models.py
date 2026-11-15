import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.dataset import DatasetRecord
from app.models.model import TrainedModel, ModelMetric, ExperimentRun
from app.models.security import AuditLog
from app.schemas.ml import ModelTrainRequest, TrainedModelOut, ModelMetricsOut, ModelComparisonItem
from app.ml.trainer import MLModelTrainer

router = APIRouter(prefix="/models", tags=["Machine Learning Models"])

@router.get("", response_model=List[TrainedModelOut])
def list_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    models = db.query(TrainedModel).order_by(TrainedModel.id.desc()).all()
    results = []
    for m in models:
        results.append(TrainedModelOut(
            id=m.id,
            name=m.name,
            algorithm=m.algorithm,
            dataset_id=m.dataset_id,
            accuracy=m.accuracy,
            precision=m.precision,
            recall=m.recall,
            f1_score=m.f1_score,
            false_positive_rate=m.false_positive_rate,
            detection_time_ms=m.detection_time_ms,
            training_duration_sec=m.training_duration_sec,
            is_active=m.is_active,
            feature_names=json.loads(m.feature_names) if m.feature_names else [],
            target_names=json.loads(m.target_names) if m.target_names else [],
            created_at=m.created_at
        ))
    return results

@router.post("/train", response_model=TrainedModelOut)
def train_model(
    payload: ModelTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    dataset_rec = db.query(DatasetRecord).filter(DatasetRecord.id == payload.dataset_id).first()
    if not dataset_rec:
        raise HTTPException(status_code=404, detail="Selected dataset not found")

    trainer = MLModelTrainer()
    try:
        summary_metrics, detailed_metrics = trainer.train_and_evaluate(
            algorithm=payload.algorithm,
            model_name=payload.name,
            dataset_path=dataset_rec.file_path,
            target_column=dataset_rec.target_column,
            test_size=payload.test_size or 0.25,
            random_state=payload.random_state or 42,
            hyperparameters=payload.hyperparameters or {}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

    # Check if this is the first model; if so, activate it by default
    existing_count = db.query(TrainedModel).count()
    is_active = (existing_count == 0)

    model_rec = TrainedModel(
        name=payload.name,
        algorithm=payload.algorithm,
        dataset_id=payload.dataset_id,
        model_path=summary_metrics["model_path"],
        scaler_path=summary_metrics["preprocessor_path"],
        feature_names=json.dumps(summary_metrics["feature_names"]),
        target_names=json.dumps(summary_metrics["target_names"]),
        hyperparameters=json.dumps(payload.hyperparameters or {}),
        accuracy=summary_metrics["accuracy"],
        precision=summary_metrics["precision"],
        recall=summary_metrics["recall"],
        f1_score=summary_metrics["f1_score"],
        false_positive_rate=summary_metrics["false_positive_rate"],
        detection_time_ms=summary_metrics["detection_time_ms"],
        training_duration_sec=summary_metrics["training_duration_sec"],
        is_active=is_active
    )
    db.add(model_rec)
    db.commit()
    db.refresh(model_rec)

    # Save detailed metrics
    metrics_rec = ModelMetric(
        model_id=model_rec.id,
        confusion_matrix_json=json.dumps(detailed_metrics["confusion_matrix"]),
        classification_report_json=json.dumps(detailed_metrics["classification_report"]),
        per_class_metrics_json=json.dumps(detailed_metrics["per_class_metrics"]),
        feature_importance_json=json.dumps(detailed_metrics["feature_importance"])
    )
    db.add(metrics_rec)

    # Record experiment run
    exp_run = ExperimentRun(
        experiment_code=f"EXP-ML-{model_rec.id:02d}",
        title=f"Empirical Evaluation of {payload.algorithm} on {dataset_rec.name}",
        dataset_name=dataset_rec.name,
        algorithm=payload.algorithm,
        parameters_json=json.dumps(payload.hyperparameters or {}),
        results_json=json.dumps(summary_metrics),
        execution_time_sec=summary_metrics["training_duration_sec"],
        status="COMPLETED"
    )
    db.add(exp_run)

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="TRAIN_MODEL",
        resource=f"MODEL:{model_rec.name}",
        details_json=json.dumps({"algorithm": payload.algorithm, "accuracy": summary_metrics["accuracy"]})
    )
    db.add(audit)
    db.commit()

    return TrainedModelOut(
        id=model_rec.id,
        name=model_rec.name,
        algorithm=model_rec.algorithm,
        dataset_id=model_rec.dataset_id,
        accuracy=model_rec.accuracy,
        precision=model_rec.precision,
        recall=model_rec.recall,
        f1_score=model_rec.f1_score,
        false_positive_rate=model_rec.false_positive_rate,
        detection_time_ms=model_rec.detection_time_ms,
        training_duration_sec=model_rec.training_duration_sec,
        is_active=model_rec.is_active,
        feature_names=summary_metrics["feature_names"],
        target_names=summary_metrics["target_names"],
        created_at=model_rec.created_at
    )

@router.get("/{model_id}/metrics", response_model=ModelMetricsOut)
def get_model_metrics(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    model_rec = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model_rec:
        raise HTTPException(status_code=404, detail="Model not found")

    metrics_rec = db.query(ModelMetric).filter(ModelMetric.model_id == model_id).first()
    if not metrics_rec:
        raise HTTPException(status_code=404, detail="Metrics record not found for this model")

    return ModelMetricsOut(
        accuracy=model_rec.accuracy,
        precision=model_rec.precision,
        recall=model_rec.recall,
        f1_score=model_rec.f1_score,
        false_positive_rate=model_rec.false_positive_rate,
        detection_time_ms=model_rec.detection_time_ms,
        training_duration_sec=model_rec.training_duration_sec,
        confusion_matrix=json.loads(metrics_rec.confusion_matrix_json),
        target_names=json.loads(model_rec.target_names),
        classification_report=json.loads(metrics_rec.classification_report_json),
        per_class_metrics=json.loads(metrics_rec.per_class_metrics_json),
        feature_importance=json.loads(metrics_rec.feature_importance_json) if metrics_rec.feature_importance_json else None
    )

@router.post("/{model_id}/activate")
def activate_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    target = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Model not found")

    # Set all other models to inactive
    db.query(TrainedModel).update({TrainedModel.is_active: False})
    target.is_active = True
    db.commit()

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="ACTIVATE_MODEL",
        resource=f"MODEL:{target.name}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Model '{target.name}' is now active for operational network intrusion detection"}

@router.get("/compare", response_model=List[ModelComparisonItem])
def compare_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    models = db.query(TrainedModel).all()
    if not models:
        return []

    results = []
    # Documented selection strategy:
    # Rank Score = (F1_Score * 0.50) + ((1.0 - FPR) * 0.30) + (Recall * 0.20)
    for m in models:
        rank_score = (m.f1_score * 0.50) + ((1.0 - m.false_positive_rate) * 0.30) + (m.recall * 0.20)
        results.append({
            "algorithm": m.algorithm,
            "model_name": m.name,
            "accuracy": m.accuracy,
            "precision": m.precision,
            "recall": m.recall,
            "f1_score": m.f1_score,
            "false_positive_rate": m.false_positive_rate,
            "detection_time_ms": m.detection_time_ms,
            "training_duration_sec": m.training_duration_sec,
            "rank_score": round(rank_score, 4),
            "is_recommended": False
        })

    # Identify best-performing model based on multi-criteria rank score
    results.sort(key=lambda x: x["rank_score"], reverse=True)
    if results:
        results[0]["is_recommended"] = True

    return [ModelComparisonItem(**r) for r in results]
