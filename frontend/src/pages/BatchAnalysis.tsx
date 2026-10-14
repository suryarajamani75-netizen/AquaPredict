import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Loader2,
  FileText,
  BarChart2,
} from 'lucide-react';
import { WaterSampleInput, PredictionResponse } from '../types';
import { parseWaterQualityCsv } from '../utils/csv';
import { apiClient, ApiClientError } from '../api/client';
import { historyService } from '../utils/history';
import { WATER_SAFETY_DISCLAIMER_TEXT } from '../utils/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const BatchAnalysis: React.FC = () => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedSamples, setParsedSamples] = useState<WaterSampleInput[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PredictionResponse[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setCsvErrors(['Only standard comma-separated (.csv) files are supported.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCsv(text);
    };
    reader.readAsText(file);
  };

  const processCsv = (text: string) => {
    setApiError(null);
    setResults(null);
    const parseResult = parseWaterQualityCsv(text);

    setCsvErrors(parseResult.errors);
    setCsvWarnings(parseResult.warnings);

    if (parseResult.success) {
      setParsedSamples(parseResult.samples);
    } else {
      setParsedSamples([]);
    }
  };

  const loadSampleBatch = () => {
    const sampleCsv = `ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity
7.08,204.89,20791.32,7.30,368.52,564.31,10.38,86.99,2.96
5.74,129.42,18630.06,6.64,342.24,592.84,15.18,56.33,4.50
6.90,190.21,22000.50,8.12,380.10,480.20,12.40,65.80,3.10
8.15,225.40,15400.10,5.80,310.00,420.50,11.20,72.40,3.85
7.50,180.60,19500.00,7.00,350.00,510.00,13.50,80.00,2.80`;
    setCsvContent(sampleCsv);
    processCsv(sampleCsv);
  };

  const handleClear = () => {
    setCsvContent('');
    setParsedSamples([]);
    setCsvErrors([]);
    setCsvWarnings([]);
    setApiError(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitBatch = async () => {
    if (parsedSamples.length === 0 || isLoading) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await apiClient.predictBatch(parsedSamples);
      setResults(response.predictions);

      // Save to local history
      historyService.saveBatchPredictions(parsedSamples, response.predictions);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
      } else {
        setApiError('Batch evaluation request failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResultsCsv = () => {
    if (!results || results.length !== parsedSamples.length) return;

    const headers = [
      'Sample_ID',
      'ph',
      'Hardness',
      'Solids',
      'Chloramines',
      'Sulfate',
      'Conductivity',
      'Organic_carbon',
      'Trihalomethanes',
      'Turbidity',
      'Predicted_Potability',
      'Predicted_Label',
      'Potable_Probability',
      'Non_Potable_Probability',
    ];

    const rows = parsedSamples.map((s, idx) => {
      const res = results[idx];
      return [
        `#${idx + 1}`,
        s.ph ?? '',
        s.Hardness,
        s.Solids,
        s.Chloramines,
        s.Sulfate ?? '',
        s.Conductivity,
        s.Organic_carbon,
        s.Trihalomethanes ?? '',
        s.Turbidity,
        res.prediction,
        res.predicted_label,
        (res.class_probabilities.potable * 100).toFixed(2) + '%',
        (res.class_probabilities.non_potable * 100).toFixed(2) + '%',
      ].join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aquapredict_batch_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats for visualization
  const potableCount = results ? results.filter((r) => r.prediction === 1).length : 0;
  const nonPotableCount = results ? results.filter((r) => r.prediction === 0).length : 0;
  const distributionData = [
    { name: 'Potable', count: potableCount, color: '#059669' },
    { name: 'Non-potable', count: nonPotableCount, color: '#dc2626' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet className="h-7 w-7 text-teal-600" />
          Batch Water Quality Assessment
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload or paste up to 100 water samples in CSV format for bulk ML potability classification with atomic validation.
        </p>
      </div>

      {/* Atomic Validation Note */}
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Atomic Validation Policy (Policy A): </span>
          The backend API requires 1 to 100 samples per batch. If any single sample contains invalid bounds or non-numeric values, the entire request is safely rejected to prevent partial inconsistencies.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload & CSV Input */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Input Sample Records</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadSampleBatch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors"
              >
                Load Sample Batch
              </button>
              {(csvContent || parsedSamples.length > 0) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl p-6 text-center cursor-pointer transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">Click to upload CSV file</p>
            <p className="text-[11px] text-slate-400 mt-1">Must include all 9 parameter columns (1 to 100 rows)</p>
          </div>

          {/* CSV Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Or Paste Raw CSV Data</span>
              <span className="text-[11px] font-mono text-slate-400">
                {parsedSamples.length} valid / 100 max
              </span>
            </label>
            <textarea
              rows={7}
              placeholder="ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity&#10;7.08,204.89,20791.32,7.30,368.52,564.31,10.38,86.99,2.96"
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                processCsv(e.target.value);
              }}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Warnings */}
          {csvWarnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              {csvWarnings.map((w, i) => (
                <p key={i} className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Errors */}
          {csvErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              {csvErrors.map((err, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </p>
              ))}
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                Backend Batch Error:
              </p>
              <p className="mt-1">{apiError}</p>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="button"
            disabled={parsedSamples.length === 0 || isLoading || csvErrors.length > 0}
            onClick={handleSubmitBatch}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              parsedSamples.length === 0 || isLoading || csvErrors.length > 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 active:translate-y-[1px]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating Batch of {parsedSamples.length} Samples...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Evaluate {parsedSamples.length} Samples
              </>
            )}
          </button>
        </div>

        {/* Results & Distribution */}
        <div className="lg:col-span-7 space-y-6">
          {results ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Batch Results Summary ({results.length} Samples)
                  </h3>
                  <p className="text-xs text-slate-400">All predictions generated by live Random Forest backend.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadResultsCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CSV
                </button>
              </div>

              {/* Distribution Chart */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 items-center">
                <div className="sm:col-span-2 h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                    <span className="font-semibold">Potable:</span>
                    <span className="font-mono font-bold">{potableCount} ({Math.round((potableCount / results.length) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-rose-50 text-rose-900 border border-rose-200">
                    <span className="font-semibold">Non-potable:</span>
                    <span className="font-mono font-bold">{nonPotableCount} ({Math.round((nonPotableCount / results.length) * 100)}%)</span>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold">Label</th>
                      <th className="px-3 py-2.5 font-bold">Potable Prob</th>
                      <th className="px-3 py-2.5 font-bold">pH</th>
                      <th className="px-3 py-2.5 font-bold">Solids</th>
                      <th className="px-3 py-2.5 font-bold">Conductivity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {results.map((res, idx) => {
                      const input = parsedSamples[idx];
                      const isPotable = res.prediction === 1;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 text-slate-400 font-bold">#{idx + 1}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isPotable
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPotable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {res.predicted_label}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-700">
                            {(res.class_probabilities.potable * 100).toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {input?.ph !== null ? input?.ph?.toFixed(2) : 'null (imputed)'}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{input?.Solids?.toFixed(0)}</td>
                          <td className="px-3 py-2 text-slate-600">{input?.Conductivity?.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Water Safety Disclaimer */}
              <p className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200 rounded-lg p-3">
                <span className="font-bold">Disclaimer: </span>
                {WATER_SAFETY_DISCLAIMER_TEXT}
              </p>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <BarChart2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">No Batch Evaluated</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Provide water quality records in CSV format on the left and submit to view prediction distributions, table rows, and exportable CSV reports.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSampleBatch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold"
              >
                <FileText className="h-3.5 w-3.5" />
                Try Sample 5-Row CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
