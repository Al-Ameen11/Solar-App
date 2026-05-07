"""
Baseline model comparison script.
Trains Linear Regression, Decision Tree, and Random Forest
on the same dataset/split to produce a comparison table for the paper.
"""

import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# Reuse data preparation from train.py
from train import prepare_dataset, FEATURE_ORDER


def run_comparison():
    print("Preparing dataset...")
    prepared = prepare_dataset()
    frame = prepared.frame

    train_df = frame[frame["DATE_TIME_15"] <= prepared.split_time].copy()
    test_df = frame[frame["DATE_TIME_15"] > prepared.split_time].copy()

    x_train = train_df[FEATURE_ORDER]
    y_train = train_df["target_norm"]
    x_test = test_df[FEATURE_ORDER]
    y_test = test_df["target_norm"]

    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=20, min_samples_leaf=2, random_state=42),
        "Random Forest (Ours)": RandomForestRegressor(
            n_estimators=200, max_depth=20, min_samples_leaf=2, random_state=42, n_jobs=-1
        ),
    }

    print(f"\nTraining samples: {len(x_train):,}")
    print(f"Test samples:     {len(x_test):,}")
    print(f"Features:         {len(FEATURE_ORDER)}\n")
    print(f"{'Model':<25} {'R²':>8} {'MAE':>8} {'Train Time':>12}")
    print("-" * 56)

    for name, model in models.items():
        t0 = time.time()
        model.fit(x_train, y_train)
        train_time = time.time() - t0

        preds = np.clip(model.predict(x_test), 0.0, 1.2)
        r2 = r2_score(y_test, preds)
        mae = mean_absolute_error(y_test, preds)

        print(f"{name:<25} {r2:>8.4f} {mae:>8.4f} {train_time:>10.2f}s")

    # Also compute absolute metrics for Random Forest
    rf = models["Random Forest (Ours)"]
    pred_norm = np.clip(rf.predict(x_test), 0.0, 1.2)
    pred_power = pred_norm * test_df["INVERTER_P99"].to_numpy()
    abs_mae = mean_absolute_error(test_df["AC_POWER"], pred_power)
    abs_r2 = r2_score(test_df["AC_POWER"], pred_power)
    print(f"\nRandom Forest absolute metrics: R²={abs_r2:.4f}, MAE={abs_mae:.2f}W")


if __name__ == "__main__":
    run_comparison()
