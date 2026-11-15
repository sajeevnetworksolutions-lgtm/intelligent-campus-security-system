from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database.session import Base

class DatasetRecord(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    target_column = Column(String(50), default="attack_cat")
    features_json = Column(Text)       # JSON list of column names
    class_distribution = Column(Text)  # JSON dict of classes and counts
    missing_values_count = Column(Integer, default=0)
    duplicate_rows_count = Column(Integer, default=0)
    is_validated = Column(Boolean, default=False)
    is_benchmark = Column(Boolean, default=False)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
