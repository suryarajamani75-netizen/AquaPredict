# AquaPredict — Local Run & Verification Report

**Project Title**: Predictive Modeling for Water Quality Assessment  
**Project Name**: AquaPredict  
**Date**: October 14, 2026  
**Auditor**: Senior Full-Stack Developer & Software Testing Engineer  

---

## 1. Original Problem Reported

When executing:
```bash
npm run dev
```
from the project root directory (`C:\Users\91827\OneDrive\sanjay`), npm returned the following error:
```text
npm error code ENOENT
npm error syscall open
npm error path C:\Users\91827\OneDrive\sanjay\package.json
npm error errno -4058
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open 'C:\Users\91827\OneDrive\sanjay\package.json'
```

---

## 2. Root Cause Analysis

1. **Working Directory Mismatch**:
   - The AquaPredict project uses a clean multi-tier repository architecture:
     - The **FastAPI backend and ML pipeline** (`backend/` and `ml/`) are Python packages orchestrated from the repository root (`C:\Users\91827\OneDrive\sanjay`).
     - The **React + Vite frontend** (`frontend/`) is a standalone npm project located in `C:\Users\91827\OneDrive\sanjay\frontend` with its own `package.json`, `vite.config.ts`, `tsconfig.json`, and `node_modules`.
   - Running `npm run dev` directly from the project root fails because npm looks for `package.json` in the current working directory, which does not (and should not) exist at the root level to prevent conflicting with Python root tools.

2. **Resolution Approach**:
   - In accordance with architectural best practices and project rules ("Do not create a root package.json merely to hide the incorrect working-directory problem"), the frontend development server must be started from the `frontend/` directory, where `package.json` and all installed dependencies reside.

---

## 3. Verification of System Components

### 3.1 Backend Application (`http://127.0.0.1:8000`)
- **Runtime Command**:
  ```bash
  python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Probes Verified**:
  - `GET http://127.0.0.1:8000/health`: HTTP 200 `{"status":"ok","version":"0.2.0","environment":"development"}`
  - `GET http://127.0.0.1:8000/ready`: HTTP 200 `{"status":"ready","model_loaded":true,"model_name":"RandomForestClassifier","details":"Model pipeline is active and ready for inference."}`
- **Model Artifact**: `models/water_potability_pipeline.joblib` exists, loads into memory as `RandomForestClassifier`, and computes predictions.
- **Inference Verification**:
  - Single Prediction: Returns genuine classification (`prediction: 1`, `predicted_label: "Potable"`, `class_probabilities: { "non_potable": 0.3742, "potable": 0.6258 }`).
  - Batch Prediction: Evaluates multiple records atomically with full class probabilities.
  - Input Validation: Out-of-bounds `ph: 25.0` returned HTTP 422 with structured field errors.

### 3.2 Frontend Application (`http://127.0.0.1:5173`)
- **Runtime Command**:
  ```bash
  # From C:\Users\91827\OneDrive\sanjay\frontend
  npm run dev
  ```
- **HTTP Status**: HTTP 200 on `http://127.0.0.1:5173/`.
- **Environment**: Configured via `frontend/.env` pointing to `VITE_API_BASE_URL=http://127.0.0.1:8000`.
- **CORS**: Backend allows `http://localhost:5173` and `http://127.0.0.1:5173`.

---

## 4. Automated Test Results

### 4.1 Frontend Automated Test Suite (Vitest)
```bash
# Executed in C:\Users\91827\OneDrive\sanjay\frontend
npm run test
```
- **Test Files**: 4 passed (4 total)
- **Tests**: **25 passed (25 total)**
  - `src/test/apiClient.test.ts`: 8 passed
  - `src/test/csv.test.ts`: 7 passed
  - `src/test/history.test.ts`: 4 passed
  - `src/test/App.test.tsx`: 6 passed
- **Status**: 100% Pass Rate

### 4.2 Backend & ML Regression Test Suite (Pytest)
```bash
# Executed in C:\Users\91827\OneDrive\sanjay
python -m pytest --cov=ml --cov=backend.app
```
- **Tests**: **59 passed (59 total)**
- **Coverage**: **91% overall statement coverage**
- **Status**: 100% Pass Rate

### 4.3 Total Project Test Suite
- **Combined Automated Tests**: **84 passed, 0 failed**.

---

## 5. Production Build Result

```bash
# Executed in C:\Users\91827\OneDrive\sanjay\frontend
npm run build
```
- **Command**: `tsc -b && vite build`
- **Output**:
  - `dist/index.html` (0.99 kB)
  - `dist/assets/index-39kgPJLA.css` (29.62 kB)
  - `dist/assets/index-BZCfvfiM.js` (627.25 kB)
- **Status**: Build succeeded with exit code 0.

---

## 6. Exact Commands to Run the Project Locally

To run the complete full-stack application, open two separate terminal windows in your environment:

### Terminal 1 — Start the FastAPI Backend:
```bash
cd C:\Users\91827\OneDrive\sanjay
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

### Terminal 2 — Start the React + Vite Frontend:
```bash
cd C:\Users\91827\OneDrive\sanjay\frontend
npm run dev
```
*Frontend Application: [http://127.0.0.1:5173](http://127.0.0.1:5173)*

---

## 7. Known Limitations & Remaining Issues

1. **Zero Critical Blockers**: Both backend and frontend run with 100% test pass rates and successful production builds.
2. **Browser Local Storage**: History records are stored locally in the browser and do not sync across different machines.
3. **Statutory Limitation**: Predictions are statistical aids based on 9 physicochemical measurements and do not replace certified biological/microbiological laboratory testing.
