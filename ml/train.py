"""
AquaPredict Training Pipeline
Orchestrates reproducible end-to-end model training, evaluation, comparison, selection,
and serialization with Joblib.
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Any, Dict, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from ml.config import (
    BEST_MODEL_PATH,
    DEFAULT_DATA_PATH,
    EVALUATION_REPORT_PATH,
    MODEL_COMPARISON_PATH,
    MODELS_DIR,
    NUMERICAL_FEATURES,
    PRIMARY_SELECTION_METRIC,
    RANDOM_SEED,
    REPORTS_DIR,
    SECONDARY_SELECTION_METRIC,
    TARGET_COLUMN,
    TEST_SIZE,
    TRAINING_METADATA_PATH,
)
from ml.data_validation import validate_dataset
from ml.evaluate import evaluate_model
from ml.pipeline import SUPPORTED_MODELS, build_pipeline


class TrainingBlockedError(Exception):
    """Raised when training cannot proceed due to missing real dataset."""
    pass


def run_training_pipeline(
    data_path: Union[str, Path] = DEFAULT_DATA_PATH,
    df: Optional[pd.DataFrame] = None,
    model_output_path: Path = BEST_MODEL_PATH,
    model_comparison_path: Path = MODEL_COMPARISON_PATH,
    evaluation_report_path: Path = EVALUATION_REPORT_PATH,
    metadata_path: Path = TRAINING_METADATA_PATH,
    random_seed: int = RANDOM_SEED,
) -> Dict[str, Any]:
    """
    Executes the reproducible training and evaluation pipeline.

    Steps:
    1. Validates dataset integrity.
    2. Splits data into train and test sets using stratification and fixed random seed.
    3. Trains all supported models (LogisticRegression, RandomForest, GradientBoosting).
    4. Evaluates all models strictly on held-out test data.
    5. Compares models based on primary (F1) and secondary (ROC-AUC) metrics.
    6. Serializes the best-performing pipeline using Joblib.
    7. Emits comparison, evaluation, and metadata reports.

    Args:
        data_path: Path to dataset CSV.
        df: Optional in-memory DataFrame (used for unit testing with fixtures).
        model_output_path: Path to write the best model joblib artifact.
        model_comparison_path: Path to write the model comparison JSON.
        evaluation_report_path: Path to write the winning model evaluation JSON.
        metadata_path: Path to write training metadata JSON.
        random_seed: Random seed for reproducibility.

    Returns:
        Summary dictionary containing training results, metrics, and artifact paths.
    """
    # 1. Validation
    validation_report, clean_df = validate_dataset(file_path=data_path, df=df)

    if validation_report.status == "BLOCKED":
        raise TrainingBlockedError(
            f"Training is BLOCKED: {'; '.join(validation_report.errors)}"
        )

    if validation_report.status != "PASS" or clean_df is None:
        raise ValueError(
            f"Training aborted due to validation failure: {'; '.join(validation_report.errors)}"
        )

    # 2. Train / Test Split
    X = clean_df[NUMERICAL_FEATURES]
    y = clean_df[TARGET_COLUMN].astype(int)

    # Determine stratification feasibility (requires at least 2 samples per class)
    class_counts = y.value_counts()
    can_stratify = len(class_counts) > 1 and all(count >= 2 for count in class_counts)
    stratify_target = y if can_stratify else None

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=random_seed,
        stratify=stratify_target,
    )

    # 3. Model Training & Evaluation
    model_results = {}
    fitted_pipelines = {}

    for model_name in SUPPORTED_MODELS:
        print(f"[*] Training pipeline for {model_name}...")
        pipeline = build_pipeline(model_name)
        pipeline.fit(X_train, y_train)
        fitted_pipelines[model_name] = pipeline

        metrics = evaluate_model(pipeline, X_test, y_test)
        model_results[model_name] = metrics
        print(
            f"    -> {model_name} Results: "
            f"Acc={metrics['accuracy']}, Prec={metrics['precision']}, "
            f"Rec={metrics['recall']}, F1={metrics['f1']}, ROC-AUC={metrics['roc_auc']}"
        )

    # 4. Model Selection Criterion
    # Selection: highest primary metric (F1-score); if tied, highest secondary metric (ROC-AUC)
    def model_rank_key(name: str):
        res = model_results[name]
        primary = res.get(PRIMARY_SELECTION_METRIC) or 0.0
        secondary = res.get(SECONDARY_SELECTION_METRIC) or 0.0
        return (primary, secondary)

    best_model_name = max(SUPPORTED_MODELS, key=model_rank_key)
    best_pipeline = fitted_pipelines[best_model_name]
    best_metrics = model_results[best_model_name]

    print(
        f"\n[+] Selected Best Model: {best_model_name} "
        f"({PRIMARY_SELECTION_METRIC.upper()}={best_metrics.get(PRIMARY_SELECTION_METRIC)}, "
        f"{SECONDARY_SELECTION_METRIC.upper()}={best_metrics.get(SECONDARY_SELECTION_METRIC)})"
    )

    # 5. Serialization and Artifact Creation
    # Ensure directories exist
    model_output_path.parent.mkdir(parents=True, exist_ok=True)
    model_comparison_path.parent.mkdir(parents=True, exist_ok=True)
    evaluation_report_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)

    # Save model pipeline
    joblib.dump(best_pipeline, model_output_path)
    print(f"[+] Serialized winning pipeline to: {model_output_path}")

    # Build model comparison document
    comparison_doc = {
        "selection_criterion": {
            "primary_metric": PRIMARY_SELECTION_METRIC,
            "secondary_metric": SECONDARY_SELECTION_METRIC,
            "rationale": (
                "Water potability prediction is a health-critical classification task. "
                "F1-score harmonizes precision (minimizing hazardous false-positive potable declarations) "
                "with recall (correctly identifying truly potable sources). "
                "ROC-AUC serves as ranking discriminator."
            ),
        },
        "best_model": best_model_name,
        "models": model_results,
    }
    with open(model_comparison_path, "w", encoding="utf-8") as f:
        json.dump(comparison_doc, f, indent=2)

    # Build evaluation report document
    eval_doc = {
        "best_model_name": best_model_name,
        "metrics": best_metrics,
        "test_records": len(X_test),
        "test_class_distribution": y_test.value_counts().to_dict(),
    }
    with open(evaluation_report_path, "w", encoding="utf-8") as f:
        json.dump(eval_doc, f, indent=2)

    # Build training metadata
    metadata_doc = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": sys.version,
        "random_seed": random_seed,
        "test_size": TEST_SIZE,
        "stratified_split": can_stratify,
        "dataset_path": str(data_path),
        "total_records": len(clean_df),
        "train_records": len(X_train),
        "test_records": len(X_test),
        "numerical_features": NUMERICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "class_distribution": validation_report.class_distribution,
        "missing_values_profile": validation_report.missing_values,
        "best_model_name": best_model_name,
        "best_model_path": str(model_output_path),
        "evaluation_report_path": str(evaluation_report_path),
        "model_comparison_path": str(model_comparison_path),
        "dataset_limitations": [
            "Missing values naturally occur in ph (~14%), Sulfate (~23%), and Trihalomethanes (~5%). Imputed using median within pipeline.",
            "Moderate class imbalance: potable samples (~39%) vs non-potable samples (~61%). Addressed via class_weight='balanced' where supported.",
            "Water potability dataset measurements are localized; physical distributions may vary significantly across geographical regions.",
        ],
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata_doc, f, indent=2)

    return {
        "status": "SUCCESS",
        "best_model_name": best_model_name,
        "best_metrics": best_metrics,
        "model_path": str(model_output_path),
        "model_comparison": comparison_doc,
        "metadata": metadata_doc,
    }


def main():
    """CLI entrypoint for AquaPredict model training."""
    parser = argparse.ArgumentParser(description="AquaPredict Phase 1 Model Training")
    parser.add_argument(
        "--data-path",
        type=str,
        default=str(DEFAULT_DATA_PATH),
        help=f"Path to dataset CSV (default: {DEFAULT_DATA_PATH})",
    )
    args = parser.parse_args()

    data_path = Path(args.data_path)
    print("=" * 60)
    print("AquaPredict Machine Learning Training Pipeline (Phase 1)")
    print(f"Dataset path: {data_path.resolve()}")
    print("=" * 60)

    try:
        result = run_training_pipeline(data_path=data_path)
        print("\n[SUCCESS] Model training and evaluation finished successfully.")
        print(f"Winning Model: {result['best_model_name']}")
        print(f"Metrics: {result['best_metrics']}")
        sys.exit(0)
    except TrainingBlockedError as e:
        print(f"\n[BLOCKED] {e}")
        print("\nACTION REQUIRED:")
        print("1. Download the real water_potability.csv dataset from Kaggle:")
        print("   https://www.kaggle.com/datasets/adityakadiwal/water-potability")
        print(f"2. Place the file at: {data_path.resolve()}")
        print("3. Re-run: python -m ml.train")
        sys.exit(2)
    except Exception as e:
        print(f"\n[FAIL] Training error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
