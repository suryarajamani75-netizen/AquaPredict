import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  X,
  AlertTriangle,
} from 'lucide-react';
import { PredictionHistoryItem } from '../types';
import { historyService } from '../utils/history';
import { WATER_SAFETY_DISCLAIMER_TEXT } from '../utils/constants';
import { ProbabilityMeter } from '../components/common/ProbabilityMeter';

export const PredictionHistory: React.FC = () => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PredictionHistoryItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadHistory = () => {
    setHistory(historyService.getHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = () => {
    historyService.clearHistory();
    setHistory([]);
    setShowClearConfirm(false);
    setSelectedItem(null);
  };

  const exportHistoryCsv = () => {
    if (history.length === 0) return;

    const headers = [
      'Record_ID',
      'Timestamp',
      'Source',
      'Predicted_Label',
      'Potable_Probability',
      'Non_Potable_Probability',
      'ph',
      'Hardness',
      'Solids',
      'Chloramines',
      'Sulfate',
      'Conductivity',
      'Organic_carbon',
      'Trihalomethanes',
      'Turbidity',
      'Model_Name',
    ];

    const rows = history.map((item) => [
      item.id,
      item.timestamp,
      item.source,
      item.result.predicted_label,
      (item.result.class_probabilities.potable * 100).toFixed(2) + '%',
      (item.result.class_probabilities.non_potable * 100).toFixed(2) + '%',
      item.inputs.ph ?? '',
      item.inputs.Hardness,
      item.inputs.Solids,
      item.inputs.Chloramines,
      item.inputs.Sulfate ?? '',
      item.inputs.Conductivity,
      item.inputs.Organic_carbon,
      item.inputs.Trihalomethanes ?? '',
      item.inputs.Turbidity,
      `"${item.result.model_name}"`,
    ]);

    const csvData = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aquapredict_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="h-7 w-7 text-amber-600" />
            Evaluation History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Audit log of water potability evaluations performed during your current browser sessions.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportHistoryCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Local Storage Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Client-Side Persistence: </span>
          History records are stored locally in your web browser (HTML5 LocalStorage) for privacy and rapid offline inspection. They are not persisted to a remote database and will not synchronize across other browsers or devices.
        </div>
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Clear Local History?</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This will permanently delete all {history.length} saved water assessment records from your browser's local storage. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Yes, Delete History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table or Empty State */}
      {history.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Assessment</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 font-mono">pH / Hardness / Solids</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.map((item) => {
                  const isPotable = item.result.prediction === 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPotable
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPotable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {item.result.predicted_label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-700">
                        {isPotable
                          ? `${(item.result.class_probabilities.potable * 100).toFixed(1)}%`
                          : `${(item.result.class_probabilities.non_potable * 100).toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {item.inputs.ph !== null ? Number(item.inputs.ph).toFixed(1) : 'null'} pH /{' '}
                          {Number(item.inputs.Hardness).toFixed(0)} mg/L / {Number(item.inputs.Solids).toFixed(0)} ppm
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 capitalize">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3 text-brand-600" />
                          {item.source}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-semibold transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Assessment History Recorded</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Once you submit water samples via the single prediction form or batch CSV assessment, your results and probability distributions will be recorded here.
          </p>
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">Evaluation Audit Record</span>
                <span className="text-xs font-mono text-slate-400">({selectedItem.id})</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status & Probability */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedItem.result.prediction === 1
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-3">
                {selectedItem.result.prediction === 1 ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-600" />
                )}
                <div>
                  <h4 className="text-lg font-bold">{selectedItem.result.predicted_label}</h4>
                  <p className="text-xs font-mono text-slate-500">Binary Class: {selectedItem.result.prediction}</p>
                </div>
              </div>
              <div className="text-right text-xs font-mono">
                <p className="text-slate-500">Model Pipeline</p>
                <p className="font-bold text-slate-800">{selectedItem.result.model_name}</p>
              </div>
            </div>

            {/* Probability Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <ProbabilityMeter
                probabilities={selectedItem.result.class_probabilities}
                predictedLabel={selectedItem.result.predicted_label}
              />
            </div>

            {/* Evaluated Parameters */}
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                All 9 Water Physicochemical Measurements
              </h5>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {Object.entries(selectedItem.inputs).map(([k, v]) => (
                  <div key={k} className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700">
                    <span className="text-[10px] text-slate-400 block truncate">{k}</span>
                    <span className="font-bold">{v !== null ? Number(v).toFixed(2) : 'null (imputed)'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Water Safety Disclaimer */}
            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
              <span className="font-bold">Disclaimer: </span>
              {selectedItem.result.disclaimer || WATER_SAFETY_DISCLAIMER_TEXT}
            </p>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5" />
                {new Date(selectedItem.timestamp).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
