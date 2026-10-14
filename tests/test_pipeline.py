"""
Unit tests for AquaPredict ML pipeline, metric evaluation, serialization, and loading.
Uses temporary fixtures and mock data.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest

from ml.config import NUMERICAL_FEATURES, TARGET_COLUMN
from ml.evaluate import evaluate_model
from ml.pipeline import SUPPORTED_MODELS, build_pipeline
from ml.preprocessing import create_preprocessor
from ml.train import TrainingBlockedError, run_training_pipeline


@pytest.fixture
def mock_training_data() -> pd.DataFrame:
    """Fixture providing a synthetic dataset for testing pipeline training."""
    np.random.seed(42)
    n_samples = 120
    data = {
        "ph": np.random.uniform(5.0, 9.0, size=n_samples),
        "Hardness": np.random.uniform(120.0, 280.0, size=n_samples),
        "Solids": np.random.uniform(15000.0, 25000.0, size=n_samples),
        "Chloramines": np.random.uniform(5.0, 9.0, size=n_samples),
        "Sulfate": np.random.uniform(250.0, 400.0, size=n_samples),
        "Conductivity": np.random.uniform(300.0, 550.0, size=n_samples),
        "Organic_carbon": np.random.uniform(8.0, 18.0, size=n_samples),
        "Trihalomethanes": np.random.uniform(40.0, 90.0, size=n_samples),
        "Turbidity": np.random.uniform(2.0, 5.0, size=n_samples),
        "Potability": np.random.choice([0, 1], size=n_samples, p=[0.6, 0.4]),
    }
    df = pd.DataFrame(data)
    # Introduce realistic missing values into ph, Sulfate, Trihalomethanes
    df.loc[0:10, "ph"] = np.nan
    df.loc[5:15, "Sulfate"] = np.nan
    df.loc[12:18, "Trihalomethanes"] = np.nan
    return df


def test_preprocessor_handles_missing_values(mock_training_data: pd.DataFrame):
    """Verifies that create_preprocessor imputes and scales features without raising errors."""
    X = mock_training_data[NUMERICAL_FEATURES]
    preprocessor = create_preprocessor()

    # Verify fit and transform
    transformed = preprocessor.fit_transform(X)
    assert transformed.shape == X.shape
    # Ensure no NaN remaining after transformation
    assert not np.isnan(transformed).any()


def test_all_candidate_models_build():
    """Verifies that build_pipeline correctly initializes each supported model architecture."""
    for model_name in SUPPORTED_MODELS:
        pipeline = build_pipeline(model_name)
        assert hasattr(pipeline, "fit")
        assert hasattr(pipeline, "predict")
        assert pipeline.named_steps["classifier"].__class__.__name__ in [
            "LogisticRegression",
            "RandomForestClassifier",
            "GradientBoostingClassifier",
        ]


def test_metric_generation(mock_training_data: pd.DataFrame):
    """Verifies that evaluate_model calculates actual, non-hardcoded performance metrics."""
    X = mock_training_data[NUMERICAL_FEATURES]
    y = mock_training_data[TARGET_COLUMN]

    pipeline = build_pipeline("RandomForest")
    pipeline.fit(X, y)

    metrics = evaluate_model(pipeline, X, y)

    # Check that all required metrics exist
    for metric_name in ["accuracy", "precision", "recall", "f1", "roc_auc", "confusion_matrix", "classification_report"]:
        assert metric_name in metrics, f"Missing metric: {metric_name}"

    # Verify metric value bounds
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert 0.0 <= metrics["precision"] <= 1.0
    assert 0.0 <= metrics["recall"] <= 1.0
    assert 0.0 <= metrics["f1"] <= 1.0
    assert 0.0 <= metrics["roc_auc"] <= 1.0

    # Verify confusion matrix structure
    cm = metrics["confusion_matrix"]
    assert len(cm) == 2
    assert len(cm[0]) == 2
    assert len(cm[1]) == 2
    assert sum(cm[0]) + sum(cm[1]) == len(y)


def test_training_pipeline_with_mock_fixture(tmp_path: Path, mock_training_data: pd.DataFrame):
    """
    Executes a complete training experiment using a mock dataset fixture.
    Verifies model comparison, best model selection, and artifact generation.
    """
    model_file = tmp_path / "models" / "best_model.joblib"
    comparison_file = tmp_path / "reports" / "model_comparison.json"
    eval_file = tmp_path / "reports" / "evaluation_report.json"
    meta_file = tmp_path / "reports" / "training_metadata.json"

    result = run_training_pipeline(
        df=mock_training_data,
        model_output_path=model_file,
        model_comparison_path=comparison_file,
        evaluation_report_path=eval_file,
        metadata_path=meta_file,
    )

    assert result["status"] == "SUCCESS"
    assert result["best_model_name"] in SUPPORTED_MODELS
    assert model_file.exists()
    assert comparison_file.exists()
    assert eval_file.exists()
    assert meta_file.exists()

    # Check model comparison content
    comp = result["model_comparison"]
    for m in SUPPORTED_MODELS:
        assert m in comp["models"]
        assert "f1" in comp["models"][m]


def test_model_serialization_and_loading(tmp_path: Path, mock_training_data: pd.DataFrame):
    """
    Verifies that the serialized Joblib pipeline can be loaded and make valid inference.
    """
    model_file = tmp_path / "models" / "test_pipeline.joblib"
    run_training_pipeline(
        df=mock_training_data,
        model_output_path=model_file,
        model_comparison_path=tmp_path / "comp.json",
        evaluation_report_path=tmp_path / "eval.json",
        metadata_path=tmp_path / "meta.json",
    )

    # Load serialized model
    loaded_pipeline = joblib.load(model_file)
    assert hasattr(loaded_pipeline, "predict")
    assert hasattr(loaded_pipeline, "predict_proba")

    # Predict on test sample containing some missing values
    sample = pd.DataFrame([{
        "ph": np.nan,  # tests imputation at inference time
        "Hardness": 200.0,
        "Solids": 20000.0,
        "Chloramines": 7.0,
        "Sulfate": np.nan,
        "Conductivity": 400.0,
        "Organic_carbon": 15.0,
        "Trihalomethanes": 70.0,
        "Turbidity": 3.5,
    }])

    pred = loaded_pipeline.predict(sample)
    proba = loaded_pipeline.predict_proba(sample)

    assert pred[0] in [0, 1]
    assert proba.shape == (1, 2)
    assert np.isclose(np.sum(proba[0]), 1.0)


def test_training_blocked_when_dataset_missing(tmp_path: Path):
    """Verifies that training raises TrainingBlockedError when real data file is absent."""
    non_existent = tmp_path / "non_existent.csv"
    with pytest.raises(TrainingBlockedError) as exc_info:
        run_training_pipeline(data_path=non_existent)

    assert "BLOCKED" in str(exc_info.value)


def test_feature_column_order_invariance(mock_training_data: pd.DataFrame):
    """Verifies that ColumnTransformer correctly selects features by name regardless of column order."""
    X = mock_training_data[NUMERICAL_FEATURES]
    preprocessor = create_preprocessor()
    preprocessor.fit(X)

    # Reorder columns reversed
    reversed_cols = list(reversed(NUMERICAL_FEATURES))
    X_reversed = X[reversed_cols]

    # Both transformations should be identical
    out_orig = preprocessor.transform(X)
    out_rev = preprocessor.transform(X_reversed)
    assert np.allclose(out_orig, out_rev)


def test_preprocessor_excludes_extra_and_target_columns(mock_training_data: pd.DataFrame):
    """Verifies that preprocessor drops extra columns and prevents target column from leaking into features."""
    df_with_extra = mock_training_data.copy()
    df_with_extra["Extra_Irrelevant"] = 999.0

    preprocessor = create_preprocessor()
    preprocessor.fit(mock_training_data[NUMERICAL_FEATURES])

    # Transform DataFrame containing extra column and target
    transformed = preprocessor.transform(df_with_extra)
    assert transformed.shape[1] == len(NUMERICAL_FEATURES)


def test_evaluate_model_single_class_resilience(mock_training_data: pd.DataFrame):
    """Verifies that evaluate_model handles single-class test targets gracefully without crashing."""
    X = mock_training_data[NUMERICAL_FEATURES]
    y = mock_training_data[TARGET_COLUMN]

    pipeline = build_pipeline("LogisticRegression")
    pipeline.fit(X, y)

    # Held out slice with only class 1
    y_single_class = pd.Series([1] * 10)
    X_slice = X.head(10)

    metrics = evaluate_model(pipeline, X_slice, y_single_class)
    assert metrics["roc_auc"] is None  # ROC-AUC undefined for single class
    assert len(metrics["confusion_matrix"]) == 2  # Guaranteed 2x2 shape
    assert len(metrics["confusion_matrix"][0]) == 2


def test_unsupported_model_raises_value_error():
    """Verifies that build_pipeline rejects unsupported classifier names."""
    with pytest.raises(ValueError) as exc:
        build_pipeline("DeepNeuralNetwork")
    assert "Unsupported model name" in str(exc.value)


def test_train_main_cli_blocked(monkeypatch, tmp_path: Path):
    """Verifies that train main() exits with code 2 when data file is absent."""
    import sys
    from ml.train import main as train_main

    non_existent = tmp_path / "absent.csv"
    monkeypatch.setattr(sys, "argv", ["train.py", "--data-path", str(non_existent)])

    with pytest.raises(SystemExit) as exc:
        train_main()
    assert exc.value.code == 2


def test_train_main_cli_success(monkeypatch, tmp_path: Path, mock_training_data: pd.DataFrame):
    """Verifies that train main() runs successfully and exits with code 0 on valid data."""
    import sys
    from ml.train import main as train_main

    valid_csv = tmp_path / "data" / "water_potability.csv"
    valid_csv.parent.mkdir(parents=True, exist_ok=True)
    mock_training_data.to_csv(valid_csv, index=False)

    monkeypatch.setattr(sys, "argv", ["train.py", "--data-path", str(valid_csv)])

    with pytest.raises(SystemExit) as exc:
        train_main()
    assert exc.value.code == 0


