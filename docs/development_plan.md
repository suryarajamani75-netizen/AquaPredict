# AquaPredict — Development Plan

## 1. Project Overview
**AquaPredict** is an end-to-end machine-learning application engineered for automated water quality and potability assessment. It analyzes nine core biophysical and chemical water indicators to determine whether water is safe for human consumption, supporting public health safety, municipal utilities, and environmental water surveillance.

---

## 2. Multi-Phase Architectural Roadmap

```
+--------------------------------------------------------------------------------+
|                        AquaPredict Roadmap Architecture                         |
+--------------------------------------------------------------------------------+
|                                                                                |
|  [PHASE 1: Foundation & ML Pipeline]  <== (COMPLETED & AUDITED)                |
|    - Project layout, .gitignore, Git safety                                    |
|    - Genuine dataset validation (3,276 records, 0 duplicate, 0 schema errors)  |
|    - Scikit-learn leakage-free pipelines (Imputer + Scaler + Model)            |
|    - Multi-model evaluation (Logistic Regression, Random Forest, GBDT)         |
|    - Model comparison & selection: RandomForest (F1=0.5263, ROC-AUC=0.6720)    |
|    - Joblib serialization and evaluation reports                               |
|    - Comprehensive test suite (30 unit & integration tests, 94% coverage)     |
|                                                                                |
|  [PHASE 2: Production Backend API]  <== (COMPLETED & AUDITED)                  |
|    - FastAPI REST service (`backend/app/`)                                     |
|    - Pydantic v2 schemas for request validation & technical boundaries         |
|    - Model serving lifecycle & singleton inference engine (`model_service.py`) |
|    - Endpoints: `GET /health`, `GET /ready`, `POST /api/v1/predict`, `/batch`  |
|    - Interactive Swagger (`/docs`) and ReDoc (`/redoc`) OpenAPI specs          |
|    - Automated backend test suite (29 tests, 59 total project tests, 91% cov)  |
|    - Verified live ASGI execution on localhost                                 |
|                                                                                |
|  [PHASE 3: Responsive Interactive Frontend] <== (COMPLETED & AUDITED)          |
|    - Modern, accessible web application (`frontend/`)                          |
|    - Built with React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide    |
|    - Real-time parameter inputs (physical units, validation, range guides)     |
|    - Dual-class probability meter and visual confidence indicators             |
|    - Batch CSV assessment with atomic validation (1 to 100 samples)            |
|    - Client-side prediction history in LocalStorage with CSV export            |
|    - 25 automated Vitest/Testing Library tests & successful production build   |
|    - Verified end-to-end integration against live FastAPI backend              |
|                                                                                |
|  [PHASE 4: Deployment, Monitoring & Hardening] (Future Phase)                  |
|    - Multi-stage Docker containerization                                      |
|    - CI/CD automation pipeline                                                 |
|    - Data drift detection & inference logging                                  |
+--------------------------------------------------------------------------------+
```

---

## 3. Phase 1 Implementation Summary
- **Data Validation (`ml/data_validation.py`)**: Strict schema enforcement over 9 parameters (`ph`, `Hardness`, `Solids`, `Chloramines`, `Sulfate`, `Conductivity`, `Organic_carbon`, `Trihalomethanes`, `Turbidity`) and binary target `Potability`.
- **Leakage-Free Preprocessing (`ml/preprocessing.py`)**: `SimpleImputer(strategy='median')` and `StandardScaler()` fit strictly on training splits.
- **Model Portfolio (`ml/pipeline.py`, `ml/train.py`)**: Stratified 80/20 train/test evaluation. `RandomForestClassifier` selected with held-out F1 of 0.5263 and ROC-AUC of 0.6720. Serialized to `models/water_potability_pipeline.joblib`.
- **Testing**: 30 tests passed with 94% coverage.

---

## 4. Phase 2 Implementation Summary
- **FastAPI Architecture (`backend/app/`)**: Lifespan startup handler, singleton model service (`model_service.py`), Pydantic v2 schemas (`schemas.py`), CORS middleware.
- **Endpoints**:
  - `GET /health`: Liveness probe (`{"status": "ok", "version": "0.2.0", "environment": "development"}`).
  - `GET /ready`: Readiness probe returning model status (`RandomForestClassifier`) or HTTP 503.
  - `POST /api/v1/predict`: Single water sample evaluation with `extra='forbid'` and physical range validation.
  - `POST /api/v1/predict/batch`: Bounded batch evaluation (1 to 100 samples) with atomic validation (Policy A).
- **Testing**: 29 backend tests passed. Total regression suite of 59 tests with 91% code coverage.

---

## 5. Phase 3 Implementation Summary
- **Frontend Stack (`frontend/`)**: React 18, Vite 5, TypeScript 5.6, Tailwind CSS 3.4, Recharts 2.15, Lucide React 0.475.
- **Components & Layout**:
  - `AppShell`, `Navbar`, and `Footer` with responsive desktop/mobile drawer and live backend status indicator.
  - `Dashboard`: System status, 4-stage pipeline visualization, parameter benchmark guides, evaluation ratio chart.
  - `Prediction`: 9-parameter form, input validation, "Fill Sample Data", dual-class probability meter, input breakdown, statutory disclaimer.
  - `BatchAnalysis`: Drag-and-drop CSV upload, 100-sample limit, atomic validation row reporting, results table, Recharts bar chart, and CSV export.
  - `PredictionHistory`: Client-side LocalStorage audit history, detail modal, CSV export, and clear confirmation.
  - `About`: Comprehensive parameter science, WHO / EPA guidelines, ML methodology, and documented limitations.
- **Testing & Build**:
  - 25 automated frontend tests passed via Vitest and React Testing Library (`npm test`).
  - Production build completed successfully via `npm run build` (`dist/`).
  - Live end-to-end integration verified against live running FastAPI service.
