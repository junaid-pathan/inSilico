from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional


COEFFICIENTS_PATH = Path(__file__).parent / "calibration" / "coefficients.json"


@lru_cache(maxsize=1)
def load_coefficients() -> Dict[str, Any]:
    with COEFFICIENTS_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _normalize(value: Optional[float], scale_abs: float, direction: str) -> float:
    """Turn a raw delta into a 0-1 'benefit' score (higher = better outcome)."""
    if value is None:
        return 0.0
    if direction == "negative_is_good":
        benefit = -value / scale_abs
    else:
        benefit = value / scale_abs
    return max(0.0, min(1.0, benefit))


def compute_gamma(endpoints: Dict[str, Optional[float]]) -> Dict[str, Any]:
    """
    Apply the calibrated formula to turn measured endpoints into a gamma value.

    Returns a dict with gamma, per-feature contributions, and the reasoning trail.
    """
    coefficients = load_coefficients()
    norm_cfg = coefficients["normalization"]
    weights = coefficients["weights"]
    intercept = float(coefficients.get("intercept", 0.0))
    bounds = coefficients.get("bounds", {"min": 0.05, "max": 0.85})

    hba1c_raw = endpoints.get("delta_hba1c_percent")
    weight_kg = endpoints.get("delta_weight_kg")
    weight_pct = endpoints.get("delta_weight_percent")
    sbp_raw = endpoints.get("delta_sbp_mmhg")
    rrr_raw = endpoints.get("relative_risk_reduction")

    hba1c_norm = _normalize(
        hba1c_raw,
        norm_cfg["delta_hba1c_percent"]["scale_abs"],
        norm_cfg["delta_hba1c_percent"]["direction"],
    )

    if weight_kg is not None:
        weight_norm = _normalize(
            weight_kg,
            norm_cfg["delta_weight_kg"]["scale_abs"],
            norm_cfg["delta_weight_kg"]["direction"],
        )
        weight_source = "delta_weight_kg"
    elif weight_pct is not None:
        weight_norm = _normalize(
            weight_pct,
            norm_cfg["delta_weight_percent"]["scale_abs"],
            norm_cfg["delta_weight_percent"]["direction"],
        )
        weight_source = "delta_weight_percent"
    else:
        weight_norm = 0.0
        weight_source = None

    sbp_norm = _normalize(
        sbp_raw,
        norm_cfg["delta_sbp_mmhg"]["scale_abs"],
        norm_cfg["delta_sbp_mmhg"]["direction"],
    )
    rrr_norm = _normalize(
        rrr_raw,
        norm_cfg["relative_risk_reduction"]["scale_abs"],
        norm_cfg["relative_risk_reduction"]["direction"],
    )

    contributions = {
        "hba1c": weights["hba1c"] * hba1c_norm,
        "weight": weights["weight"] * weight_norm,
        "sbp": weights["sbp"] * sbp_norm,
        "rrr": weights["rrr"] * rrr_norm,
    }

    gamma_raw = intercept + sum(contributions.values())
    gamma = max(float(bounds["min"]), min(float(bounds["max"]), gamma_raw))

    reported: List[str] = []
    if hba1c_raw is not None:
        reported.append(f"HbA1c change {hba1c_raw:+.2f}%")
    if weight_kg is not None:
        reported.append(f"weight change {weight_kg:+.1f} kg")
    elif weight_pct is not None:
        reported.append(f"weight change {weight_pct:+.1f}%")
    if sbp_raw is not None:
        reported.append(f"SBP change {sbp_raw:+.1f} mmHg")
    if rrr_raw is not None:
        reported.append(f"RRR {rrr_raw * 100:.0f}%")

    return {
        "gamma": gamma,
        "gamma_raw": gamma_raw,
        "contributions": contributions,
        "normalized": {
            "hba1c": hba1c_norm,
            "weight": weight_norm,
            "sbp": sbp_norm,
            "rrr": rrr_norm,
        },
        "weight_source": weight_source,
        "reported_deltas": reported,
        "coefficients_version": coefficients.get("version", "unknown"),
    }


def have_enough_signal(endpoints: Dict[str, Optional[float]]) -> bool:
    """Require at least two of the key endpoints to use the formula path."""
    filled = sum(
        1
        for key in ("delta_hba1c_percent", "delta_weight_kg", "delta_weight_percent", "relative_risk_reduction")
        if endpoints.get(key) is not None
    )
    return filled >= 2
