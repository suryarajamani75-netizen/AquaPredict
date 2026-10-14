# AquaPredict — Project Structure Report

## 1. Directory Tree & Layout

```
AquaPredict/
│
├── frontend/                             # Phase 3: Modern React + Vite Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts                 # Centralized API client (health, ready, predict, batch)
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── DisclaimerBanner.tsx  # Statutory water safety disclaimer banner
│   │   │   │   └── ProbabilityMeter.tsx  # Dual-class probability gauge & confidence bars
│   │   │   └── layout/
│   │   │       ├── AppShell.tsx          # Responsive layout container
│   │   │       ├── Navbar.tsx            # Navigation header with live model status badge
│   │   │       └── Footer.tsx            # Footer with disclaimer and benchmark references
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx             # System status, workflow overview, recent history
│   │   │   ├── Prediction.tsx            # 9-parameter water assessment form with validation
│   │   │   ├── BatchAnalysis.tsx         # CSV dropzone, atomic validation, Recharts summary
│   │   │   ├── PredictionHistory.tsx     # LocalStorage history table, modal viewer, CSV export
│   │   │   └── About.tsx                 # Problem statement, parameter science, ML methodology
│   │   ├── test/
│   │   │   ├── setup.ts                  # Vitest setup with JSDOM and ResizeObserver polyfills
│   │   │   ├── apiClient.test.ts         # 8 unit tests for API client and error handling
│   │   │   ├── csv.test.ts               # 7 unit tests for CSV parsing and batch constraints
│   │   │   ├── history.test.ts           # 4 unit tests for LocalStorage persistence
│   │   │   └── App.test.tsx              # 6 integration UI tests for navigation and validation
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript interfaces matching backend Pydantic models
│   │   ├── utils/
│   │   │   ├── constants.ts              # 9 parameter bounds, units, benchmarks, disclaimers
│   │   │   ├── csv.ts                    # CSV parser, column validation, 100-sample limit
│   │   │   └── history.ts                # Browser LocalStorage helper with error resilience
│   │   ├── App.tsx                       # Root view router and application state
│   │   ├── index.css                     # Tailwind directives and custom utility classes
│   │   ├── main.tsx                      # Application DOM entrypoint
│   │   └── vite-env.d.ts                 # Vite client type definitions
│   ├── .env                              # Frontend environment config (VITE_API_BASE_URL)
│   ├── .env.example                      # Example environment template
│   ├── index.html                        # Application HTML shell with Inter typography
│   ├── package.json                      # NPM dependencies and build/test scripts
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── tailwind.config.js                # Custom environmental color palette
│   ├── tsconfig.json                     # TypeScript compiler options
│   └── vite.config.ts                    # Vite and Vitest configuration
│
├── backend/                              # Phase 2: Production Backend Service
│   ├── app/
│   │   ├── __init__.py                   # Package declaration
│   │   ├── main.py                       # FastAPI application factory, lifespan, CORS, error handling
│   │   ├── config.py                     # Centralized settings, dynamic path resolution, CORS origins
│   │   ├── schemas.py                    # Pydantic v2 request/response models with technical bounds
│   │   ├── model_service.py              # Singleton ML inference engine, lifecycle, batching
│   │   └── routes/
│   │       ├── __init__.py               # Routes package declaration
│   │       ├── health.py                 # Liveness (GET /health) and Readiness (GET /ready) probes
│   │       └── prediction.py             # Inference endpoints (POST /api/v1/predict, /predict/batch)
│   └── tests/                            # Automated Backend Test Suite
│       ├── __init__.py                   # Test package declaration
│       ├── conftest.py                   # Pytest fixtures and TestClient configuration
│       ├── test_health.py                # Health & readiness tests (200, 503)
│       ├── test_prediction.py            # Prediction & batch inference tests
│       └── test_validation.py            # Schema constraint, physical bound, and error tests
│
├── ml/                                   # Phase 1: Machine Learning Package
│   ├── __init__.py                       # Package declaration
│   ├── config.py                         # Paths, schema, hyperparameters, selection rules
│   ├── data_validation.py                # Schema & integrity validation, normalization
│   ├── preprocessing.py                  # Leakage-free preprocessing (imputation + scaling)
│   ├── pipeline.py                       # Scikit-learn end-to-end Pipeline builder
│   ├── evaluate.py                       # Calculation of accuracy, precision, recall, f1, roc-auc, CM
│   └── train.py                          # Training orchestrator, model comparator, serialization
│
├── tests/                                # Phase 1: Machine Learning Test Suite
│   ├── __init__.py                       # Test package declaration
│   ├── test_validation.py                # 18 unit tests for dataset validation & edge cases
│   └── test_pipeline.py                  # 12 unit tests for pipelines, metrics, serialization, loading
│
├── data/                                 # Raw and processed datasets (ignored in git)
│   ├── .gitkeep
│   └── water_potability.csv              # Genuine Kaggle benchmark dataset (3,276 records)
│
├── models/                               # Serialized Joblib model artifacts (ignored in git)
│   ├── .gitkeep
│   └── water_potability_pipeline.joblib  # Trained production RandomForest pipeline (~5.5 MB)
│
├── reports/                              # Evaluation, comparison, and metadata reports (ignored in git)
│   ├── .gitkeep
│   ├── model_comparison.json             # Multi-model benchmark report
│   ├── evaluation_report.json            # Winning model held-out evaluation metrics
│   └── training_metadata.json            # Lineage, environment, and metadata
│
├── docs/                                 # Architecture, plans, and reports
│   ├── development_plan.md               # Multi-phase roadmap and Phase 1, 2 & 3 specifications
│   ├── project_structure_report.md       # This document
│   ├── phase1_audit_report.md            # Phase 1 audit report
│   ├── phase2_audit_report.md            # Phase 2 audit report
│   └── phase3_audit_report.md            # Phase 3 audit report
│
├── pytest.ini                            # Pytest configuration (--import-mode=importlib)
├── requirements.txt                      # Pinned dependencies (FastAPI, scikit-learn, etc.)
├── .gitignore                            # Git safety policy (excludes datasets, models, caches, venv)
└── README.md                             # Documentation: setup, commands, limitations
```

---

## 2. Component Directory Analysis

| Directory / File | Purpose | Status |
| :--- | :--- | :--- |
| `frontend/` | React 18, Vite, TypeScript, Tailwind CSS, Recharts dashboard application. | **Complete & Verified (25/25 tests passing, build succeeds)** |
| `backend/app/` | Production FastAPI REST service, schemas, routes, and inference engine. | **Complete & Verified (Live Tested)** |
| `backend/tests/` | Automated test suite for health, prediction, batching, and schema validation. | **Complete & Passing (29/29 tests)** |
| `ml/` | Hosts ML logic, preprocessing, pipeline constructors, training, and evaluation. | **Complete & Verified (94% coverage)** |
| `tests/` | Pytest suites for data validation, edge cases, model training, and inference. | **Complete & Passing (30/30 tests)** |
| `requirements.txt` | Explicit Python dependency specifications. | **Complete & Verified** |
| `data/` | Destination folder for `water_potability.csv`. Git-tracked via `.gitkeep`. | **Verified with genuine 3,276-record dataset** |
| `models/` | Destination for `water_potability_pipeline.joblib`. Git-tracked via `.gitkeep`. | **Active: winning RandomForest pipeline serialized (5.5 MB)** |
| `reports/` | Destination for comparison, evaluation, and metadata JSON reports. | **Active: model_comparison, evaluation_report, training_metadata generated** |
| `docs/` | Architecture documentation, development plans, and audit reports. | **Complete & Up-to-date (Phases 1–3 audited)** |

---

## 3. Git Safety & Exclusion Policy

The root `.gitignore` enforces strict data and code safety rules:
1. **Virtual Environments**: `.venv/`, `venv/`, `env/` excluded.
2. **Bytecode / Caches**: `__pycache__/`, `*.pyc`, `.pytest_cache/` excluded.
3. **Environment & Secrets**: `.env`, `.env.*` excluded; `.env.example` tracked.
4. **Binary & Large Artifacts**: `models/*.joblib`, `data/*.csv`, `reports/*.json` excluded from commits while keeping folder structures via `!.gitkeep`.
5. **Frontend Artifacts**: `node_modules/` and `dist/` excluded.
