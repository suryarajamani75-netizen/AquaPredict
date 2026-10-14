"""
AquaPredict Preprocessing Module
Constructs leakage-free preprocessing pipelines for numerical features.
"""

from typing import List
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from ml.config import NUMERICAL_FEATURES


def create_preprocessor(
    features: List[str] = NUMERICAL_FEATURES,
    impute_strategy: str = "median",
) -> ColumnTransformer:
    """
    Creates a scikit-learn ColumnTransformer for numerical feature preprocessing.

    Features are:
    1. Imputed using the specified strategy (default 'median' for robustness against outliers).
    2. Scaled using StandardScaler to ensure zero mean and unit variance.

    All fitting occurs strictly within the pipeline on the training set,
    preventing data leakage into validation or test sets.

    Args:
        features: List of column names to process.
        impute_strategy: Imputation strategy ('median', 'mean', etc.).

    Returns:
        ColumnTransformer ready to be embedded into an end-to-end Pipeline.
    """
    numerical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy=impute_strategy)),
            ("scaler", StandardScaler()),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline, features),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    return preprocessor
