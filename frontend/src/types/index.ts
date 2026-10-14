/**
 * AquaPredict TypeScript Definitions
 * Aligned with backend Pydantic schemas (backend/app/schemas.py).
 */

export interface WaterSampleInput {
  ph: number | null;
  Hardness: number;
  Solids: number;
  Chloramines: number;
  Sulfate: number | null;
  Conductivity: number;
  Organic_carbon: number;
  Trihalomethanes: number | null;
  Turbidity: number;
}

export interface ClassProbabilities {
  non_potable: number;
  potable: number;
}

export interface PredictionResponse {
  prediction: number; // 0 or 1
  predicted_label: 'Non-potable' | 'Potable';
  class_probabilities: ClassProbabilities;
  model_name: string;
  disclaimer: string;
}

export interface BatchPredictionRequest {
  samples: WaterSampleInput[];
}

export interface BatchPredictionResponse {
  total_samples: number;
  predictions: PredictionResponse[];
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
}

export interface ReadyResponse {
  status: 'ready' | 'not_ready';
  model_loaded: boolean;
  model_name: string | null;
  details: string | null;
}

export interface ApiValidationErrorDetail {
  field: string;
  message: string;
  type: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: ApiValidationErrorDetail[] | string;
  message?: string;
}

export interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  inputs: WaterSampleInput;
  result: PredictionResponse;
  source: 'single' | 'batch';
}

export interface ParameterMetadata {
  key: keyof WaterSampleInput;
  label: string;
  unit: string;
  min: number;
  max: number;
  nullable: boolean;
  standardBenchmark: string;
  description: string;
  step: number;
  defaultValue?: number;
}
