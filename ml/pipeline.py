"""
AquaPredict Model Pipeline Factory
Constructs end-to-end scikit-learn Pipelines combining preprocessing and classification models.
"""

from typing import Any, Dict
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ml.config import MODEL_CONFIGS
from ml.preprocessing import create_preprocessor

SUPPORTED_MODELS = ["LogisticRegression", "RandomForest", "GradientBoosting"]


def get_classifier(model_name: str, custom_params: Dict[str, Any] = None):
    """
    Instantiates a classifier with default or custom configuration.
    """
    params = MODEL_CONFIGS.get(model_name, {}).copy()
    if custom_params:
        params.update(custom_params)

    if model_name == "LogisticRegression":
        return LogisticRegression(**params)
    elif model_name == "RandomForest":
        return RandomForestClassifier(**params)
    elif model_name == "GradientBoosting":
        return GradientBoostingClassifier(**params)
    else:
        raise ValueError(
            f"Unsupported model name: '{model_name}'. "
            f"Supported models are: {SUPPORTED_MODELS}"
        )


def build_pipeline(model_name: str, custom_params: Dict[str, Any] = None) -> Pipeline:
    """
    Constructs an end-to-end scikit-learn Pipeline with preprocessing and classifier.

    Args:
        model_name: One of 'LogisticRegression', 'RandomForest', 'GradientBoosting'.
        custom_params: Optional dictionary of hyperparameters to override defaults.

    Returns:
        Configured scikit-learn Pipeline.
    """
    preprocessor = create_preprocessor()
    classifier = get_classifier(model_name, custom_params)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    return pipeline
