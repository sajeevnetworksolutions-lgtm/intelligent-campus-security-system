from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ModelTrainRequest(BaseModel):
    name: str
    algorithm: str # RandomForest, DecisionTree, SVM, IsolationForest, XGBoost
    dataset_id: int
    test_size: Optional[float] = 0.25
    random_state: Optional[int] = 42
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelMetricsOut(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    detection_time_ms: float
    training_duration_sec: float
    confusion_matrix: List[List[int]]
    target_names: List[str]
    classification_report: Dict[str, Any]
    per_class_metrics: Dict[str, Dict[str, float]]
    feature_importance: Optional[Dict[str, float]] = None

class TrainedModelOut(BaseModel):
    id: int
    name: str
    algorithm: str
    dataset_id: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    detection_time_ms: float
    training_duration_sec: float
    is_active: bool
    feature_names: List[str]
    target_names: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ModelComparisonItem(BaseModel):
    algorithm: str
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    detection_time_ms: float
    training_duration_sec: float
    rank_score: float
    is_recommended: bool
