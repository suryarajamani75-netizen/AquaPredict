"""
Health and Readiness Endpoints
Provides liveness and readiness probes for infrastructure and monitoring.
"""

from fastapi import APIRouter, Response, status

from backend.app.config import APP_VERSION, ENVIRONMENT
from backend.app.model_service import model_service
from backend.app.schemas import HealthResponse, ReadyResponse

router = APIRouter(tags=["Health & Monitoring"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Liveness Probe",
    description="Confirms that the API process is active and accepting HTTP connections.",
)
def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        environment=ENVIRONMENT,
    )


@router.get(
    "/ready",
    response_model=ReadyResponse,
    summary="Readiness Probe",
    description="Confirms that the machine-learning model pipeline is loaded and ready to serve predictions.",
    responses={
        200: {"description": "Model is loaded and ready for inference."},
        503: {"description": "Model is not loaded or failed initialization."},
    },
)
def get_readiness(response: Response) -> ReadyResponse:
    if model_service.is_ready:
        response.status_code = status.HTTP_200_OK
        return ReadyResponse(
            status="ready",
            model_loaded=True,
            model_name=model_service.model_name,
            details="Model pipeline is active and ready for inference.",
        )
    else:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadyResponse(
            status="not_ready",
            model_loaded=False,
            model_name=None,
            details=model_service.load_error or "Model pipeline is not loaded.",
        )
