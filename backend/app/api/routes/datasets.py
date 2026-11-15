import os
import json
import shutil
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.dataset import DatasetRecord
from app.models.security import AuditLog
from app.schemas.dataset import DatasetOut, DatasetValidationResult

router = APIRouter(prefix="/datasets", tags=["Dataset Management"])

@router.get("", response_model=List[DatasetOut])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    records = db.query(DatasetRecord).order_by(DatasetRecord.id.desc()).all()
    results = []
    for r in records:
        results.append(DatasetOut(
            id=r.id,
            name=r.name,
            filename=r.filename,
            file_size_bytes=r.file_size_bytes,
            row_count=r.row_count,
            col_count=r.col_count,
            target_column=r.target_column,
            features=json.loads(r.features_json) if r.features_json else [],
            class_distribution=json.loads(r.class_distribution) if r.class_distribution else {},
            missing_values_count=r.missing_values_count,
            duplicate_rows_count=r.duplicate_rows_count,
            is_validated=r.is_validated,
            is_benchmark=r.is_benchmark,
            description=r.description,
            created_at=r.created_at
        ))
    return results

@router.post("/upload", response_model=DatasetOut)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    target_column: str = Form("attack_cat"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    safe_filename = f"{name.replace(' ', '_').lower()}_{file.filename}"
    save_path = os.path.join(settings.RAW_DATASETS_DIR, safe_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)

    # Validate and parse CSV
    try:
        df = pd.read_csv(save_path)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    row_count, col_count = df.shape
    columns = list(df.columns)
    
    # Check target
    target_col = target_column if target_column in columns else ("label" if "label" in columns else columns[-1])
    class_dist = df[target_col].value_counts().to_dict()
    missing_cnt = int(df.isnull().sum().sum())
    duplicate_cnt = int(df.duplicated().sum())

    dataset_rec = DatasetRecord(
        name=name,
        filename=safe_filename,
        file_path=save_path,
        file_size_bytes=file_size,
        row_count=row_count,
        col_count=col_count,
        target_column=target_col,
        features_json=json.dumps(columns),
        class_distribution=json.dumps({str(k): int(v) for k, v in class_dist.items()}),
        missing_values_count=missing_cnt,
        duplicate_rows_count=duplicate_cnt,
        is_validated=True,
        is_benchmark=False,
        description=description or "Uploaded dataset for campus security analysis"
    )
    db.add(dataset_rec)
    db.commit()
    db.refresh(dataset_rec)

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="UPLOAD_DATASET",
        resource=f"DATASET:{name}",
        details_json=json.dumps({"rows": row_count, "cols": col_count})
    )
    db.add(audit)
    db.commit()

    return DatasetOut(
        id=dataset_rec.id,
        name=dataset_rec.name,
        filename=dataset_rec.filename,
        file_size_bytes=dataset_rec.file_size_bytes,
        row_count=dataset_rec.row_count,
        col_count=dataset_rec.col_count,
        target_column=dataset_rec.target_column,
        features=columns,
        class_distribution={str(k): int(v) for k, v in class_dist.items()},
        missing_values_count=missing_cnt,
        duplicate_rows_count=duplicate_cnt,
        is_validated=True,
        is_benchmark=False,
        description=dataset_rec.description,
        created_at=dataset_rec.created_at
    )

@router.get("/{dataset_id}/validation", response_model=DatasetValidationResult)
def validate_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    dataset_rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not dataset_rec:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = pd.read_csv(dataset_rec.file_path)
    missing_dict = {col: int(df[col].isnull().sum()) for col in df.columns if df[col].isnull().sum() > 0}
    
    target_col = dataset_rec.target_column
    class_dist = df[target_col].value_counts().to_dict() if target_col in df.columns else {}
    preview_df = df.head(10).fillna("null")

    warnings = []
    if len(df) < 500:
        warnings.append("Dataset sample size is small (<500 records); model generalization may be limited.")
    if dataset_rec.duplicate_rows_count > 0:
        warnings.append(f"{dataset_rec.duplicate_rows_count} duplicate rows detected. Automatic deduplication will apply during preprocessing.")

    return DatasetValidationResult(
        is_valid=True,
        row_count=len(df),
        col_count=len(df.columns),
        columns=list(df.columns),
        missing_values=missing_dict,
        duplicate_count=dataset_rec.duplicate_rows_count,
        suggested_target=target_col,
        detected_classes={str(k): int(v) for k, v in class_dist.items()},
        preview_rows=preview_df.to_dict(orient="records"),
        warnings=warnings
    )

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator"]))
):
    dataset_rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not dataset_rec:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if os.path.exists(dataset_rec.file_path):
        os.remove(dataset_rec.file_path)

    db.delete(dataset_rec)
    db.commit()

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="DELETE_DATASET",
        resource=f"DATASET:{dataset_rec.name}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Dataset {dataset_rec.name} deleted successfully"}
