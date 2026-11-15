import os
import joblib
import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from app.core.config import settings

FEATURE_COLUMNS = [
    'dur', 'proto', 'service', 'spkts', 'dpkts', 'sbytes', 'dbytes', 
    'rate', 'sttl', 'dttl', 'sload', 'dload', 'sloss', 'dloss', 
    'sjit', 'djit', 'swin', 'dwin', 'tcprtt', 'synack', 'ackdat', 
    'smean', 'dmean', 'ct_srv_src', 'ct_state_ttl', 'ct_dst_ltm', 
    'ct_src_dport_ltm', 'ct_dst_sport_ltm', 'ct_dst_src_ltm'
]

CATEGORICAL_COLS = ['proto', 'service']
NUMERICAL_COLS = [c for c in FEATURE_COLUMNS if c not in CATEGORICAL_COLS]

class DatasetPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.target_encoder = LabelEncoder()
        self.is_fitted = False

    def fit_transform(
        self, 
        df: pd.DataFrame, 
        target_col: str = 'attack_cat',
        test_size: float = 0.25,
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str], List[str]]:
        """Clean, encode, scale, and split dataset with zero data leakage."""
        df_clean = df.copy()
        
        # 1. Deduplicate & Handle Missing
        df_clean = df_clean.drop_duplicates()
        df_clean = df_clean.dropna(subset=[target_col])
        
        # Ensure all required features are present
        available_features = [c for c in FEATURE_COLUMNS if c in df_clean.columns]
        
        # Impute missing numericals with median
        for col in NUMERICAL_COLS:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(df_clean[col].median())
        
        # Impute missing categoricals with '-'
        for col in CATEGORICAL_COLS:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].astype(str).fillna('-')

        # 2. Encode Categoricals
        X_df = df_clean[available_features].copy()
        for col in CATEGORICAL_COLS:
            if col in X_df.columns:
                le = LabelEncoder()
                X_df[col] = le.fit_transform(X_df[col])
                self.label_encoders[col] = le
        
        # 3. Encode Target
        y_raw = df_clean[target_col].astype(str)
        y = self.target_encoder.fit_transform(y_raw)
        target_names = list(self.target_encoder.classes_)

        # 4. Stratified Split
        X_train_df, X_test_df, y_train, y_test = train_test_split(
            X_df, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # 5. Scale features using train statistics only (prevent data leakage)
        X_train = self.scaler.fit_transform(X_train_df)
        X_test = self.scaler.transform(X_test_df)
        
        self.is_fitted = True
        return X_train, X_test, y_train, y_test, available_features, target_names

    def transform_single(self, record_dict: Dict[str, Any], feature_names: List[str]) -> np.ndarray:
        """Preprocess a single incoming network flow record for real-time inference."""
        row = {}
        for feat in feature_names:
            val = record_dict.get(feat, 0)
            if feat in CATEGORICAL_COLS and feat in self.label_encoders:
                le = self.label_encoders[feat]
                try:
                    row[feat] = le.transform([str(val)])[0]
                except Exception:
                    # Unseen category fallback
                    row[feat] = 0
            else:
                try:
                    row[feat] = float(val)
                except Exception:
                    row[feat] = 0.0
                    
        feat_df = pd.DataFrame([row])[feature_names]
        scaled = self.scaler.transform(feat_df)
        return scaled

    def save(self, filepath: str):
        joblib.dump({
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'target_encoder': self.target_encoder,
            'is_fitted': self.is_fitted
        }, filepath)

    @classmethod
    def load(cls, filepath: str) -> 'DatasetPreprocessor':
        data = joblib.load(filepath)
        obj = cls()
        obj.scaler = data['scaler']
        obj.label_encoders = data['label_encoders']
        obj.target_encoder = data['target_encoder']
        obj.is_fitted = data['is_fitted']
        return obj
