# Solar ML Service (FastAPI)

This service provides ML-based solar prediction for the Node backend.

## 1) Install dependencies

```powershell
python -m pip install -r requirements.txt
```

## 2) Train model artifacts

Run from `ml-service`:

```powershell
python train.py
```

This generates:

- `models/model.joblib`
- `models/metadata.json`

## 3) Start FastAPI server

```powershell
uvicorn app:app --host 0.0.0.0 --port 8000
```

Health endpoint:

```text
GET http://127.0.0.1:8000/health
```

## 4) Connect from Node backend

Set in `server/.env` (optional, defaults shown):

```text
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_TIMEOUT_MS=5000
```

Node `POST /api/predict` now:

- Calls FastAPI ML `/predict`
- Falls back to existing JS model if FastAPI is unavailable
