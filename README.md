# AquaPredict — Water Quality Assessment System

AquaPredict is an enterprise-grade machine-learning application engineered for automated water potability assessment. The system evaluates 9 biophysical and chemical water indicators to determine whether water is safe for human consumption, supporting environmental water surveillance, municipal utilities, and public health safety.

> **Status Notice: Phase 1, Phase 2, and Phase 3 Complete & Verified.**
> - **Phase 1 (ML Engine)**: Genuine 3,276-record Water Potability dataset validated; leakage-free scikit-learn training pipeline implemented; winning `RandomForestClassifier` pipeline serialized to `models/water_potability_pipeline.joblib`.
> - **Phase 2 (FastAPI Backend)**: High-performance FastAPI REST API built under `backend/app/` with Pydantic v2 schemas, health/readiness probes, single/batch prediction endpoints, CORS middleware, safe error handling, live HTTP verification, and 59 passing regression tests (91% total coverage).
> - **Phase 3 (Frontend & Integration)**: Polished environmental analytics dashboard built with React 18, Vite, TypeScript, Tailwind CSS, Recharts, and Lucide React. Integrates single prediction form, batch CSV assessment (1–100 samples with atomic validation), client-side prediction history in local storage, Recharts distribution charts, accessibility, and 25 passing Vitest tests.

---

## 1. Technology Stack

### Backend & Machine Learning
- **Language & Runtime**: Python 3.10+ (tested on Python 3.11.9)
- **API Framework**: FastAPI 0.138+ (ASGI)
- **Data Validation & Settings**: Pydantic v2.12+
- **ASGI Web Server**: Uvicorn 0.49+
- **Machine Learning**: Scikit-Learn 1.9+, NumPy 2.4+, Pandas 3.0+
- **Model Serialization**: Joblib 1.5+
- **Testing & Coverage**: Pytest 9.1+, HTTPX 0.28+, Pytest-Cov 7.1+ (59 tests passed)

### Frontend User Interface
- **Framework & Bundler**: React 18.3+, Vite 5.4+
- **Language**: TypeScript 5.6+
- **Styling**: Tailwind CSS 3.4+, PostCSS, Autoprefixer
- **Data Visualization**: Recharts 2.15+
- **Icons**: Lucide React 0.475+
- **Testing Framework**: Vitest 2.1+, Testing Library React 16.1+, JSDOM 25.0+ (25 tests passed)

---

## 2. Project Directory Structure

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
│   ├── config.py                         # Schema constants, hyperparameters, selection rules
│   ├── data_validation.py                # Dataset validator (schema, boundaries, collisions)
│   ├── preprocessing.py                  # Leakage-free ColumnTransformer (imputation + scaling)
│   ├── pipeline.py                       # Model factory (Logistic Regression, Random Forest, GBDT)
│   ├── evaluate.py                       # Dynamic evaluation (Accuracy, Prec, Rec, F1, ROC-AUC, CM)
│   └── train.py                          # Training orchestrator, model comparator, serialization
│
├── tests/                                # Phase 1: Machine Learning Test Suite
│   ├── __init__.py                       # Test package declaration
│   ├── test_validation.py                # 18 unit tests for dataset validation edge cases
│   └── test_pipeline.py                  # 12 unit tests for pipeline, serialization, and evaluation
│
├── data/                                 # Datasets (git-ignored, tracked via .gitkeep)
│   ├── .gitkeep
│   └── water_potability.csv              # Genuine Kaggle benchmark dataset (3,276 records)
│
├── models/                               # Serialized Model Artifacts (git-ignored)
│   ├── .gitkeep
│   └── water_potability_pipeline.joblib  # Trained production RandomForest pipeline (~5.5 MB)
│
├── reports/                              # Generated Training & Evaluation Reports (git-ignored)
│   ├── .gitkeep
│   ├── model_comparison.json             # Multi-model benchmark report
│   ├── evaluation_report.json            # Winning model held-out evaluation metrics
│   └── training_metadata.json            # Reproducibility lineage, timestamps, environment
│
├── docs/                                 # Architectural Documentation & Audit Reports
│   ├── development_plan.md               # Phased roadmap & implementation specs
│   ├── project_structure_report.md       # Directory layout and safety analysis
│   ├── phase1_audit_report.md            # Phase 1 independent audit report
│   ├── phase2_audit_report.md            # Phase 2 independent backend audit report
│   └── phase3_audit_report.md            # Phase 3 frontend & integration audit report
│
├── pytest.ini                            # Pytest configuration (--import-mode=importlib)
├── requirements.txt                      # Pinned Python dependencies
├── .gitignore                            # Git safety policy (excludes datasets, models, caches)
└── README.md                             # This document
```

---

## 3. Installation & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.11.9)
- Node.js 18+ (tested on Node.js v24.13.0 and NPM 11.6.2)
- PowerShell (Windows) or Bash (Linux/macOS)

### 3.1 Backend Setup
```bash
# Navigate to project root
cd AquaPredict

# (Optional) Create and activate a Python virtual environment
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install Python backend and ML dependencies
pip install -r requirements.txt
```

### 3.2 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install
```

### 3.3 Dataset Setup & Model Generation
The application evaluates water potability using the benchmark Water Potability dataset (3,276 records).
- **Dataset Placement**: Place `water_potability.csv` into `data/water_potability.csv` (git-ignored to comply with repository size best practices).
- **Dataset Validation**: Run `python -m ml.data_validation` to verify schema integrity, non-negative values, and numerical physical boundaries.
- **Model Training & Artifact Generation**: Execute `python -m ml.train` to train the candidate models (Logistic Regression, Random Forest, Gradient Boosting), evaluate held-out metrics, and serialize the winning pipeline to `models/water_potability_pipeline.joblib`.

---

## 4. How to Run the Application Locally

AquaPredict runs locally with the FastAPI backend on port 8000 and the Vite frontend on port 5173.

### Terminal 1: Start the Backend API
```bash
# From workspace root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- API Liveness: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Model Readiness: [http://127.0.0.1:8000/ready](http://127.0.0.1:8000/ready)

### Terminal 2: Start the Frontend UI
```bash
# From workspace root
cd frontend
npm run dev
```
- Open in browser: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 5. How to Build & Test

### 5.1 Run Backend Regression Tests (59 Tests)
```bash
# From workspace root
python -m pytest --cov=ml --cov=backend.app --cov-report=term-missing
```
*Result: 59 passed in ~6.5s, 91% total statement coverage.*

### 5.2 Run Frontend Unit & Integration Tests (25 Tests)
```bash
# From frontend/ directory
npm test
```
*Result: 25 passed across 4 test suites (apiClient, csv, history, App).*

### 5.3 Build Frontend for Production
```bash
# From frontend/ directory
npm run build
```
*Result: Production bundle generated in `frontend/dist/` with zero TypeScript or Vite errors.*

---

## 6. End-to-End Features & User Experience

1. **Dashboard**:
   - Visual environmental theme in deep blue and teal.
   - Real-time backend status badge showing `Model Online: RandomForestClassifier`.
   - Complete 4-stage pipeline workflow visualization (Input Validation → Median Imputation → Standard Scaling → Classification).
   - Supported parameter quick reference with physical units.
   - Evaluation ratio doughnut chart using real local history (or meaningful empty state when fresh).

2. **Water Quality Prediction**:
   - Interactive form covering all 9 parameters with physical units, scientific ranges, and WHO/EPA benchmarks.
   - Client-side validation preventing invalid or out-of-bounds submissions.
   - "Fill Sample Data" button for testing typical values.
   - Dual-class probability gauge (`Potable` vs `Non-potable` percentages).
   - Evaluated inputs breakdown, model metadata, and statutory disclaimer banner.

3. **Batch Analysis**:
   - Accepts CSV upload or pasted CSV records (1 to 100 samples).
   - Validates CSV headers against the 9 required parameters.
   - Automatically drops extra columns (such as `Potability`) to prevent 422 schema rejections.
   - Enforces atomic validation (Policy A) with row-level error reporting.
   - Results table with confidence scores, parameter columns, and CSV export.
   - Recharts horizontal bar chart visualizing batch potable vs non-potable breakdown.

4. **Prediction History**:
   - Automatically records all single and batch evaluations.
   - Persisted locally in browser HTML5 LocalStorage (clearly disclosed; zero tracking).
   - Searchable audit table with timestamps, potability badges, and parameter summaries.
   - "Details" modal for complete record inspection.
   - "Export CSV" and "Clear History" actions.

5. **About the Project**:
   - Environmental problem statement and rationale for predictive machine-learning screening.
   - In-depth science and WHO / EPA / BIS benchmark limits for each parameter.
   - Complete ML pipeline details: Random Forest F1=0.5263, ROC-AUC=0.6720, leakage-free imputation.
   - System architecture overview and documented model limitations.

---

## 7. Mandatory Operational & Safety Disclaimer

> **IMPORTANT NOTICE**: Machine learning predictions generated by AquaPredict are statistical decision-support estimations derived from numerical measurements. **An AI prediction DOES NOT constitute certified biological, microbiological, or chemical laboratory testing.** Water intended for municipal distribution or human consumption must comply with national and international accredited regulatory laboratory standards (e.g., WHO, US EPA, BIS).
>
> In water potability classification, False Potable errors (predicting non-potable water as potable) carry severe public health hazards. AquaPredict predictions must never be used as the sole criterion for drinking water clearance.

---

## 8. Project Roadmap & Phase Status

- **Phase 1 (Complete & Audited)**: Dataset validation, ML training pipeline, multi-model benchmark, Joblib serialization, 30 unit tests.
- **Phase 2 (Complete & Audited)**: Production FastAPI REST backend, Pydantic v2 schemas, health/readiness probes, single/batch prediction endpoints, live HTTP verification, 29 backend tests.
- **Phase 3 (Complete & Audited)**: Modern React/Vite/TypeScript frontend, centralized API client, form validation, batch CSV evaluation, LocalStorage history, 25 Vitest tests, and end-to-end integration verification.
- **Phase 4**: Multi-stage Docker containerization and deployment.
