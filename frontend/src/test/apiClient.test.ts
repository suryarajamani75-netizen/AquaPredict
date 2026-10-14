import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiClientError, API_BASE_URL } from '../api/client';
import { WaterSampleInput } from '../types';

describe('AquaPredict Centralized API Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('reads API_BASE_URL correctly', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('fetches health successfully', async () => {
    const mockHealth = { status: 'ok', version: '0.2.0', environment: 'development' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockHealth,
    });

    const res = await apiClient.getHealth();
    expect(res).toEqual(mockHealth);
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/health`, expect.anything());
  });

  it('fetches readiness successfully when model is loaded', async () => {
    const mockReady = {
      status: 'ready',
      model_loaded: true,
      model_name: 'RandomForestClassifier',
      details: 'Model is active',
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockReady,
    });

    const res = await apiClient.getReadiness();
    expect(res.model_loaded).toBe(true);
    expect(res.model_name).toBe('RandomForestClassifier');
  });

  it('handles 503 Service Unavailable when model is not ready', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Model service is not ready: Pipeline not loaded' }),
    });

    await expect(apiClient.getReadiness()).rejects.toThrow(ApiClientError);
  });

  it('performs single prediction successfully', async () => {
    const sampleInput: WaterSampleInput = {
      ph: 7.08,
      Hardness: 204.89,
      Solids: 20791.32,
      Chloramines: 7.30,
      Sulfate: 368.52,
      Conductivity: 564.31,
      Organic_carbon: 10.38,
      Trihalomethanes: 86.99,
      Turbidity: 2.96,
    };

    const mockResponse = {
      prediction: 1,
      predicted_label: 'Potable',
      class_probabilities: { non_potable: 0.38, potable: 0.62 },
      model_name: 'RandomForestClassifier',
      disclaimer: 'This model prediction is a statistical estimate...',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockResponse,
    });

    const res = await apiClient.predictSingle(sampleInput);
    expect(res.prediction).toBe(1);
    expect(res.predicted_label).toBe('Potable');
    expect(res.class_probabilities.potable).toBe(0.62);
  });

  it('handles 422 Unprocessable Content validation error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: { get: () => 'application/json' },
      json: async () => ({
        error: 'Request validation failed',
        details: [{ field: 'ph', message: 'Value must be <= 14.0', type: 'value_error' }],
      }),
    });

    try {
      await apiClient.predictSingle({
        ph: 25.0,
        Hardness: 200,
        Solids: 10000,
        Chloramines: 5,
        Sulfate: 200,
        Conductivity: 300,
        Organic_carbon: 10,
        Trihalomethanes: 50,
        Turbidity: 3,
      });
      expect.fail('Should have thrown an ApiClientError');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.statusCode).toBe(422);
      expect(Array.isArray(apiErr.details)).toBe(true);
    }
  });

  it('performs batch prediction successfully', async () => {
    const samples: WaterSampleInput[] = [
      {
        ph: 7.0,
        Hardness: 200,
        Solids: 20000,
        Chloramines: 7,
        Sulfate: 300,
        Conductivity: 500,
        Organic_carbon: 10,
        Trihalomethanes: 80,
        Turbidity: 3,
      },
    ];

    const mockBatchResponse = {
      total_samples: 1,
      predictions: [
        {
          prediction: 0,
          predicted_label: 'Non-potable',
          class_probabilities: { non_potable: 0.7, potable: 0.3 },
          model_name: 'RandomForestClassifier',
          disclaimer: 'Disclaimer text',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockBatchResponse,
    });

    const res = await apiClient.predictBatch(samples);
    expect(res.total_samples).toBe(1);
    expect(res.predictions[0].predicted_label).toBe('Non-potable');
  });

  it('rejects batch exceeding 100 samples client-side', async () => {
    const tooManySamples = new Array(101).fill({
      ph: 7,
      Hardness: 200,
      Solids: 20000,
      Chloramines: 7,
      Sulfate: 300,
      Conductivity: 500,
      Organic_carbon: 10,
      Trihalomethanes: 80,
      Turbidity: 3,
    });

    await expect(apiClient.predictBatch(tooManySamples)).rejects.toThrow(
      'Batch size exceeds maximum limit of 100 samples.'
    );
  });
});
