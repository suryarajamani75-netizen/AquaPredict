import { PredictionHistoryItem, PredictionResponse, WaterSampleInput } from '../types';
import { LOCAL_STORAGE_HISTORY_KEY, MAX_HISTORY_ITEMS } from './constants';

export const historyService = {
  getHistory(): PredictionHistoryItem[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_HISTORY_ITEMS);
      }
      return [];
    } catch (e) {
      console.warn('Failed to parse local storage prediction history:', e);
      return [];
    }
  },

  savePrediction(inputs: WaterSampleInput, result: PredictionResponse, source: 'single' | 'batch' = 'single'): PredictionHistoryItem {
    const newItem: PredictionHistoryItem = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      inputs,
      result,
      source,
    };

    try {
      const current = this.getHistory();
      const updated = [newItem, ...current].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist prediction to local storage:', e);
    }

    return newItem;
  },

  saveBatchPredictions(samples: WaterSampleInput[], results: PredictionResponse[]): void {
    try {
      const current = this.getHistory();
      const now = new Date().toISOString();
      const newItems: PredictionHistoryItem[] = samples.map((sample, idx) => ({
        id: `batch_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        timestamp: now,
        inputs: sample,
        result: results[idx],
        source: 'batch' as const,
      }));

      const updated = [...newItems, ...current].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist batch predictions to local storage:', e);
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear local storage:', e);
    }
  },
};
