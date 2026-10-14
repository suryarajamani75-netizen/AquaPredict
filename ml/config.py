"""
AquaPredict Configuration Module
Defines constants, schema definitions, file paths, and hyperparameters.
"""

from pathlib import Path
from typing import Dict, List

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

# Default File Paths
DEFAULT_DATA_PATH = DATA_DIR / "water_potability.csv"
BEST_MODEL_FILENAME = "water_potability_pipeline.joblib"
BEST_MODEL_PATH = MODELS_DIR / BEST_MODEL_FILENAME

MODEL_COMPARISON_FILENAME = "model_comparison.json"
MODEL_COMPARISON_PATH = REPORTS_DIR / MODEL_COMPARISON_FILENAME

EVALUATION_REPORT_FILENAME = "evaluation_report.json"
EVALUATION_REPORT_PATH = REPORTS_DIR / EVALUATION_REPORT_FILENAME

TRAINING_METADATA_FILENAME = "training_metadata.json"
TRAINING_METADATA_PATH = REPORTS_DIR / TRAINING_METADATA_FILENAME

# Dataset Schema
TARGET_COLUMN: str = "Potability"
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
ALL_COLUMNS: List[str] = NUMERICAL_FEATURES + [TARGET_COLUMN]

# Column normalization map: canonical lowercased/whitespace-stripped mapping
COLUMN_NAME_MAP: Dict[str, str] = {
    "ph": "ph",
    "hardness": "Hardness",
    "solids": "Solids",
    "chloramines": "Chloramines",
    "sulfate": "Sulfate",
    "conductivity": "Conductivity",
    "organic_carbon": "Organic_carbon",
    "organic carbon": "Organic_carbon",
    "organiccarbon": "Organic_carbon",
    "trihalomethanes": "Trihalomethanes",
    "turbidity": "Turbidity",
    "potability": "Potability",
}

# Pipeline Hyperparameters and Seeds
RANDOM_SEED: int = 42
TEST_SIZE: float = 0.2
CV_FOLDS: int = 5

# Documented Model Selection Criterion:
# Water potability classification involves health-critical safety assessments.
# High F1-score balances precision (preventing false declaration of non-potable water as potable)
# and recall (accurately identifying potable water). ROC-AUC acts as the secondary tie-breaker.
PRIMARY_SELECTION_METRIC: str = "f1"
SECONDARY_SELECTION_METRIC: str = "roc_auc"

# Default Classifier Hyperparameters (tuned for balance and reproducibility)
MODEL_CONFIGS = {
    "LogisticRegression": {
        "max_iter": 1000,
        "class_weight": "balanced",
        "random_state": RANDOM_SEED,
    },
    "RandomForest": {
        "n_estimators": 200,
        "max_depth": 12,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "class_weight": "balanced",
        "random_state": RANDOM_SEED,
        "n_jobs": -1,
    },
    "GradientBoosting": {
        "n_estimators": 150,
        "learning_rate": 0.05,
        "max_depth": 5,
        "min_samples_split": 4,
        "min_samples_leaf": 2,
        "random_state": RANDOM_SEED,
    },
}
