"""
AquaPredict Backend Configuration
Defines application settings, paths, CORS policies, and domain constants.
"""

import os
from pathlib import Path
from typing import Dict, List

# Project Root Resolution (resolved dynamically from this file's position)
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Application Metadata
APP_NAME: str = "AquaPredict API"
APP_VERSION: str = "0.2.0"
APP_DESCRIPTION: str = (
    "Production-grade REST API for predictive water quality and potability assessment. "
    "Powered by a trained machine-learning pipeline with leakage-free preprocessing."
)

# Model Artifact Path Resolution
DEFAULT_MODEL_PATH = PROJECT_ROOT / "models" / "water_potability_pipeline.joblib"
MODEL_PATH = Path(os.getenv("AQUAPREDICT_MODEL_PATH", str(DEFAULT_MODEL_PATH)))

# Environment & Server Settings
ENVIRONMENT: str = os.getenv("AQUAPREDICT_ENV", "development").lower()
API_V1_PREFIX: str = "/api/v1"

# CORS Configuration
# Restrictive development defaults for future frontend integration
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
env_cors = os.getenv("AQUAPREDICT_CORS_ORIGINS")
if env_cors:
    CORS_ORIGINS: List[str] = [origin.strip() for origin in env_cors.split(",") if origin.strip()]
else:
    CORS_ORIGINS = DEFAULT_CORS_ORIGINS

# Machine Learning Target & Class Mapping
LABEL_MAPPING: Dict[int, str] = {
    0: "Non-potable",
    1: "Potable",
}

# Canonical Feature Schema (order must match trained pipeline)
NUMERICAL_FEATURES: List[str] = [
    "ph",
    "Hardness",
    "Solids",
    "Chloramines",
    "Sulfate",
    "Conductivity",
    "Organic_carbon",
    "Trihalomethanes",
    "Turbidity",
]

# Water Safety & Legal Disclaimer
WATER_SAFETY_DISCLAIMER: str = (
    "This model prediction is a statistical estimate based on physical and chemical measurements "
    "and does NOT constitute certified biological, microbiological, or chemical laboratory testing. "
    "Water intended for municipal distribution or human consumption must comply with national and "
    "international regulatory laboratory standards (e.g., WHO, US EPA, BIS)."
)

# Batch Limit
MAX_BATCH_SIZE: int = 100
