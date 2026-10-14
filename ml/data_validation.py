"""
AquaPredict Dataset Validation Module
Validates the Water Potability dataset against required schema, integrity, and quality rules.
"""

from dataclasses import asdict, dataclass, field
import json
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from ml.config import (
    ALL_COLUMNS,
    COLUMN_NAME_MAP,
    DEFAULT_DATA_PATH,
    NUMERICAL_FEATURES,
    TARGET_COLUMN,
)


class DatasetValidationError(Exception):
    """Custom exception raised when dataset validation fails critically."""
    pass


@dataclass
class ValidationReport:
    """Detailed report resulting from dataset validation."""
    is_valid: bool
    status: str  # "PASS", "FAIL", "BLOCKED"
    file_path: str
    record_count: int = 0
    column_count: int = 0
    columns_found: List[str] = field(default_factory=list)
    normalized_columns: List[str] = field(default_factory=list)
    missing_columns: List[str] = field(default_factory=list)
    missing_values: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    duplicate_rows: int = 0
    class_distribution: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


def normalize_column_name(col: str) -> str:
    """
    Safely normalizes column names while preserving their standard meaning.
    Strips whitespace and maps case-insensitively to canonical column names.
    """
    clean_col = str(col).strip()
    lookup_key = clean_col.lower().replace(" ", "_")
    if lookup_key in COLUMN_NAME_MAP:
        return COLUMN_NAME_MAP[lookup_key]
    # Check without underscores
    lookup_key_no_us = lookup_key.replace("_", "")
    for k, v in COLUMN_NAME_MAP.items():
        if k.replace("_", "") == lookup_key_no_us:
            return v
    return clean_col


def normalize_dataframe_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str], List[str]]:
    """
    Renames columns of DataFrame to standard canonical names.
    Detects if multiple raw columns normalize to the same canonical name.
    Returns:
        (renamed_df, mapping, collision_errors)
    """
    mapping = {col: normalize_column_name(col) for col in df.columns}
    
    # Check for collisions: multiple raw columns mapping to the same target name
    reverse_map: Dict[str, List[str]] = {}
    for raw_col, norm_col in mapping.items():
        reverse_map.setdefault(norm_col, []).append(str(raw_col))
    
    collision_errors = []
    for norm_col, raw_cols in reverse_map.items():
        if len(raw_cols) > 1 and norm_col in ALL_COLUMNS:
            collision_errors.append(
                f"Column name collision: multiple columns {raw_cols} normalize to the same canonical column '{norm_col}'."
            )
            
    renamed_df = df.rename(columns=mapping)
    return renamed_df, mapping, collision_errors


def validate_dataset(
    file_path: Union[str, Path] = DEFAULT_DATA_PATH,
    df: Optional[pd.DataFrame] = None,
) -> Tuple[ValidationReport, Optional[pd.DataFrame]]:
    """
    Performs comprehensive dataset validation according to AquaPredict Phase 1 requirements.

    Checks:
    - File existence
    - Empty dataset
    - Required columns
    - Column name collisions
    - Data types (features must be numeric, finite, physically plausible)
    - Missing values (detected and profiled)
    - Duplicate rows
    - Invalid target labels (must be 0 or 1, no NaNs, both classes present)
    - Number of records
    - Target class distribution

    Returns:
        Tuple of (ValidationReport, Optional[pd.DataFrame]).
        If validation fails or file is blocked, DataFrame will be None.
    """
    path_obj = Path(file_path) if isinstance(file_path, (str, Path)) else None
    path_str = str(path_obj) if path_obj else "in-memory-dataframe"

    report = ValidationReport(
        is_valid=False,
        status="FAIL",
        file_path=path_str,
    )

    # 1. File existence check (if df not provided)
    if df is None:
        if not path_obj or not path_obj.exists():
            report.status = "BLOCKED"
            report.errors.append(
                f"Dataset file does not exist at '{path_str}'. "
                "Real-data training is BLOCKED. "
                "Download the genuine Water Potability dataset from Kaggle "
                "(https://www.kaggle.com/datasets/adityakadiwal/water-potability) "
                f"and save it to '{path_str}'."
            )
            return report, None

        if path_obj.stat().st_size == 0:
            report.status = "FAIL"
            report.errors.append(f"Dataset file at '{path_str}' is empty (0 bytes).")
            return report, None

        try:
            df = pd.read_csv(path_obj)
        except Exception as e:
            report.status = "FAIL"
            report.errors.append(f"Failed to read CSV dataset: {str(e)}")
            return report, None

    # 2. Empty dataset check
    report.record_count = len(df)
    report.columns_found = [str(c) for c in df.columns]

    if report.record_count == 0:
        report.status = "FAIL"
        report.errors.append("Dataset contains 0 rows (empty dataset).")
        return report, None

    # 3. Column normalization and collision check
    normalized_df, col_mapping, collisions = normalize_dataframe_columns(df)
    report.normalized_columns = [str(c) for c in normalized_df.columns]
    report.column_count = len(normalized_df.columns)

    if collisions:
        report.status = "FAIL"
        report.is_valid = False
        report.errors.extend(collisions)
        return report, None

    missing_cols = [col for col in ALL_COLUMNS if col not in normalized_df.columns]
    report.missing_columns = missing_cols
    if missing_cols:
        report.status = "FAIL"
        report.errors.append(
            f"Dataset is missing required columns: {missing_cols}. "
            f"Expected schema: {ALL_COLUMNS}"
        )
        return report, None

    # 4. Check for duplicate rows
    duplicate_count = int(normalized_df.duplicated().sum())
    report.duplicate_rows = duplicate_count
    if duplicate_count > 0:
        report.warnings.append(
            f"Dataset contains {duplicate_count} duplicate rows ({duplicate_count / report.record_count * 100:.2f}%)."
        )

    # 5. Invalid data types, infinities, and physical range checks on numerical features
    for col in NUMERICAL_FEATURES:
        series = normalized_df[col]
        # Check if non-numeric
        numeric_series = pd.to_numeric(series, errors="coerce")
        non_numeric = numeric_series.isna() & series.notna()
        non_numeric_count = int(non_numeric.sum())
        if non_numeric_count > 0:
            sample_invalid = series[non_numeric].head(3).tolist()
            report.errors.append(
                f"Column '{col}' contains {non_numeric_count} non-numeric values. Examples: {sample_invalid}"
            )
            continue

        # Check for infinities (inf or -inf)
        inf_mask = np.isinf(numeric_series)
        inf_count = int(inf_mask.sum())
        if inf_count > 0:
            report.errors.append(
                f"Column '{col}' contains {inf_count} infinite values (inf/-inf). Physical measurements must be finite."
            )
            continue

        # Physical range checks
        valid_values = numeric_series.dropna()
        if col == "ph":
            out_of_bounds = (valid_values < 0.0) | (valid_values > 14.0)
            if out_of_bounds.any():
                invalid_ph_samples = valid_values[out_of_bounds].head(3).tolist()
                report.errors.append(
                    f"Column 'ph' contains values outside the plausible chemical pH range [0, 14]: {invalid_ph_samples}"
                )
        else:
            negative_values = valid_values < 0.0
            if negative_values.any():
                invalid_samples = valid_values[negative_values].head(3).tolist()
                report.errors.append(
                    f"Column '{col}' contains negative values which are physically impossible for concentration/conductance metrics: {invalid_samples}"
                )

    # 6. Target column integrity check
    target_series = normalized_df[TARGET_COLUMN]
    target_nan_count = int(target_series.isna().sum())
    if target_nan_count > 0:
        report.errors.append(
            f"Target column '{TARGET_COLUMN}' contains {target_nan_count} missing (NaN) values. "
            "Target labels cannot be imputed."
        )

    # Validate target values are valid binary (0 and 1)
    converted_target = pd.to_numeric(target_series, errors="coerce")
    invalid_target_types = converted_target.isna() & target_series.notna()
    if invalid_target_types.any():
        report.errors.append(
            f"Target column '{TARGET_COLUMN}' contains non-numeric values: "
            f"{target_series[invalid_target_types].head(3).tolist()}"
        )
    else:
        valid_targets = converted_target.dropna()
        unique_targets = set(valid_targets.unique())
        if not unique_targets.issubset({0, 1, 0.0, 1.0}):
            report.errors.append(
                f"Target column '{TARGET_COLUMN}' contains invalid target values: {unique_targets}. "
                "Expected binary values in {0, 1}."
            )
        elif len(unique_targets) < 2 and report.record_count > 1:
            report.errors.append(
                f"Target column '{TARGET_COLUMN}' contains only one class ({unique_targets}). "
                "Both potable (1) and non-potable (0) classes are required for binary classification."
            )

    # 7. Missing values profiling
    for col in ALL_COLUMNS:
        null_count = int(normalized_df[col].isna().sum())
        null_pct = float((null_count / report.record_count) * 100) if report.record_count > 0 else 0.0
        report.missing_values[col] = {
            "null_count": null_count,
            "null_percentage": round(null_pct, 2),
        }
        if null_count > 0 and col != TARGET_COLUMN:
            report.warnings.append(
                f"Feature '{col}' has {null_count} missing values ({null_pct:.2f}%). "
                "Imputation will be handled within the scikit-learn training pipeline."
            )

    # 8. Target class distribution
    if not report.errors and TARGET_COLUMN in normalized_df.columns:
        counts = normalized_df[TARGET_COLUMN].value_counts().to_dict()
        total_valid = sum(counts.values())
        for cls_label, count in counts.items():
            str_key = str(int(cls_label))
            report.class_distribution[str_key] = {
                "count": int(count),
                "percentage": round(float((count / total_valid) * 100), 2),
            }

    # Final status determination
    if report.errors:
        report.status = "FAIL"
        report.is_valid = False
        return report, None

    report.status = "PASS"
    report.is_valid = True
    return report, normalized_df


def main():
    """CLI runner for dataset validation."""
    data_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DATA_PATH
    print(f"=== AquaPredict Dataset Validation: {data_path} ===")
    report, _ = validate_dataset(data_path)
    print(report.to_json())
    if report.status == "PASS":
        print("\n[RESULT] Dataset Validation PASSED.")
        sys.exit(0)
    elif report.status == "BLOCKED":
        print("\n[RESULT] Dataset Validation BLOCKED (Dataset missing).")
        sys.exit(2)
    else:
        print("\n[RESULT] Dataset Validation FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()
