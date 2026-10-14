"""
AquaPredict Model Evaluation Module
Calculates performance metrics from actual model predictions on held-out test data.
Never hardcodes or fabricates metrics.
"""

from typing import Any, Dict
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def evaluate_model(model, X_test, y_test) -> Dict[str, Any]:
    """
    Evaluates a trained model pipeline on held-out test data.

    Calculates:
    - Accuracy
    - Precision
    - Recall
    - F1-Score
    - ROC-AUC (if probabilities are available)
    - Confusion Matrix ([[TN, FP], [FN, TP]])
    - Detailed per-class classification report

    Args:
        model: Fitted scikit-learn Pipeline or estimator.
        X_test: Held-out features DataFrame or array.
        y_test: True target labels.

    Returns:
        Dictionary containing verified evaluation metrics.
    """
    y_pred = model.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, pos_label=1, zero_division=0))
    rec = float(recall_score(y_test, y_pred, pos_label=1, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, pos_label=1, zero_division=0))

    roc_auc = None
    if hasattr(model, "predict_proba"):
        try:
            unique_classes = np.unique(y_test)
            if len(unique_classes) > 1:
                y_proba = model.predict_proba(X_test)
                if y_proba.shape[1] > 1:
                    roc_auc = float(roc_auc_score(y_test, y_proba[:, 1]))
        except Exception:
            roc_auc = None

    # Guarantee consistent 2x2 binary confusion matrix [[TN, FP], [FN, TP]]
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    # Convert numpy int64 to native python int for json serialization
    cm_list = [[int(cell) for cell in row] for row in cm]

    clf_report = classification_report(y_test, y_pred, labels=[0, 1], output_dict=True, zero_division=0)

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "confusion_matrix": cm_list,
        "classification_report": clf_report,
    }
