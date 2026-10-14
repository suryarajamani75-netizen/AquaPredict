import React from 'react';
import { Droplets, ShieldCheck, Database, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 text-slate-500 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Droplets className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-800 text-base">AquaPredict</span>
            </div>
            <p className="text-slate-500 max-w-md text-xs leading-relaxed">
              Predictive Modeling for Water Quality Assessment. An environmental machine-learning platform providing statistical potability estimation based on physical and chemical water parameters.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-brand-600" /> Random Forest Pipeline
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-teal-600" /> 3,276 Water Records
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Bounded Validation
              </span>
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-3">
              Standard Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>WHO Guidelines for Drinking-water Quality</li>
              <li>US EPA National Secondary Standards</li>
              <li>BIS IS 10500:2012 Drinking Water Specification</li>
              <li>Standard Methods for Water Examination</li>
            </ul>
          </div>

          {/* Disclaimer & Privacy */}
          <div>
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-3">
              Data & Storage
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>Browser Local Storage for History</li>
              <li>No Server-Side Tracking</li>
              <li>Predictions Processed via REST API</li>
              <li>Research & Evaluation Model Aid</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AquaPredict. Predictive Modeling for Water Quality Assessment.</p>
          <p className="text-center sm:text-right">
            Model predictions are statistical aids and do not substitute certified laboratory testing.
          </p>
        </div>
      </div>
    </footer>
  );
};
