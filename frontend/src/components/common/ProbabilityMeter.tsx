import React from 'react';
import { ClassProbabilities } from '../../types';

interface ProbabilityMeterProps {
  probabilities: ClassProbabilities;
  predictedLabel: 'Non-potable' | 'Potable';
}

export const ProbabilityMeter: React.FC<ProbabilityMeterProps> = ({
  probabilities,
  predictedLabel,
}) => {
  const potablePercent = Math.round(probabilities.potable * 1000) / 10;
  const nonPotablePercent = Math.round(probabilities.non_potable * 1000) / 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Model Probability Distribution</span>
        <span className="text-xs text-slate-500">Binary Classification Confidence</span>
      </div>

      {/* Potable Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className={`font-medium flex items-center gap-1.5 ${predictedLabel === 'Potable' ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Potable Class (1)
          </span>
          <span className="font-mono text-slate-700 font-semibold">{potablePercent.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${potablePercent}%` }}
            aria-valuenow={potablePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>

      {/* Non-potable Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className={`font-medium flex items-center gap-1.5 ${predictedLabel === 'Non-potable' ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Non-potable Class (0)
          </span>
          <span className="font-mono text-slate-700 font-semibold">{nonPotablePercent.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${nonPotablePercent}%` }}
            aria-valuenow={nonPotablePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  );
};
