import React, { useState, useEffect } from 'react';
import {
  Droplets,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Database,
  CheckCircle,
  FileSpreadsheet,
  History,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WATER_PARAMETERS, WATER_SAFETY_DISCLAIMER_TEXT } from '../utils/constants';
import { historyService } from '../utils/history';
import { PredictionHistoryItem, ReadyResponse } from '../types';
import { apiClient } from '../api/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [backendReady, setBackendReady] = useState<ReadyResponse | null>(null);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(true);

  useEffect(() => {
    setHistory(historyService.getHistory());

    apiClient
      .getReadiness()
      .then((data) => setBackendReady(data))
      .catch(() =>
        setBackendReady({
          status: 'not_ready',
          model_loaded: false,
          model_name: null,
          details: 'Backend is offline or unreachable',
        })
      )
      .finally(() => setLoadingBackend(false));
  }, []);

  const totalPredictions = history.length;
  const potableCount = history.filter((h) => h.result.prediction === 1).length;
  const nonPotableCount = history.filter((h) => h.result.prediction === 0).length;

  const chartData = [
    { name: 'Potable', value: potableCount, color: '#059669' },
    { name: 'Non-potable', value: nonPotableCount, color: '#dc2626' },
  ].filter((d) => d.value > 0);

  const latestPrediction = history.length > 0 ? history[0] : null;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-teal-900 text-white shadow-xl p-6 sm:p-10 border border-brand-700/50">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-teal-200 border border-white/15">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            Machine Learning Water Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            AquaPredict Analytics Platform
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            High-precision predictive modeling for water potability assessment. Evaluates 9 physical and chemical parameters against trained ensemble random forest pipelines with statistical confidence intervals.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('prediction')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm shadow-md transition-all hover:translate-y-[-1px]"
            >
              <Droplets className="h-4 w-4" />
              Assess Single Water Sample
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('batch')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-teal-300" />
              Batch CSV Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Model & Backend Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Model Pipeline */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-lg bg-brand-50 text-brand-600 shrink-0">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Model Architecture</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Random Forest</h3>
            <p className="text-xs text-slate-500 mt-1">
              {backendReady?.model_name || 'Ensemble Pipeline'}
            </p>
          </div>
        </div>

        {/* Card 2: Training Data */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600 shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Validated Dataset</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">3,276 Records</h3>
            <p className="text-xs text-slate-500 mt-1">Leakage-Free Preprocessing</p>
          </div>
        </div>

        {/* Card 3: Backend Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div
            className={`p-3 rounded-lg shrink-0 ${
              backendReady?.model_loaded ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Backend API</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {loadingBackend ? 'Checking...' : backendReady?.model_loaded ? 'Ready / Online' : 'Offline'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">FastAPI v0.2.0 (REST)</p>
          </div>
        </div>

        {/* Card 4: Local History Count */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <History className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Local History</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{totalPredictions} Evaluations</h3>
            <p className="text-xs text-slate-500 mt-1">Client Browser Storage</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Workflow & History Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workflow Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-600" />
              Prediction Pipeline Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              AquaPredict implements a four-stage assessment pipeline guaranteeing reproducibility and statistical robustness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <h4 className="font-semibold text-slate-900 text-sm">Input Validation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pydantic validation checks finite numbers and physicochemical bounds across all 9 water features.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <h4 className="font-semibold text-slate-900 text-sm">Median Imputation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Learned training-set medians impute missing pH, Sulfate, or Trihalomethanes without data leakage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">3</div>
              <h4 className="font-semibold text-slate-900 text-sm">Standard Scaling</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Z-score normalization transforms measurements into zero-mean, unit-variance distributions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">4</div>
              <h4 className="font-semibold text-slate-900 text-sm">Classification</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Random Forest ensemble computes class probabilities and predicts potable (1) vs non-potable (0).
              </p>
            </div>
          </div>

          {/* Supported Parameters Quick Reference */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Supported Physicochemical Parameters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WATER_PARAMETERS.map((param) => (
                <div key={param.key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                  <span className="font-medium text-slate-800 block truncate">{param.label}</span>
                  <span className="text-slate-500 font-mono text-[11px] block">{param.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prediction History / Empty State Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <History className="h-5 w-5 text-amber-600" />
                Recent Evaluation
              </h3>
              {totalPredictions > 0 && (
                <button
                  onClick={() => onNavigate('history')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  View All ({totalPredictions})
                </button>
              )}
            </div>

            {latestPrediction ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border ${
                    latestPrediction.result.prediction === 1
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest Result</span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(latestPrediction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        latestPrediction.result.prediction === 1 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="text-xl font-bold">{latestPrediction.result.predicted_label}</h4>
                  </div>
                  <div className="mt-3 text-xs space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Potable Probability:</span>
                      <span className="font-mono font-semibold">
                        {(latestPrediction.result.class_probabilities.potable * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Non-potable Probability:</span>
                      <span className="font-mono font-semibold">
                        {(latestPrediction.result.class_probabilities.non_potable * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie Chart of Saved Predictions */}
                {totalPredictions > 1 && chartData.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-600 text-center mb-1">
                      Local Evaluation Ratio ({totalPredictions} total)
                    </p>
                    <div className="h-36 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={4}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        Potable: {potableCount}
                      </span>
                      <span className="flex items-center gap-1 text-rose-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                        Non-potable: {nonPotableCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Meaningful Empty State */
              <div className="text-center py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Droplets className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Predictions Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Evaluate a water sample using the single prediction form or upload a batch CSV to see results and distribution metrics here.
                </p>
                <button
                  onClick={() => onNavigate('prediction')}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
                >
                  Perform First Prediction
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>History is maintained in local browser storage</span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950">Statutory Notice: </span>
          {WATER_SAFETY_DISCLAIMER_TEXT}
        </div>
      </div>
    </div>
  );
};
