import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('AquaPredict Application Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // Mock successful health and ready probes
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/ready')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({
            status: 'ready',
            model_loaded: true,
            model_name: 'RandomForestClassifier',
            details: 'Model pipeline active',
          }),
        });
      }
      if (url.endsWith('/health')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({
            status: 'ok',
            version: '0.2.0',
            environment: 'development',
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL in test mock: ${url}`));
    });
  });

  it('renders the application shell with branding and navigation', async () => {
    render(<App />);
    expect(screen.getByLabelText(/AquaPredict Home/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Aqua/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Predict/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Water Quality Prediction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batch Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prediction History/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /About the Project/i })).toBeInTheDocument();
  });

  it('navigates to Water Quality Prediction tab and renders form', async () => {
    render(<App />);
    const predictNavBtn = screen.getByRole('button', { name: /Water Quality Prediction/i });
    fireEvent.click(predictNavBtn);

    expect(screen.getByText(/Water Quality Potability Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/pH Level/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Dissolved Solids/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Prediction/i })).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    render(<App />);
    const predictNavBtn = screen.getByRole('button', { name: /Water Quality Prediction/i });
    fireEvent.click(predictNavBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit Prediction/i });
    fireEvent.click(submitBtn);

    // Required fields show error messages
    await waitFor(() => {
      expect(screen.getByText(/Hardness is required/i)).toBeInTheDocument();
    });
  });

  it('navigates to Batch Analysis tab', async () => {
    render(<App />);
    const batchNavBtn = screen.getByRole('button', { name: /Batch Analysis/i });
    fireEvent.click(batchNavBtn);

    expect(screen.getByText(/Batch Water Quality Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Atomic Validation Policy/i)).toBeInTheDocument();
  });

  it('navigates to History tab and displays local storage banner', async () => {
    render(<App />);
    const historyNavBtn = screen.getByRole('button', { name: /Prediction History/i });
    fireEvent.click(historyNavBtn);

    expect(screen.getByText(/Evaluation History/i)).toBeInTheDocument();
    expect(screen.getByText(/Client-Side Persistence/i)).toBeInTheDocument();
  });

  it('navigates to About tab and explains ML pipeline and limitations', async () => {
    render(<App />);
    const aboutNavBtn = screen.getByRole('button', { name: /About the Project/i });
    fireEvent.click(aboutNavBtn);

    expect(screen.getByText(/About the AquaPredict Project/i)).toBeInTheDocument();
    expect(screen.getByText(/RandomForestClassifier/i)).toBeInTheDocument();
    expect(screen.getByText(/Scientific & Water Safety Disclaimer/i)).toBeInTheDocument();
  });
});
