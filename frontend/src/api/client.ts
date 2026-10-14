import {
  BatchPredictionRequest,
  BatchPredictionResponse,
  HealthResponse,
  PredictionResponse,
  ReadyResponse,
  WaterSampleInput,
  ApiValidationErrorDetail,
} from '../types';

export class ApiClientError extends Error {
  public statusCode: number;
  public details?: ApiValidationErrorDetail[] | string;

  constructor(message: string, statusCode: number, details?: ApiValidationErrorDetail[] | string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Retrieve base URL from environment or fallback to safe development default
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://127.0.0.1:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: Request failed`;
    let details: ApiValidationErrorDetail[] | string | undefined = undefined;

    if (isJson) {
      try {
        const errorBody = await response.json();
        if (errorBody.error) {
          errorMessage = errorBody.error;
        } else if (errorBody.detail) {
          errorMessage = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail);
        }

        if (errorBody.details) {
          details = errorBody.details;
        }
      } catch {
        // Fallback to status text
        errorMessage = response.statusText || errorMessage;
      }
    } else {
      const text = await response.text();
      if (text) errorMessage = text;
    }

    if (response.status === 503) {
      errorMessage = details && typeof details === 'string' ? details : 'Model Service Unavailable: Pipeline not ready';
    } else if (response.status === 422) {
      errorMessage = 'Input validation failed. Please review the parameter values.';
    } else if (response.status === 500) {
      errorMessage = 'Internal inference engine failure. Please try again.';
    }

    throw new ApiClientError(errorMessage, response.status, details);
  }

  if (!isJson) {
    throw new ApiClientError('Invalid server response format (expected JSON)', response.status);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  /**
   * Liveness Probe: Confirms server is running and accepting requests.
   */
  async getHealth(timeoutMs: number = 5000): Promise<HealthResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      return await handleResponse<HealthResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError('Backend connection timed out.', 408);
      }
      throw new ApiClientError(
        'Unable to reach backend server at ' + API_BASE_URL + '. Ensure FastAPI is running.',
        0
      );
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Readiness Probe: Confirms machine learning model pipeline is active in memory.
   */
  async getReadiness(timeoutMs: number = 5000): Promise<ReadyResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE_URL}/ready`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      return await handleResponse<ReadyResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError('Readiness probe timed out.', 408);
      }
      throw new ApiClientError(
        'Unable to check model readiness. Backend at ' + API_BASE_URL + ' is unreachable.',
        0
      );
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Predict single water sample potability.
   */
  async predictSingle(sample: WaterSampleInput, timeoutMs: number = 10000): Promise<PredictionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(sample),
        signal: controller.signal,
      });
      return await handleResponse<PredictionResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError('Prediction request timed out.', 408);
      }
      throw new ApiClientError(
        'Prediction failed: Backend at ' + API_BASE_URL + ' is unreachable.',
        0
      );
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Predict batch of water samples (1 to 100 samples with atomic validation).
   */
  async predictBatch(samples: WaterSampleInput[], timeoutMs: number = 20000): Promise<BatchPredictionResponse> {
    if (!samples || samples.length === 0) {
      throw new ApiClientError('Batch must contain at least 1 water sample.', 400);
    }
    if (samples.length > 100) {
      throw new ApiClientError('Batch size exceeds maximum limit of 100 samples.', 400);
    }

    const payload: BatchPredictionRequest = { samples };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/predict/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return await handleResponse<BatchPredictionResponse>(res);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiClientError('Batch prediction request timed out.', 408);
      }
      throw new ApiClientError(
        'Batch prediction failed: Backend at ' + API_BASE_URL + ' is unreachable.',
        0
      );
    } finally {
      clearTimeout(timer);
    }
  },
};
