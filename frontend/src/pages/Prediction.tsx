import React, { useState } from 'react';
import {
  Droplets,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { WATER_PARAMETERS, WATER_SAFETY_DISCLAIMER_TEXT } from '../utils/constants';
import { WaterSampleInput, PredictionResponse, ApiValidationErrorDetail } from '../types';
import { apiClient, ApiClientError } from '../api/client';
import { historyService } from '../utils/history';
import { ProbabilityMeter } from '../components/common/ProbabilityMeter';

const INITIAL_FORM_STATE: Record<keyof WaterSampleInput, string> = {
  ph: '',
  Hardness: '',
  Solids: '',
  Chloramines: '',
  Sulfate: '',
  Conductivity: '',
  Organic_carbon: '',
  Trihalomethanes: '',
  Turbidity: '',
};

export const Prediction: React.FC = () => {
  const [formData, setFormData] = useState<Record<keyof WaterSampleInput, string>>(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof WaterSampleInput, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrorDetails, setApiErrorDetails] = useState<ApiValidationErrorDetail[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<{
    inputs: WaterSampleInput;
    result: PredictionResponse;
    timestamp: string;
  } | null>(null);

  const handleInputChange = (field: keyof WaterSampleInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear individual field error on edit
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const loadExampleSample = () => {
    const exampleValues: Record<keyof WaterSampleInput, string> = {
      ph: '7.08',
      Hardness: '204.89',
      Solids: '20791.32',
      Chloramines: '7.30',
      Sulfate: '368.52',
      Conductivity: '564.31',
      Organic_carbon: '10.38',
      Trihalomethanes: '86.99',
      Turbidity: '2.96',
    };
    setFormData(exampleValues);
    setFieldErrors({});
    setApiError(null);
    setApiErrorDetails(null);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setFieldErrors({});
    setApiError(null);
    setApiErrorDetails(null);
  };

  const validateForm = (): { isValid: boolean; payload?: WaterSampleInput } => {
    const errors: Partial<Record<keyof WaterSampleInput, string>> = {};
    const parsedPayload: Record<string, unknown> = {};

    WATER_PARAMETERS.forEach((param) => {
      const rawVal = formData[param.key]?.trim();

      if (!rawVal || rawVal === '') {
        if (param.nullable) {
          parsedPayload[param.key] = null;
        } else {
          errors[param.key] = `${param.label} is required.`;
        }
      } else {
        const num = Number(rawVal);
        if (isNaN(num) || !isFinite(num)) {
          errors[param.key] = 'Must be a finite numeric value.';
        } else if (num < param.min || num > param.max) {
          errors[param.key] = `Value must be between ${param.min} and ${param.max} ${param.unit}.`;
        } else {
          parsedPayload[param.key] = num;
        }
      }
    });

    setFieldErrors(errors);
    return {
      isValid: Object.keys(errors).length === 0,
      payload: Object.keys(errors).length === 0 ? (parsedPayload as unknown as WaterSampleInput) : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent duplicate requests

    setApiError(null);
    setApiErrorDetails(null);

    const validation = validateForm();
    if (!validation.isValid || !validation.payload) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.predictSingle(validation.payload);
      const timestamp = new Date().toISOString();

      setPredictionResult({
        inputs: validation.payload,
        result: response,
        timestamp,
      });

      // Save to genuine local storage history
      historyService.savePrediction(validation.payload, response, 'single');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
        if (Array.isArray(err.details)) {
          setApiErrorDetails(err.details);
        }
      } else {
        setApiError('An unexpected error occurred while communicating with the prediction engine.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Droplets className="h-7 w-7 text-brand-600" />
          Water Quality Potability Assessment
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Input 9 physicochemical parameters to evaluate whether a water sample satisfies statistical potability thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sample Physicochemical Parameters</h2>
              <p className="text-xs text-slate-400">All fields must comply with standard scientific bounds.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadExampleSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold transition-colors"
                title="Fill with standard benchmark test values"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                Fill Sample Data
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WATER_PARAMETERS.map((param) => {
                const hasError = !!fieldErrors[param.key];
                const inputId = `param-input-${param.key}`;

                return (
                  <div key={param.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        {param.label}
                        {!param.nullable ? (
                          <span className="text-rose-500" title="Required parameter">*</span>
                        ) : (
                          <span className="text-slate-400 font-normal text-[10px]">(optional)</span>
                        )}
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">{param.unit}</span>
                    </div>

                    <div className="relative">
                      <input
                        id={inputId}
                        type="number"
                        step={param.step}
                        placeholder={param.nullable ? `e.g. ${param.defaultValue || 7.0} (or leave empty)` : `Range: ${param.min}-${param.max}`}
                        value={formData[param.key]}
                        onChange={(e) => handleInputChange(param.key, e.target.value)}
                        disabled={isLoading}
                        className={`w-full px-3 py-2 text-sm rounded-lg border font-mono transition-colors focus:outline-hidden ${
                          hasError
                            ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-400'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                        }`}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${inputId}-error` : `${inputId}-help`}
                      />
                    </div>

                    {hasError ? (
                      <p id={`${inputId}-error`} className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {fieldErrors[param.key]}
                      </p>
                    ) : (
                      <p id={`${inputId}-help`} className="text-[10px] text-slate-400 truncate" title={param.standardBenchmark}>
                        Benchmark: {param.standardBenchmark}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error Banner */}
            {apiError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-rose-950">
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Assessment Request Error</span>
                </div>
                <p className="text-rose-800">{apiError}</p>
                {apiErrorDetails && apiErrorDetails.length > 0 && (
                  <ul className="list-disc list-inside text-xs space-y-0.5 text-rose-700 pt-1">
                    {apiErrorDetails.map((detail, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{detail.field}:</span> {detail.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                Median imputation applied to missing optional values.
              </span>
              <button
                type="submit"
                disabled={isLoading}
                id="submit-prediction-btn"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all ${
                  isLoading
                    ? 'bg-brand-400 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700 hover:shadow-brand-500/20 active:translate-y-[1px]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating Sample...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Prediction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5 space-y-6">
          {predictionResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assessment Result</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPredictionResult(null)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 underline"
                >
                  Clear Results
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-5 rounded-2xl border text-center space-y-2 ${
                  predictionResult.result.prediction === 1
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex justify-center">
                  {predictionResult.result.prediction === 1 ? (
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600">
                      <XCircle className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight">{predictionResult.result.predicted_label}</h3>
                <p className="text-xs font-mono text-slate-600">
                  Target Class Value: <span className="font-bold">{predictionResult.result.prediction}</span>
                </p>
              </div>

              {/* Probability Meter Component */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <ProbabilityMeter
                  probabilities={predictionResult.result.class_probabilities}
                  predictedLabel={predictionResult.result.predicted_label}
                />
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-mono">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Cpu className="h-3.5 w-3.5 text-brand-600" /> Model Pipeline:
                  </span>
                  <span className="font-semibold text-slate-800">{predictionResult.result.model_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-amber-600" /> Evaluated At:
                  </span>
                  <span>{new Date(predictionResult.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Submitted Inputs Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Evaluated Inputs</h4>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  {Object.entries(predictionResult.inputs).map(([key, val]) => (
                    <div key={key} className="p-2 rounded bg-slate-50 border border-slate-200/60 text-slate-600">
                      <span className="text-[10px] text-slate-400 block truncate">{key}</span>
                      <span className="font-semibold text-slate-800">
                        {val !== null ? Number(val).toFixed(2) : 'null (imputed)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Water Safety Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">Notice: </span>
                  {predictionResult.result.disclaimer || WATER_SAFETY_DISCLAIMER_TEXT}
                </p>
              </div>
            </div>
          ) : (
            /* Awaiting Input Prompt */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4 text-slate-400">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <Droplets className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700">Awaiting Sample Input</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Provide sample parameters in the form and click "Submit Prediction" to compute real ML potability scores.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={loadExampleSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  Try Sample Values
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
