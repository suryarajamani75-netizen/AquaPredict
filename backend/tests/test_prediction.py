"""
Automated tests for water quality prediction endpoints (single and batch).
"""

from typing import Dict
from fastapi.testclient import TestClient
import numpy as np

from backend.app.model_service import model_service


def test_predict_single_valid_sample(client: TestClient, valid_sample_payload: Dict):
    """Verifies that POST /api/v1/predict returns valid prediction from the real model."""
    response = client.post("/api/v1/predict", json=valid_sample_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["prediction"] in [0, 1]
    assert data["predicted_label"] in ["Non-potable", "Potable"]
    assert "class_probabilities" in data

    probs = data["class_probabilities"]
    assert "non_potable" in probs
    assert "potable" in probs
    assert 0.0 <= probs["non_potable"] <= 1.0
    assert 0.0 <= probs["potable"] <= 1.0
    assert np.isclose(probs["non_potable"] + probs["potable"], 1.0, atol=1e-3)

    assert "RandomForest" in data["model_name"]
    assert "disclaimer" in data
    assert "laboratory" in data["disclaimer"].lower()


def test_predict_single_with_missing_features(client: TestClient, valid_sample_with_missing_payload: Dict):
    """Verifies that POST /api/v1/predict imputes missing values cleanly using median imputer."""
    response = client.post("/api/v1/predict", json=valid_sample_with_missing_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in [0, 1]
    assert data["predicted_label"] in ["Non-potable", "Potable"]


def test_predict_batch_valid_samples(client: TestClient, valid_sample_payload: Dict, valid_sample_with_missing_payload: Dict):
    """Verifies that POST /api/v1/predict/batch computes predictions for multiple records."""
    batch_payload = {
        "samples": [
            valid_sample_payload,
            valid_sample_with_missing_payload,
            valid_sample_payload,
        ]
    }
    response = client.post("/api/v1/predict/batch", json=batch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_samples"] == 3
    assert len(data["predictions"]) == 3
    for pred in data["predictions"]:
        assert pred["prediction"] in [0, 1]
        assert "class_probabilities" in pred


def test_predict_batch_empty_list_rejected(client: TestClient):
    """Verifies that an empty batch list is rejected with HTTP 422."""
    response = client.post("/api/v1/predict/batch", json={"samples": []})
    assert response.status_code == 422


def test_predict_batch_exceeding_max_limit_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that a batch exceeding 100 samples is rejected with HTTP 422."""
    oversized_samples = [valid_sample_payload] * 101
    response = client.post("/api/v1/predict/batch", json={"samples": oversized_samples})
    assert response.status_code == 422


def test_predict_returns_503_when_model_not_ready(client: TestClient, valid_sample_payload: Dict, monkeypatch):
    """Verifies that prediction returns HTTP 503 when the model is not loaded."""
    monkeypatch.setattr(model_service, "_is_ready", False)
    monkeypatch.setattr(model_service, "_load_error", "Model unloaded for test")

    response = client.post("/api/v1/predict", json=valid_sample_payload)
    assert response.status_code == 503
    assert "not ready" in response.json()["detail"].lower()


def test_predict_batch_returns_503_when_model_not_ready(client: TestClient, valid_sample_payload: Dict, monkeypatch):
    """Verifies that batch prediction returns HTTP 503 when the model is not loaded."""
    monkeypatch.setattr(model_service, "_is_ready", False)
    monkeypatch.setattr(model_service, "_load_error", "Model unloaded for test")

    response = client.post("/api/v1/predict/batch", json={"samples": [valid_sample_payload]})
    assert response.status_code == 503
    assert "not ready" in response.json()["detail"].lower()


def test_predict_runtime_failure_returns_500_safely(client: TestClient, valid_sample_payload: Dict, monkeypatch):
    """Verifies that internal pipeline runtime exceptions return HTTP 500 without leaking stack traces."""
    def broken_predict(*args, **kwargs):
        raise RuntimeError("Simulated internal GPU or memory crash")

    monkeypatch.setattr(model_service._pipeline, "predict", broken_predict)

    response = client.post("/api/v1/predict", json=valid_sample_payload)
    assert response.status_code == 500
    data = response.json()
    assert "Internal server error" in data.get("error", "") or "Inference execution failed" in data.get("detail", "")
    # Ensure raw internal exception message / stack trace is not exposed
    assert "Simulated internal GPU" not in str(data)
