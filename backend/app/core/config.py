import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Intelligent Campus Security System for Cybersecurity Applications"
    PROJECT_SUBTITLE: str = "M.Tech CSE Project - SSIT Tumakuru"
    STUDENT_NAME: str = "Nalina G"
    STUDENT_USN: str = "25CSE09"
    GUIDE_NAME: str = "Dr. Nirmala G, Associate Professor"
    INSTITUTION: str = "Sri Siddhartha Institute of Technology (SSIT), Tumakuru"
    UNIVERSITY: str = "Sri Siddhartha Academy of Higher Education (SSAHE)"
    
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campus-cybersecurity-secret-key-mtech-2026-ssit-secure-token")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'campus_security.db'))}"
    )
    
    # Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    DATASETS_DIR: str = os.path.join(BASE_DIR, "datasets")
    RAW_DATASETS_DIR: str = os.path.join(DATASETS_DIR, "raw")
    PROCESSED_DATASETS_DIR: str = os.path.join(DATASETS_DIR, "processed")
    MODELS_DIR: str = os.path.join(BASE_DIR, "ml_models")
    TRAINED_MODELS_DIR: str = os.path.join(MODELS_DIR, "trained")
    RESULTS_DIR: str = os.path.join(BASE_DIR, "results")
    GRAPHS_DIR: str = os.path.join(RESULTS_DIR, "graphs")
    REPORTS_DIR: str = os.path.join(RESULTS_DIR, "reports")
    
    # Risk Thresholds
    RISK_LOW_MAX: float = 35.0
    RISK_MEDIUM_MAX: float = 65.0
    RISK_HIGH_MAX: float = 85.0

settings = Settings()

# Ensure directories exist
for p in [settings.RAW_DATASETS_DIR, settings.PROCESSED_DATASETS_DIR, 
          settings.TRAINED_MODELS_DIR, settings.GRAPHS_DIR, settings.REPORTS_DIR]:
    os.makedirs(p, exist_ok=True)
