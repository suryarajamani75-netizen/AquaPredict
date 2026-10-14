"""
AquaPredict Pydantic Schemas
Defines strictly-validated request and response models for water quality assessment.
"""

import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.app.config import WATER_SAFETY_DISCLAIMER


def validate_finite_number(v: Optional[float], field_name: str) -> Optional[float]:
    """Ensures floating point values are finite numbers (not NaN or Inf)."""
    if v is not None:
        if math.isnan(v) or math.isinf(v):
            raise ValueError(f"Field '{field_name}' must be a finite numerical value; received {v}.")
    return v


class WaterSampleInput(BaseModel):
    """
    Schema for a single water quality sample.
    Enforces technical bounds, prevents extra fields, and checks finite numbers.
    """
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
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
        },
    )

    ph: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=14.0,
        description="pH of water sample on the standard [0, 14] chemical scale.",
    )
    Hardness: float = Field(
        ...,
        ge=0.0,
        le=1000.0,
        description="Capacity of water to precipitate soap in mg/L (typically 0-1000).",
    )
    Solids: float = Field(
        ...,
        ge=0.0,
        le=100000.0,
        description="Total dissolved solids (TDS) in ppm (typically 0-100,000).",
    )
    Chloramines: float = Field(
        ...,
        ge=0.0,
        le=50.0,
        description="Amount of Chloramines in ppm (typically 0-50).",
    )
    Sulfate: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1000.0,
        description="Concentration of dissolved sulfates in mg/L (typically 0-1000).",
    )
    Conductivity: float = Field(
        ...,
        ge=0.0,
        le=3000.0,
        description="Electrical conductivity in μS/cm (typically 0-3000).",
    )
    Organic_carbon: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Total organic carbon in ppm (typically 0-100).",
    )
    Trihalomethanes: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=300.0,
        description="Concentration of Trihalomethanes in μg/L (typically 0-300).",
    )
    Turbidity: float = Field(
        ...,
        ge=0.0,
        le=50.0,
        description="Measure of light emitting properties in NTU (typically 0-50).",
    )

    @field_validator("ph", "Hardness", "Solids", "Chloramines", "Sulfate", "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity")
    @classmethod
    def check_finite(cls, v: Optional[float], info) -> Optional[float]:
        return validate_finite_number(v, info.field_name)


class ClassProbabilities(BaseModel):
    """Calibrated probability scores for binary potability classes."""
    non_potable: float = Field(..., ge=0.0, le=1.0, description="Probability that water is non-potable (0)")
    potable: float = Field(..., ge=0.0, le=1.0, description="Probability that water is potable (1)")


class PredictionResponse(BaseModel):
    """Structured response containing prediction class, probabilities, and safety disclaimer."""
    prediction: int = Field(..., description="0 for Non-potable, 1 for Potable")
    predicted_label: str = Field(..., description="Human-readable label ('Non-potable' or 'Potable')")
    class_probabilities: ClassProbabilities = Field(..., description="Probabilities for each class")
    model_name: str = Field(..., description="Name of the underlying trained model architecture")
    disclaimer: str = Field(
        default=WATER_SAFETY_DISCLAIMER,
        description="Mandatory public health and testing limitation disclaimer",
    )


class BatchPredictionRequest(BaseModel):
    """Request schema for batch water quality assessment."""
    model_config = ConfigDict(extra="forbid")

    samples: List[WaterSampleInput] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Bounded list of water sample records (1 to 100 records per request)",
    )


class BatchPredictionResponse(BaseModel):
    """Response schema containing predictions corresponding to input records."""
    total_samples: int = Field(..., description="Number of samples evaluated")
    predictions: List[PredictionResponse] = Field(..., description="Ordered list of prediction results")


class HealthResponse(BaseModel):
    """Liveness probe response."""
    status: str = Field("ok", description="Server status indicator")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Runtime environment")


class ReadyResponse(BaseModel):
    """Readiness probe response indicating model readiness."""
    status: str = Field(..., description="'ready' or 'not_ready'")
    model_loaded: bool = Field(..., description="Whether model pipeline is active in memory")
    model_name: Optional[str] = Field(None, description="Name of the loaded model classifier")
    details: Optional[str] = Field(None, description="Additional status notes or failure details")
