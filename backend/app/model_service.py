"""
AquaPredict Model Inference Service
Handles model lifecycle, artifact loading, input transformation, and prediction generation.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from backend.app.config import (
    LABEL_MAPPING,
    MODEL_PATH,
    NUMERICAL_FEATURES,
    WATER_SAFETY_DISCLAIMER,
)
from backend.app.schemas import (
    ClassProbabilities,
    PredictionResponse,
    WaterSampleInput,
)

logger = logging.getLogger("aquapredict.model_service")


class ModelServiceError(Exception):
    """Base exception for model service operations."""
    pass


class ModelNotReadyError(ModelServiceError):
    """Raised when inference is requested but model is not loaded."""
    pass


class ModelInferenceError(ModelServiceError):
    """Raised when model inference execution encounters a runtime failure."""
    pass


class ModelService:
    """
    Singleton service managing the machine-learning pipeline lifecycle and predictions.
    """
    def __init__(self):
        self._pipeline = None
        self._model_path: Optional[Path] = None
        self._model_name: Optional[str] = None
        self._is_ready: bool = False
        self._load_error: Optional[str] = None

    @property
    def is_ready(self) -> bool:
        return self._is_ready and self._pipeline is not None

    @property
    def model_name(self) -> Optional[str]:
        return self._model_name

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def load_model(self, custom_path: Optional[Path] = None) -> bool:
        """
        Loads the trained pipeline artifact from disk.
        Returns True if successful, False otherwise.
        """
        target_path = Path(custom_path) if custom_path else MODEL_PATH
        self._model_path = target_path
        logger.info(f"Attempting to load model artifact from: {target_path}")

        if not target_path.exists():
            self._is_ready = False
            self._load_error = f"Model artifact not found at: {target_path.resolve()}"
            logger.error(self._load_error)
            return False

        try:
            pipeline = joblib.load(target_path)

            # Validate pipeline structure
            if not hasattr(pipeline, "predict"):
                raise ValueError("Loaded artifact does not implement 'predict' method.")

            # Identify classifier name if present in steps
            if hasattr(pipeline, "named_steps") and "classifier" in pipeline.named_steps:
                self._model_name = pipeline.named_steps["classifier"].__class__.__name__
            else:
                self._model_name = pipeline.__class__.__name__

            self._pipeline = pipeline
            self._is_ready = True
            self._load_error = None
            logger.info(f"Model successfully loaded. Architecture: {self._model_name}")
            return True

        except Exception as e:
            self._pipeline = None
            self._is_ready = False
            self._load_error = f"Failed to load model artifact: {str(e)}"
            logger.error(self._load_error)
            return False

    def _sample_to_dataframe(self, samples: List[WaterSampleInput]) -> pd.DataFrame:
        """
        Converts a list of Pydantic WaterSampleInput objects into a pandas DataFrame
        with strictly ordered canonical column names.
        """
        records = []
        for s in samples:
            data = s.model_dump()
            row = {feat: data.get(feat) for feat in NUMERICAL_FEATURES}
            records.append(row)
        return pd.DataFrame(records, columns=NUMERICAL_FEATURES)

    def predict_single(self, sample: WaterSampleInput) -> PredictionResponse:
        """
        Executes inference for a single water sample.
        """
        results = self.predict_batch([sample])
        return results[0]

    def predict_batch(self, samples: List[WaterSampleInput]) -> List[PredictionResponse]:
        """
        Executes inference for a batch of water samples.
        """
        if not self.is_ready:
            raise ModelNotReadyError(
                f"Model service is not ready. {self._load_error or 'Model not loaded.'}"
            )

        if not samples:
            return []

        try:
            df = self._sample_to_dataframe(samples)
            predictions = self._pipeline.predict(df)

            probabilities = None
            if hasattr(self._pipeline, "predict_proba"):
                try:
                    probabilities = self._pipeline.predict_proba(df)
                except Exception as e:
                    logger.warning(f"predict_proba failed: {e}. Falling back to deterministic outputs.")
                    probabilities = None

            responses = []
            for i, pred_val in enumerate(predictions):
                pred_int = int(pred_val)
                label = LABEL_MAPPING.get(pred_int, "Unknown")

                if probabilities is not None and probabilities.shape[1] >= 2:
                    p_non_potable = float(probabilities[i][0])
                    p_potable = float(probabilities[i][1])
                else:
                    p_non_potable = 1.0 if pred_int == 0 else 0.0
                    p_potable = 1.0 if pred_int == 1 else 0.0

                class_probs = ClassProbabilities(
                    non_potable=round(p_non_potable, 4),
                    potable=round(p_potable, 4),
                )

                response = PredictionResponse(
                    prediction=pred_int,
                    predicted_label=label,
                    class_probabilities=class_probs,
                    model_name=self._model_name or "UnknownModel",
                    disclaimer=WATER_SAFETY_DISCLAIMER,
                )
                responses.append(response)

            return responses

        except Exception as e:
            logger.error(f"Prediction execution failed: {str(e)}")
            raise ModelInferenceError(f"Prediction execution failed: {str(e)}") from e


# Global Singleton Instance
model_service = ModelService()
