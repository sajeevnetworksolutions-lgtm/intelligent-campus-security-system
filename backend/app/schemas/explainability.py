from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class FeatureContribution(BaseModel):
    feature: str
    value: Any
    contribution: float # Positive increases risk/attack likelihood, negative decreases
    description: str

class SHAPExplanationOut(BaseModel):
    model_name: str
    predicted_class: str
    confidence: float
    base_value: float
    feature_contributions: List[FeatureContribution]
    summary_text: str
    graph_base64: Optional[str] = None

class LIMEExplanationOut(BaseModel):
    model_name: str
    predicted_class: str
    probability: float
    local_prediction: float
    intercept: float
    rules: List[Dict[str, Any]]
    explanation_text: str
    graph_base64: Optional[str] = None
