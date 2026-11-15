from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class TrainedModel(Base):
    __tablename__ = "trained_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    algorithm = Column(String(50), nullable=False) # RandomForest, DecisionTree, SVM, IsolationForest, XGBoost
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    model_path = Column(String(255), nullable=False)
    scaler_path = Column(String(255), nullable=True)
    encoder_path = Column(String(255), nullable=True)
    feature_names = Column(Text, nullable=False) # JSON list
    target_names = Column(Text, nullable=False)  # JSON list
    hyperparameters = Column(Text)              # JSON dict
    
    # Core Research Metrics
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    false_positive_rate = Column(Float, nullable=False)
    detection_time_ms = Column(Float, nullable=False)
    training_duration_sec = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    metrics = relationship("ModelMetric", back_populates="model", uselist=False, cascade="all, delete-orphan")

class ModelMetric(Base):
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("trained_models.id"), nullable=False, unique=True)
    confusion_matrix_json = Column(Text, nullable=False)
    classification_report_json = Column(Text, nullable=False)
    roc_curve_json = Column(Text, nullable=True)
    pr_curve_json = Column(Text, nullable=True)
    feature_importance_json = Column(Text, nullable=True)
    per_class_metrics_json = Column(Text, nullable=False)
    
    model = relationship("TrainedModel", back_populates="metrics")

class ExperimentRun(Base):
    __tablename__ = "experiment_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    experiment_code = Column(String(50), nullable=False) # EXP-01 to EXP-10
    title = Column(String(200), nullable=False)
    description = Column(Text)
    dataset_name = Column(String(100))
    algorithm = Column(String(50))
    parameters_json = Column(Text)
    results_json = Column(Text)
    execution_time_sec = Column(Float, default=0.0)
    status = Column(String(20), default="COMPLETED")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
