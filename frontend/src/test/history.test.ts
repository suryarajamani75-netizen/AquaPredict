import { describe, it, expect, beforeEach } from 'vitest';
import { historyService } from '../utils/history';
import { LOCAL_STORAGE_HISTORY_KEY } from '../utils/constants';
import { WaterSampleInput, PredictionResponse } from '../types';

describe('Prediction History Service', () => {
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

  const sampleResult: PredictionResponse = {
    prediction: 1,
    predicted_label: 'Potable',
    class_probabilities: { non_potable: 0.35, potable: 0.65 },
    model_name: 'RandomForestClassifier',
    disclaimer: 'Statutory disclaimer',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when local storage is empty', () => {
    expect(historyService.getHistory()).toEqual([]);
  });

  it('saves and retrieves a single prediction', () => {
    const saved = historyService.savePrediction(sampleInput, sampleResult, 'single');
    expect(saved.id).toBeDefined();
    expect(saved.result.predicted_label).toBe('Potable');

    const history = historyService.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(saved.id);
    expect(history[0].result.prediction).toBe(1);
  });

  it('clears history completely', () => {
    historyService.savePrediction(sampleInput, sampleResult, 'single');
    expect(historyService.getHistory().length).toBe(1);

    historyService.clearHistory();
    expect(historyService.getHistory()).toEqual([]);
  });

  it('handles corrupted localStorage JSON gracefully', () => {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, 'invalid-json-data');
    const history = historyService.getHistory();
    expect(history).toEqual([]);
  });
});
