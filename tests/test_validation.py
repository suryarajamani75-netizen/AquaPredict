"""
Unit tests for AquaPredict dataset validation.
Tests edge cases including missing dataset, missing columns, invalid target labels,
empty dataset, missing feature values, and invalid data types.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from ml.config import ALL_COLUMNS, NUMERICAL_FEATURES, TARGET_COLUMN
from ml.data_validation import (
    normalize_column_name,
    normalize_dataframe_columns,
    validate_dataset,
)


@pytest.fixture
def valid_mock_df() -> pd.DataFrame:
    """Fixture providing a valid synthetic dataset adhering to schema."""
    np.random.seed(42)
    n_rows = 50
    data = {
        "ph": np.random.uniform(0.0, 14.0, size=n_rows),
        "Hardness": np.random.uniform(100.0, 300.0, size=n_rows),
        "Solids": np.random.uniform(10000.0, 30000.0, size=n_rows),
        "Chloramines": np.random.uniform(4.0, 10.0, size=n_rows),
        "Sulfate": np.random.uniform(200.0, 450.0, size=n_rows),
        "Conductivity": np.random.uniform(200.0, 600.0, size=n_rows),
        "Organic_carbon": np.random.uniform(5.0, 25.0, size=n_rows),
        "Trihalomethanes": np.random.uniform(20.0, 100.0, size=n_rows),
        "Turbidity": np.random.uniform(1.0, 6.0, size=n_rows),
        "Potability": np.random.choice([0, 1], size=n_rows, p=[0.6, 0.4]),
    }
    return pd.DataFrame(data)


def test_missing_dataset(tmp_path: Path):
    """Checks that a non-existent dataset file is detected and marked as BLOCKED."""
    non_existent_file = tmp_path / "water_potability.csv"
    report, clean_df = validate_dataset(file_path=non_existent_file)

    assert report.is_valid is False
    assert report.status == "BLOCKED"
    assert clean_df is None
    assert any("does not exist" in err for err in report.errors)
    assert any("BLOCKED" in err for err in report.errors)


def test_empty_dataset_file(tmp_path: Path):
    """Checks that an empty 0-byte file fails validation."""
    empty_file = tmp_path / "empty.csv"
    empty_file.write_text("", encoding="utf-8")

    report, clean_df = validate_dataset(file_path=empty_file)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("empty (0 bytes)" in err for err in report.errors)


def test_empty_dataset_dataframe():
    """Checks that a 0-row dataframe fails validation."""
    empty_df = pd.DataFrame(columns=ALL_COLUMNS)
    report, clean_df = validate_dataset(df=empty_df)

    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("0 rows" in err for err in report.errors)


def test_missing_columns(valid_mock_df: pd.DataFrame):
    """Checks that missing required columns are detected and reported."""
    # Drop 'ph' and 'Potability'
    df_missing = valid_mock_df.drop(columns=["ph", "Potability"])
    report, clean_df = validate_dataset(df=df_missing)

    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert "ph" in report.missing_columns
    assert "Potability" in report.missing_columns
    assert any("missing required columns" in err for err in report.errors)


def test_invalid_target_labels(valid_mock_df: pd.DataFrame):
    """Checks that target labels other than 0 and 1 are rejected."""
    df_invalid_labels = valid_mock_df.copy()
    df_invalid_labels.loc[0, TARGET_COLUMN] = 99  # Invalid label

    report, clean_df = validate_dataset(df=df_invalid_labels)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("invalid target values" in err for err in report.errors)


def test_nan_in_target_column(valid_mock_df: pd.DataFrame):
    """Checks that NaN in target column is rejected since target cannot be imputed."""
    df_target_nan = valid_mock_df.copy()
    df_target_nan.loc[0, TARGET_COLUMN] = np.nan

    report, clean_df = validate_dataset(df=df_target_nan)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("missing (NaN) values" in err for err in report.errors)


def test_invalid_data_types(valid_mock_df: pd.DataFrame):
    """Checks that non-numeric values in numerical columns cause validation failure."""
    df_invalid_type = valid_mock_df.copy()
    df_invalid_type["ph"] = df_invalid_type["ph"].astype(object)
    df_invalid_type.loc[0, "ph"] = "invalid_ph_string"

    report, clean_df = validate_dataset(df=df_invalid_type)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("Column 'ph' contains" in err and "non-numeric" in err for err in report.errors)


def test_missing_feature_values(valid_mock_df: pd.DataFrame):
    """Checks that missing values in features are detected, profiled, and warned without failing."""
    df_with_nans = valid_mock_df.copy()
    df_with_nans.loc[0:4, "ph"] = np.nan
    df_with_nans.loc[2:6, "Sulfate"] = np.nan

    report, clean_df = validate_dataset(df=df_with_nans)
    assert report.is_valid is True
    assert report.status == "PASS"
    assert clean_df is not None
    assert report.missing_values["ph"]["null_count"] == 5
    assert report.missing_values["Sulfate"]["null_count"] == 5
    assert any("Feature 'ph' has 5 missing values" in w for w in report.warnings)


def test_column_name_normalization():
    """Checks that column names with mixed case, whitespace, or underscore variations are normalized."""
    variations = {
        "PH": "ph",
        "  hardness  ": "Hardness",
        "organic carbon": "Organic_carbon",
        "TRIHALOMETHANES": "Trihalomethanes",
        "potability": "Potability",
    }
    for raw, canonical in variations.items():
        assert normalize_column_name(raw) == canonical

    raw_df = pd.DataFrame({
        "PH": [7.0],
        "HARDNESS": [150.0],
        "Solids": [20000.0],
        "chloramines": [6.5],
        "Sulfate": [300.0],
        "Conductivity": [400.0],
        "organic carbon": [12.0],
        "trihalomethanes": [60.0],
        "TURBIDITY": [3.5],
        "potability": [1],
    })
    norm_df, _, collisions = normalize_dataframe_columns(raw_df)
    assert len(collisions) == 0
    for col in ALL_COLUMNS:
        assert col in norm_df.columns


def test_column_name_collision_detected():
    """Checks that multiple raw columns mapping to the same canonical column trigger an error."""
    collision_df = pd.DataFrame({
        "ph": [7.0],
        "PH": [7.1],
        "Hardness": [150.0],
        "Solids": [20000.0],
        "Chloramines": [6.5],
        "Sulfate": [300.0],
        "Conductivity": [400.0],
        "Organic_carbon": [12.0],
        "Trihalomethanes": [60.0],
        "Turbidity": [3.5],
        "Potability": [1],
    })
    report, clean_df = validate_dataset(df=collision_df)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("Column name collision" in err for err in report.errors)


def test_infinite_feature_values_rejected(valid_mock_df: pd.DataFrame):
    """Checks that infinite values in feature columns are rejected."""
    df_inf = valid_mock_df.copy()
    df_inf.loc[0, "Solids"] = np.inf
    report, clean_df = validate_dataset(df=df_inf)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("infinite values" in err for err in report.errors)


def test_out_of_bounds_ph_rejected(valid_mock_df: pd.DataFrame):
    """Checks that pH values outside [0, 14] are rejected."""
    df_ph_high = valid_mock_df.copy()
    df_ph_high.loc[0, "ph"] = 18.5  # Impossible pH
    report, clean_df = validate_dataset(df=df_ph_high)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("plausible chemical pH range" in err for err in report.errors)


def test_negative_feature_values_rejected(valid_mock_df: pd.DataFrame):
    """Checks that negative values in physical features like Turbidity or Sulfate are rejected."""
    df_neg = valid_mock_df.copy()
    df_neg.loc[0, "Turbidity"] = -4.2  # Impossible negative turbidity
    report, clean_df = validate_dataset(df=df_neg)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("negative values" in err for err in report.errors)


def test_single_class_target_rejected(valid_mock_df: pd.DataFrame):
    """Checks that a dataset where all target labels are 0 (or all 1) is rejected."""
    df_single_class = valid_mock_df.copy()
    df_single_class["Potability"] = 0
    report, clean_df = validate_dataset(df=df_single_class)
    assert report.is_valid is False
    assert report.status == "FAIL"
    assert clean_df is None
    assert any("contains only one class" in err for err in report.errors)


def test_duplicate_rows_detection(valid_mock_df: pd.DataFrame):
    """Checks that duplicate rows are detected and recorded in report warnings."""
    # Duplicate first row 3 times
    duplicated_df = pd.concat([valid_mock_df, valid_mock_df.iloc[[0]], valid_mock_df.iloc[[0]]], ignore_index=True)
    report, clean_df = validate_dataset(df=duplicated_df)

    assert report.is_valid is True
    assert report.duplicate_rows == 2
    assert any("duplicate rows" in w for w in report.warnings)


def test_valid_dataset_passes(valid_mock_df: pd.DataFrame):
    """Checks that clean valid dataset passes validation completely."""
    report, clean_df = validate_dataset(df=valid_mock_df)

    assert report.is_valid is True
    assert report.status == "PASS"
    assert clean_df is not None
    assert report.record_count == len(valid_mock_df)
    assert report.column_count == len(ALL_COLUMNS)
    assert "0" in report.class_distribution
    assert "1" in report.class_distribution


def test_data_validation_main_cli_blocked(monkeypatch, tmp_path: Path):
    """Verifies that data_validation main() exits with code 2 when dataset is missing."""
    import sys
    from ml.data_validation import main as val_main

    non_existent = tmp_path / "absent.csv"
    monkeypatch.setattr(sys, "argv", ["data_validation.py", str(non_existent)])

    with pytest.raises(SystemExit) as exc:
        val_main()
    assert exc.value.code == 2


def test_data_validation_main_cli_pass(monkeypatch, tmp_path: Path, valid_mock_df: pd.DataFrame):
    """Verifies that data_validation main() exits with code 0 when dataset is valid."""
    import sys
    from ml.data_validation import main as val_main

    valid_csv = tmp_path / "valid.csv"
    valid_mock_df.to_csv(valid_csv, index=False)
    monkeypatch.setattr(sys, "argv", ["data_validation.py", str(valid_csv)])

    with pytest.raises(SystemExit) as exc:
        val_main()
    assert exc.value.code == 0

