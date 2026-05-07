"""
Tests for the solar ML prediction service.
Run: pytest tests/ -v
"""
import math
import pytest
from datetime import date
from pathlib import Path

# Add parent to path for imports
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import (
    calculate_panel_efficiency,
    estimate_irradiance_kw_per_m2,
    build_day_features,
    format_day_label,
)


class TestPanelEfficiency:
    """Tests for calculate_panel_efficiency()"""

    def test_efficiency_at_stc(self):
        """At 0°C ambient (25°C cell), efficiency should equal base"""
        eff = calculate_panel_efficiency(0.0)
        assert eff == pytest.approx(20.0, abs=0.5)

    def test_efficiency_decreases_with_heat(self):
        """Higher temperatures should reduce efficiency"""
        cool = calculate_panel_efficiency(15.0)
        hot = calculate_panel_efficiency(45.0)
        assert cool > hot

    def test_efficiency_clamped_minimum(self):
        """Efficiency should not go below 5%"""
        eff = calculate_panel_efficiency(100.0)
        assert eff >= 5.0

    def test_efficiency_clamped_maximum(self):
        """Efficiency should not exceed 25%"""
        eff = calculate_panel_efficiency(-30.0)
        assert eff <= 25.0


class TestIrradiance:
    """Tests for estimate_irradiance_kw_per_m2()"""

    def test_noon_irradiance_positive(self):
        """Irradiance at solar noon should be positive for low latitudes"""
        irr = estimate_irradiance_kw_per_m2(
            latitude_deg=20.0, day_of_year=80, hour_float=12.0,
            cloud_cover=0.0, humidity=50.0
        )
        assert irr > 0

    def test_night_irradiance_zero(self):
        """Irradiance at midnight should be zero"""
        irr = estimate_irradiance_kw_per_m2(
            latitude_deg=20.0, day_of_year=80, hour_float=0.0,
            cloud_cover=0.0, humidity=50.0
        )
        assert irr == 0.0

    def test_clouds_reduce_irradiance(self):
        """Heavy cloud cover should reduce irradiance"""
        clear = estimate_irradiance_kw_per_m2(
            latitude_deg=20.0, day_of_year=80, hour_float=12.0,
            cloud_cover=0.0, humidity=50.0
        )
        cloudy = estimate_irradiance_kw_per_m2(
            latitude_deg=20.0, day_of_year=80, hour_float=12.0,
            cloud_cover=90.0, humidity=50.0
        )
        assert clear > cloudy

    def test_humidity_reduces_irradiance(self):
        """Higher humidity should slightly reduce irradiance"""
        dry = estimate_irradiance_kw_per_m2(
            latitude_deg=20.0, day_of_year=80, hour_float=12.0,
            cloud_cover=0.0, humidity=10.0
        )
        humid = estimate_irradiance_kw_per_m2(
            latitude_deg=20.0, day_of_year=80, hour_float=12.0,
            cloud_cover=0.0, humidity=95.0
        )
        assert dry > humid


class TestBuildDayFeatures:
    """Tests for build_day_features()"""

    def test_returns_96_timesteps(self):
        """Should generate 96 features (15-min intervals for 24 hours)"""
        df, irr = build_day_features(
            day_value=date(2026, 3, 10),
            latitude=20.0,
            temperature=30.0,
            humidity=50.0,
            cloud_cover=20.0,
            wind_speed=5.0,
        )
        assert len(df) == 96
        assert len(irr) == 96

    def test_features_have_correct_columns(self):
        """Feature DataFrame should have all 9 features"""
        df, _ = build_day_features(
            day_value=date(2026, 3, 10),
            latitude=20.0,
            temperature=30.0,
            humidity=50.0,
            cloud_cover=20.0,
            wind_speed=5.0,
        )
        expected_cols = [
            "irradiation", "ambient_temperature", "humidity",
            "cloud_cover", "wind_speed", "hour_sin", "hour_cos",
            "doy_sin", "doy_cos"
        ]
        for col in expected_cols:
            assert col in df.columns, f"Missing column: {col}"

    def test_cyclical_features_bounded(self):
        """Sin/cos features should be in [-1, 1]"""
        df, _ = build_day_features(
            day_value=date(2026, 6, 21),
            latitude=20.0,
            temperature=35.0,
            humidity=60.0,
            cloud_cover=30.0,
            wind_speed=4.0,
        )
        for col in ["hour_sin", "hour_cos", "doy_sin", "doy_cos"]:
            assert df[col].min() >= -1.0 - 1e-6
            assert df[col].max() <= 1.0 + 1e-6


class TestFormatDayLabel:
    """Tests for format_day_label()"""

    def test_format_single_digit_day(self):
        """Should not have leading zero in day"""
        label = format_day_label(date(2026, 3, 5))
        assert "05" not in label
        assert "5" in label

    def test_format_includes_weekday(self):
        """Should include abbreviated weekday"""
        label = format_day_label(date(2026, 3, 10))  # Tuesday
        assert "Tue" in label
