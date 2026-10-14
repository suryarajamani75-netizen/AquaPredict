"""
Prediction Endpoints
Provides single and batch water quality assessment endpoints using the loaded ML pipeline.
"""

from fastapi import APIRouter, HTTPException, status

from backend.app.model_service import (
    ModelInferenceError,
    ModelNotReadyError,
    model_service,
)
from backend.app.schemas import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionResponse,
    WaterSampleInput,
)

router = APIRouter(prefix="/api/v1", tags=["Water Quality Assessment"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Single Water Sample",
    description=(
        "Evaluates 9 biophysical and chemical water quality measurements to predict potability (1=Potable, 0=Non-potable). "
        "Returns prediction, class probabilities, and mandatory water testing disclaimer."
    ),
    responses={
        200: {"description": "Water quality prediction successfully computed."},
        422: {"description": "Validation error: missing required fields, out of range values, or extra fields."},
        503: {"description": "Model service unavailable: model not loaded."},
        500: {"description": "Inference computation error."},
    },
)
def predict_water_quality(sample: WaterSampleInput) -> PredictionResponse:
    if not model_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model service is not ready: {model_service.load_error or 'Pipeline not loaded'}",
        )

    try:
        response = model_service.predict_single(sample)
        return response
    except ModelNotReadyError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except ModelInferenceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference execution failed during pipeline processing.",
        )


@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Batch of Water Samples",
    description=(
        "Evaluates a list of water sample records (1 to 100 samples) in a single request. "
        "Enforces atomic validation (Policy A): the entire batch is rejected if any sample fails validation."
    ),
    responses={
        200: {"description": "Batch predictions successfully computed for all records."},
        422: {"description": "Validation error on one or more batch records, or batch size out of bounds."},
        503: {"description": "Model service unavailable."},
        500: {"description": "Batch inference computation error."},
    },
)
def predict_water_quality_batch(batch_request: BatchPredictionRequest) -> BatchPredictionResponse:
    if not model_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model service is not ready: {model_service.load_error or 'Pipeline not loaded'}",
        )

    try:
        results = model_service.predict_batch(batch_request.samples)
        return BatchPredictionResponse(
            total_samples=len(results),
            predictions=results,
        )
    except ModelNotReadyError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except ModelInferenceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Batch inference execution failed during pipeline processing.",
        )
