from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DatasetOut(BaseModel):
    id: int
    name: str
    filename: str
    file_size_bytes: int
    row_count: int
    col_count: int
    target_column: str
    features: List[str] = []
    class_distribution: Dict[str, int] = {}
    missing_values_count: int
    duplicate_rows_count: int
    is_validated: bool
    is_benchmark: bool
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetValidationResult(BaseModel):
    is_valid: bool
    row_count: int
    col_count: int
    columns: List[str]
    missing_values: Dict[str, int]
    duplicate_count: int
    suggested_target: str
    detected_classes: Dict[str, int]
    preview_rows: List[Dict[str, Any]]
    warnings: List[str] = []
