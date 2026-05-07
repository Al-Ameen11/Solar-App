"""
FastAPI inference service for solar energy prediction.

Run:
  uvicorn app:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


ROOT_DIR = Path(__file__).resolve().parent
MODEL_PATH = ROOT_DIR / "models" / "model.joblib"
METADATA_PATH = ROOT_DIR / "models" / "metadata.json"

DEFAULT_MODEL_VERSION = "untrained"
SYSTEM_LOSS_FACTOR_PERCENT = 82
SYSTEM_LOSS_FACTOR = SYSTEM_LOSS_FACTOR_PERCENT / 100.0


class CurrentWeatherInput(BaseModel):
    temperature: float
    humidity: float = Field(default=50.0, ge=0, le=100)
    cloudCover: float = Field(default=0.0, ge=0, le=100)
    windSpeed: Optional[float] = 0.0
    description: Optional[str] = ""


class ForecastDayInput(BaseModel):
    date: str
    avgTemp: float
    avgHumidity: float = Field(default=50.0, ge=0, le=100)
    avgCloudCover: float = Field(default=0.0, ge=0, le=100)
    avgWindSpeed: Optional[float] = 0.0
    description: Optional[str] = ""

    @field_validator("date")
    @classmethod
    def ensure_valid_date(cls, value: str) -> str:
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("date must use YYYY-MM-DD format") from exc
        return value


class PredictRequest(BaseModel):
    panelCapacity: float = Field(gt=0)
    latitude: float = 20.0
    currentWeather: CurrentWeatherInput
    forecastDays: List[ForecastDayInput] = Field(default_factory=list)


@dataclass
class LoadedModel:
    model: object
    feature_order: List[str]
    metadata: dict


app = FastAPI(title="Solar ML Prediction Service", version="2.0.0")

# Allow frontend to call ML service directly (e.g. /health for metrics)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_BUNDLE: Optional[LoadedModel] = None


def format_day_label(day_value: date) -> str:
    # Matches "Mon, Mar 9" style expected by the frontend.
    return day_value.strftime("%a, %b %d").replace(" 0", " ")


def calculate_panel_efficiency(temperature_c: float, base_efficiency: float = 20.0) -> float:
    stc_temp = 25.0
    temp_coefficient = -0.004
    cell_temp = temperature_c + 25.0
    efficiency_loss = temp_coefficient * (cell_temp - stc_temp)
    estimated = base_efficiency * (1.0 + efficiency_loss)
    return float(np.clip(estimated, 5.0, 25.0))


def estimate_irradiance_kw_per_m2(
    latitude_deg: float,
    day_of_year: int,
    hour_float: float,
    cloud_cover: float,
    humidity: float,
) -> float:
    lat_rad = math.radians(latitude_deg)
    declination = math.radians(23.45) * math.sin((2.0 * math.pi / 365.0) * (day_of_year - 81))
    hour_angle = math.radians(15.0 * (hour_float - 12.0))

    cos_zenith = (
        math.sin(lat_rad) * math.sin(declination)
        + math.cos(lat_rad) * math.cos(declination) * math.cos(hour_angle)
    )
    clear_sky = max(0.0, cos_zenith)

    cloud_ratio = np.clip(cloud_cover / 100.0, 0.0, 1.0)
    humidity_ratio = np.clip(humidity / 100.0, 0.0, 1.0)
    cloud_factor = max(0.08, 1.0 - 0.75 * (cloud_ratio**1.2))
    humidity_factor = max(0.75, 1.0 - 0.20 * humidity_ratio)

    return float(clear_sky * cloud_factor * humidity_factor)


def build_day_features(
    day_value: date,
    latitude: float,
    temperature: float,
    humidity: float,
    cloud_cover: float,
    wind_speed: float = 3.0,
) -> tuple[pd.DataFrame, np.ndarray]:
    base = datetime.combine(day_value, datetime.min.time())
    records = []
    irradiance_values = []
    for step in range(96):
        dt = base + timedelta(minutes=step * 15)
        hour_float = dt.hour + (dt.minute / 60.0)
        day_of_year = dt.timetuple().tm_yday
        irradiation = estimate_irradiance_kw_per_m2(
            latitude_deg=latitude,
            day_of_year=day_of_year,
            hour_float=hour_float,
            cloud_cover=cloud_cover,
            humidity=humidity,
        )
        irradiance_values.append(irradiation)

        records.append(
            {
                "irradiation": irradiation,
                "ambient_temperature": float(temperature),
                "humidity": float(humidity),
                "cloud_cover": float(cloud_cover),
                "wind_speed": float(wind_speed),
                "hour_sin": math.sin(2.0 * math.pi * hour_float / 24.0),
                "hour_cos": math.cos(2.0 * math.pi * hour_float / 24.0),
                "doy_sin": math.sin(2.0 * math.pi * day_of_year / 365.0),
                "doy_cos": math.cos(2.0 * math.pi * day_of_year / 365.0),
            }
        )

    return pd.DataFrame.from_records(records), np.array(irradiance_values, dtype=float)


def predict_day(
    bundle: LoadedModel,
    day_value: date,
    latitude: float,
    panel_capacity: float,
    temperature: float,
    humidity: float,
    cloud_cover: float,
    wind_speed: float = 3.0,
) -> dict:
    day_features, irradiation_values = build_day_features(
        day_value=day_value,
        latitude=latitude,
        temperature=temperature,
        humidity=humidity,
        cloud_cover=cloud_cover,
        wind_speed=wind_speed,
    )
    prediction_norm = np.clip(bundle.model.predict(day_features[bundle.feature_order]), 0.0, 1.2)

    predicted_kw = prediction_norm * float(panel_capacity) * SYSTEM_LOSS_FACTOR
    daily_energy_kwh = float(np.sum(predicted_kw * 0.25))
    peak_hours = float(daily_energy_kwh / max(panel_capacity, 1e-6))
    peak_hours = float(np.clip(peak_hours, 0.0, 12.0))

    panel_efficiency = calculate_panel_efficiency(temperature)
    peak_irradiance_w_m2 = float(np.max(irradiation_values) * 1000.0)

    return {
        "daily_energy_kwh": daily_energy_kwh,
        "peak_hours": peak_hours,
        "panel_efficiency": panel_efficiency,
        "peak_irradiance_w_m2": peak_irradiance_w_m2,
    }


def load_model_bundle() -> LoadedModel:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing trained model file: {MODEL_PATH}")
    artifact = joblib.load(MODEL_PATH)
    if isinstance(artifact, dict):
        model = artifact.get("model")
        feature_order = artifact.get("feature_order")
    else:
        model = artifact
        feature_order = None

    if model is None:
        raise RuntimeError("Invalid model artifact. Missing model object.")

    metadata = {}
    if METADATA_PATH.exists():
        metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))

    if not feature_order:
        feature_order = metadata.get("feature_order", [])
    if not feature_order:
        raise RuntimeError("Feature order not found in model artifact or metadata.")

    return LoadedModel(model=model, feature_order=feature_order, metadata=metadata)


@app.on_event("startup")
def startup_event() -> None:
    global MODEL_BUNDLE
    try:
        MODEL_BUNDLE = load_model_bundle()
        print(f"✅ Model loaded: v{MODEL_BUNDLE.metadata.get('model_version', 'unknown')}")
        print(f"   Features: {MODEL_BUNDLE.feature_order}")
    except Exception as e:
        MODEL_BUNDLE = None
        print(f"⚠️  Model not loaded: {e}")


@app.get("/health")
def health() -> dict:
    if MODEL_BUNDLE is None:
        return {
            "status": "degraded",
            "ready": False,
            "modelVersion": DEFAULT_MODEL_VERSION,
            "message": "Model not loaded. Run train.py and restart the service.",
        }

    metadata = MODEL_BUNDLE.metadata
    model_version = metadata.get("model_version", DEFAULT_MODEL_VERSION)
    metrics = metadata.get("metrics", {})

    return {
        "status": "ok",
        "ready": True,
        "modelVersion": model_version,
        "features": MODEL_BUNDLE.feature_order,
        "metrics": {
            "r2": metrics.get("normalized_r2"),
            "mae": metrics.get("normalized_mae"),
            "featureImportances": metrics.get("feature_importances", {}),
        },
    }


@app.post("/predict")
def predict(payload: PredictRequest) -> dict:
    if MODEL_BUNDLE is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Train the model using train.py first.",
        )

    today = datetime.now().date()
    current = payload.currentWeather
    today_prediction = predict_day(
        bundle=MODEL_BUNDLE,
        day_value=today,
        latitude=payload.latitude,
        panel_capacity=payload.panelCapacity,
        temperature=current.temperature,
        humidity=current.humidity,
        cloud_cover=current.cloudCover,
        wind_speed=current.windSpeed or 3.0,
    )

    daily_output = round(today_prediction["daily_energy_kwh"], 2)
    prediction = {
        "dailyOutput": daily_output,
        "monthlyOutput": round(daily_output * 30.0, 2),
        "yearlyOutput": round(daily_output * 365.0, 2),
        "efficiency": round(today_prediction["panel_efficiency"], 1),
        "peakHours": round(today_prediction["peak_hours"], 1),
        "irradiance": int(round(today_prediction["peak_irradiance_w_m2"])),
        "systemLossFactor": int(round(SYSTEM_LOSS_FACTOR_PERCENT)),
    }

    forecast_results = []
    for day_item in payload.forecastDays:
        day_value = datetime.strptime(day_item.date, "%Y-%m-%d").date()
        day_prediction = predict_day(
            bundle=MODEL_BUNDLE,
            day_value=day_value,
            latitude=payload.latitude,
            panel_capacity=payload.panelCapacity,
            temperature=day_item.avgTemp,
            humidity=day_item.avgHumidity,
            cloud_cover=day_item.avgCloudCover,
            wind_speed=day_item.avgWindSpeed or 3.0,
        )

        forecast_results.append(
            {
                "date": day_item.date,
                "dayLabel": format_day_label(day_value),
                "output": round(day_prediction["daily_energy_kwh"], 2),
                "temperature": round(day_item.avgTemp, 1),
                "cloudCover": int(round(day_item.avgCloudCover)),
                "humidity": int(round(day_item.avgHumidity)),
                "peakHours": round(day_prediction["peak_hours"], 1),
                "efficiency": round(day_prediction["panel_efficiency"], 1),
                "description": day_item.description or "",
            }
        )

    return {"prediction": prediction, "forecast": forecast_results}
