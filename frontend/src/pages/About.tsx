import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Server,
  Monitor,
} from 'lucide-react';
import { WATER_PARAMETERS, WATER_SAFETY_DISCLAIMER_TEXT } from '../utils/constants';

export const About: React.FC = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-3">
          Predictive Modeling for Water Quality Assessment
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About the AquaPredict Project
        </h1>
        <p className="mt-2 text-base text-slate-600 leading-relaxed">
          AquaPredict is a software system uniting machine-learning analytics, robust RESTful backend services, and interactive environmental interfaces for rapid water potability screening.
        </p>
      </div>

      {/* Mandatory Statutory Notice */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <h4 className="font-bold text-amber-950 text-base">Scientific & Water Safety Disclaimer</h4>
          <p className="text-amber-900">{WATER_SAFETY_DISCLAIMER_TEXT}</p>
          <p className="text-amber-800 text-xs pt-1">
            Machine-learning models serve exclusively as screening aids and decision-support tools. They can never substitute certified microbiological, chemical, and physical laboratory assays.
          </p>
        </div>
      </div>

      {/* Project Objectives */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          Project Objectives & Problem Statement
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            Clean drinking water is an indispensable prerequisite for public health and sustainable development. Conventional laboratory analysis of municipal and rural water sources requires specialized spectrophotometers, chromatographic instruments, and microbial incubation cultures that take hours to days to produce conclusive results.
          </p>
          <p>
            The AquaPredict initiative evaluates whether statistical machine learning classifiers can identify non-potable and potable water profiles from standard physicochemical measurements, providing immediate priority alerts to water management personnel and environmental researchers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wider text-brand-700">Phase 1: ML Pipeline</h4>
              <p className="text-xs text-slate-500">
                Rigorous data validation, leakage-free median imputation, z-score standard scaling, and scikit-learn ensemble training.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wider text-teal-700">Phase 2: FastAPI Service</h4>
              <p className="text-xs text-slate-500">
                Type-safe REST API with Pydantic validation, health & readiness probes, atomic batch assessment, and full test suite.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wider text-emerald-700">Phase 3: Web Dashboard</h4>
              <p className="text-xs text-slate-500">
                Modern responsive client interface, single and batch evaluation, probability visualization, and local audit history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Supported Parameters Science */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-teal-600" />
          Physicochemical Parameter Science
        </h2>
        <p className="text-sm text-slate-600">
          The underlying model assesses water safety across 9 biophysical indicators defined in environmental water quality frameworks:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WATER_PARAMETERS.map((param) => (
            <div key={param.key} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-900 text-sm">{param.label}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {param.unit}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{param.description}</p>
              <div className="pt-1 border-t border-slate-100 text-[11px] font-medium text-brand-700">
                Guideline: {param.standardBenchmark}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Machine Learning Pipeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-brand-600" />
          Machine Learning Pipeline & Methodology
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Model Selection & Artifact</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                During Phase 1, multiple candidate architectures (Logistic Regression, Random Forest, and Gradient Boosting) were evaluated on stratified 80/20 train/test splits. Random Forest achieved the superior test set balance:
              </p>
              <ul className="text-xs space-y-1.5 font-mono text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Algorithm: RandomForestClassifier (n_estimators=100)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Test Set F1 Score: 0.5263
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Test Set ROC-AUC: 0.6720
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Artifact: models/water_potability_pipeline.joblib
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Leakage-Free Preprocessing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To prevent optimistic performance estimates and data leakage:
              </p>
              <ul className="text-xs space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span><strong>Median Imputation:</strong> Missing pH, Sulfate, and Trihalomethanes values are replaced with learned medians computed strictly on the training partition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span><strong>Z-Score Standardization:</strong> Features are normalized using training-set mean and standard deviation via StandardScaler.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span><strong>Atomic Pipeline Binding:</strong> The imputer, scaler, and estimator are serialized together in a single scikit-learn Pipeline object.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Stack Architecture */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-600" />
          System Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Server className="h-5 w-5 text-brand-600" />
              FastAPI REST Backend
            </div>
            <ul className="text-xs space-y-2 text-slate-600">
              <li>• FastAPI with asynchronous lifecycle management and structured logging.</li>
              <li>• Pydantic v2 schemas enforcing strict numerical bounds and finite numbers.</li>
              <li>• Explicit CORS middleware whitelist for verified frontend development origins.</li>
              <li>• Endpoints: <code className="bg-slate-100 px-1 py-0.5 rounded">/health</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">/ready</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">/api/v1/predict</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">/api/v1/predict/batch</code>.</li>
              <li>• 59 passing unit/integration regression tests with 91% code coverage.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Monitor className="h-5 w-5 text-teal-600" />
              React & Vite Frontend
            </div>
            <ul className="text-xs space-y-2 text-slate-600">
              <li>• React 18, TypeScript, and Vite for fast development and production builds.</li>
              <li>• Tailwind CSS design system with an environmental palette (deep blue, teal).</li>
              <li>• Recharts integration for class probability and batch distribution charts.</li>
              <li>• LocalStorage prediction history with CSV export and zero server tracking.</li>
              <li>• Vitest and React Testing Library automated test suite.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Model Limitations & Future Enhancements */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Model Limitations & Roadmap
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Current Limitations</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>The dataset contains 3,276 records with moderate class imbalance (~39% potable, ~61% non-potable).</li>
              <li>Critical biological contaminants (such as fecal coliform, E. coli, and giardia cysts) are not captured in the 9 physicochemical feature fields.</li>
              <li>The model operates purely on statistical correlation and cannot detect heavy metals (lead, arsenic, mercury) not reflected in conductivity and TDS.</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1">Planned Future Enhancements</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Integration with live IoT water sensor telemetry using MQTT/WebSockets.</li>
              <li>PostgreSQL database persistence with multi-tenant laboratory accounts.</li>
              <li>Expanded neural network models incorporating heavy metal spectroscopy data.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
