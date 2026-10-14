"""
Automated tests for health and readiness probe endpoints.
"""

from fastapi.testclient import TestClient

from backend.app.model_service import model_service


def test_health_endpoint(client: TestClient):
    """Verifies that GET /health returns HTTP 200 with ok status and metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data


def test_ready_endpoint_when_model_is_loaded(client: TestClient):
    """Verifies that GET /ready returns HTTP 200 when model is loaded and ready."""
    assert model_service.is_ready is True
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["model_loaded"] is True
    assert "RandomForest" in (data["model_name"] or "")


def test_ready_endpoint_when_model_is_not_ready(client: TestClient, monkeypatch):
    """Verifies that GET /ready returns HTTP 503 when model is not ready."""
    # Temporarily set model_service._is_ready to False
    monkeypatch.setattr(model_service, "_is_ready", False)
    monkeypatch.setattr(model_service, "_load_error", "Simulated unready state")

    response = client.get("/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "not_ready"
    assert data["model_loaded"] is False
    assert "Simulated unready state" in data["details"]
