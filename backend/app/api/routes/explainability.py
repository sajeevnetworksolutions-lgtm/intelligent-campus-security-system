from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.model import TrainedModel
from app.schemas.detection import NetworkRecordInput
from app.schemas.explainability import SHAPExplanationOut, LIMEExplanationOut
from app.explainability.xai import ExplainableAIEngine

router = APIRouter(prefix="/explainability", tags=["Explainable AI"])

@router.post("/shap", response_model=SHAPExplanationOut)
def explain_prediction_shap(
    payload: NetworkRecordInput,
    model_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    query = db.query(TrainedModel)
    if model_id:
        model_rec = query.filter(TrainedModel.id == model_id).first()
    else:
        model_rec = query.filter(TrainedModel.is_active == True).first() or query.order_by(TrainedModel.id.desc()).first()

    if not model_rec:
        raise HTTPException(status_code=404, detail="No trained model found for explainability calculation")

    engine = ExplainableAIEngine(model_rec.model_path, model_rec.scaler_path)
    # Infer prediction first
    from app.detection.engine import IntrusionDetectionEngine
    ids = IntrusionDetectionEngine(db, active_model_id=model_rec.id)
    inference = ids.analyze_record(payload.dict(), trigger_alert=False)

    explanation = engine.explain_with_shap(
        sample_dict=payload.dict(),
        predicted_class=inference["predicted_class"],
        confidence=inference["confidence"]
    )
    return SHAPExplanationOut(**explanation)

@router.post("/lime", response_model=LIMEExplanationOut)
def explain_prediction_lime(
    payload: NetworkRecordInput,
    model_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    query = db.query(TrainedModel)
    if model_id:
        model_rec = query.filter(TrainedModel.id == model_id).first()
    else:
        model_rec = query.filter(TrainedModel.is_active == True).first() or query.order_by(TrainedModel.id.desc()).first()

    if not model_rec:
        raise HTTPException(status_code=404, detail="No trained model found for explainability calculation")

    engine = ExplainableAIEngine(model_rec.model_path, model_rec.scaler_path)
    from app.detection.engine import IntrusionDetectionEngine
    ids = IntrusionDetectionEngine(db, active_model_id=model_rec.id)
    inference = ids.analyze_record(payload.dict(), trigger_alert=False)

    explanation = engine.explain_with_lime(
        sample_dict=payload.dict(),
        predicted_class=inference["predicted_class"],
        confidence=inference["confidence"]
    )
    return LIMEExplanationOut(**explanation)
