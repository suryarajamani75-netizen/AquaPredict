"""
Automated tests for input validation, boundaries, and schema enforcement.
"""

from typing import Dict
from fastapi.testclient import TestClient


def test_missing_required_field_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that omitting a required field like 'Hardness' triggers HTTP 422."""
    payload = valid_sample_payload.copy()
    del payload["Hardness"]
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "validation failed" in data["error"].lower()
    assert any("Hardness" in str(err) for err in data["details"])


def test_extra_forbidden_field_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that passing unexpected extra fields (especially 'Potability') triggers HTTP 422."""
    payload = valid_sample_payload.copy()
    payload["Potability"] = 1  # Target field forbidden in input
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any("extra" in str(err).lower() or "Potability" in str(err) for err in data["details"])


def test_non_numeric_string_value_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that non-numeric strings trigger HTTP 422."""
    payload = valid_sample_payload.copy()
    payload["Hardness"] = "not_a_number"
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422


def test_ph_out_of_bounds_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that pH values below 0 or above 14 trigger HTTP 422."""
    payload_low = valid_sample_payload.copy()
    payload_low["ph"] = -0.5
    res_low = client.post("/api/v1/predict", json=payload_low)
    assert res_low.status_code == 422

    payload_high = valid_sample_payload.copy()
    payload_high["ph"] = 14.5
    res_high = client.post("/api/v1/predict", json=payload_high)
    assert res_high.status_code == 422


def test_negative_physical_values_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that negative values for concentration/turbidity trigger HTTP 422."""
    payload_neg = valid_sample_payload.copy()
    payload_neg["Turbidity"] = -1.0
    res_neg = client.post("/api/v1/predict", json=payload_neg)
    assert res_neg.status_code == 422


def test_solids_upper_bound_rejected(client: TestClient, valid_sample_payload: Dict):
    """Verifies that solids exceeding technical physical bound (100,000 ppm) trigger HTTP 422."""
    payload = valid_sample_payload.copy()
    payload["Solids"] = 150000.0
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 422


def test_empty_json_body_rejected(client: TestClient):
    """Verifies that an empty JSON object triggers HTTP 422."""
    response = client.post("/api/v1/predict", json={})
    assert response.status_code == 422


def test_malformed_json_rejected(client: TestClient):
    """Verifies that raw non-JSON content triggers HTTP 422."""
    response = client.post(
        "/api/v1/predict",
        content="not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_batch_atomic_validation_policy_a(client: TestClient, valid_sample_payload: Dict):
    """
    Verifies Policy A: if any sample in a batch fails validation (e.g. invalid pH),
    the entire batch is rejected with HTTP 422.
    """
    bad_sample = valid_sample_payload.copy()
    bad_sample["ph"] = 25.0  # Invalid pH

    batch_payload = {
        "samples": [
            valid_sample_payload,
            bad_sample,
            valid_sample_payload,
        ]
    }
    response = client.post("/api/v1/predict/batch", json=batch_payload)
    assert response.status_code == 422
