"""
Test configuration and fixtures for AquaPredict backend tests.
"""

from typing import Dict
from fastapi.testclient import TestClient
import pytest

from backend.app.main import app
from backend.app.model_service import model_service


@pytest.fixture(scope="session", autouse=True)
def ensure_model_loaded():
    """Ensures the real trained model artifact is loaded for backend tests."""
    model_service.load_model()
    assert model_service.is_ready, f"Model service failed to load: {model_service.load_error}"


@pytest.fixture
def client() -> TestClient:
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def valid_sample_payload() -> Dict[str, float]:
    """Payload representing a valid complete water sample."""
    return {
        "ph": 7.08,
        "Hardness": 204.89,
        "Solids": 20791.32,
        "Chloramines": 7.30,
        "Sulfate": 368.52,
        "Conductivity": 564.31,
        "Organic_carbon": 10.38,
        "Trihalomethanes": 86.99,
        "Turbidity": 2.96,
    }


@pytest.fixture
def valid_sample_with_missing_payload() -> Dict[str, float]:
    """Payload representing a sample with missing measurements for naturally missing features."""
    return {
        "ph": None,
        "Hardness": 180.5,
        "Solids": 18500.0,
        "Chloramines": 6.8,
        "Sulfate": None,
        "Conductivity": 450.0,
        "Organic_carbon": 12.0,
        "Trihalomethanes": None,
        "Turbidity": 3.8,
    }
