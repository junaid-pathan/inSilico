from __future__ import annotations

import pickle
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

try:
    import joblib
except ImportError:  # pragma: no cover
    joblib = None

from trialforge_moa import DrugMoAInput
from trialforge_simulation import (
    SimulationContext,
    build_explanation_summary,
    score_patient,
    score_patient_pair,
)


ARTIFACT_DIR = Path(__file__).resolve().parent / "model_artifacts"
RISK_MODEL_PATH = ARTIFACT_DIR / "risk_model.joblib"
SIMULATION_BUNDLE_PATH = ARTIFACT_DIR / "simulation_bundle.pkl"


def _demo_context() -> SimulationContext:
    feature_columns = [
        "HighBP",
        "HighChol",
        "BMI",
        "Smoker",
        "PhysActivity",
        "Fruits",
        "Veggies",
        "DiffWalk",
        "GenHlth",
        "PhysHlth",
        "MentHlth",
        "Age",
    ]
    return SimulationContext(
        feature_columns=feature_columns,
        binary_columns=["HighBP", "HighChol", "Smoker", "PhysActivity", "Fruits", "Veggies", "DiffWalk"],
        bounded_columns={
            "HighBP": (0.0, 1.0),
            "HighChol": (0.0, 1.0),
            "BMI": (16.0, 55.0),
            "Smoker": (0.0, 1.0),
            "PhysActivity": (0.0, 1.0),
            "Fruits": (0.0, 1.0),
            "Veggies": (0.0, 1.0),
            "DiffWalk": (0.0, 1.0),
            "GenHlth": (1.0, 5.0),
            "PhysHlth": (0.0, 30.0),
            "MentHlth": (0.0, 30.0),
            "Age": (1.0, 13.0),
        },
        training_mean={
            "HighBP": 0.43,
            "HighChol": 0.41,
            "BMI": 29.5,
            "Smoker": 0.20,
            "PhysActivity": 0.72,
            "Fruits": 0.63,
            "Veggies": 0.79,
            "DiffWalk": 0.18,
            "GenHlth": 2.85,
            "PhysHlth": 4.8,
            "MentHlth": 3.6,
            "Age": 8.4,
        },
        training_std={
            "HighBP": 0.49,
            "HighChol": 0.49,
            "BMI": 6.1,
            "Smoker": 0.40,
            "PhysActivity": 0.45,
            "Fruits": 0.48,
            "Veggies": 0.41,
            "DiffWalk": 0.38,
            "GenHlth": 1.10,
            "PhysHlth": 7.6,
            "MentHlth": 7.0,
            "Age": 3.1,
        },
        healthy_mu={
            "HighBP": -0.35,
            "HighChol": -0.28,
            "BMI": -0.22,
            "Smoker": -0.12,
            "PhysActivity": 0.20,
            "Fruits": 0.15,
            "Veggies": 0.12,
            "DiffWalk": -0.30,
            "GenHlth": -0.24,
            "PhysHlth": -0.25,
            "MentHlth": -0.08,
            "Age": -0.04,
        },
        disease_mu={
            "HighBP": 0.38,
            "HighChol": 0.31,
            "BMI": 0.26,
            "Smoker": 0.10,
            "PhysActivity": -0.22,
            "Fruits": -0.11,
            "Veggies": -0.08,
            "DiffWalk": 0.34,
            "GenHlth": 0.29,
            "PhysHlth": 0.27,
            "MentHlth": 0.06,
            "Age": 0.05,
        },
        recovery_vector={
            "HighBP": -0.73,
            "HighChol": -0.59,
            "BMI": -0.48,
            "Smoker": -0.22,
            "PhysActivity": 0.42,
            "Fruits": 0.26,
            "Veggies": 0.20,
            "DiffWalk": -0.64,
            "GenHlth": -0.53,
            "PhysHlth": -0.52,
            "MentHlth": -0.14,
            "Age": -0.09,
        },
        default_gamma=0.30,
    )


def _demo_patient() -> Dict[str, float]:
    return {
        "HighBP": 1.0,
        "HighChol": 1.0,
        "BMI": 35.0,
        "Smoker": 0.0,
        "PhysActivity": 0.0,
        "Fruits": 0.0,
        "Veggies": 1.0,
        "DiffWalk": 1.0,
        "GenHlth": 4.0,
        "PhysHlth": 12.0,
        "MentHlth": 7.0,
        "Age": 9.0,
    }


def _demo_feature_importances() -> Dict[str, float]:
    return {
        "BMI": 0.23,
        "HighBP": 0.18,
        "GenHlth": 0.16,
        "DiffWalk": 0.12,
        "PhysActivity": 0.09,
        "HighChol": 0.08,
    }


def _hydrate_patient_features(state: Dict[str, Any], patient: Dict[str, float]) -> Dict[str, float]:
    """
    Backfill any features that the frontend does not currently expose.

    The notebook artifact may contain a larger BRFSS feature set than the
    simplified demo UI. In that case, fall back to training means so the same
    backend can support both the rich artifact model and the compact frontend.
    """
    hydrated = dict(state["context"].training_mean)
    hydrated.update(state.get("demo_patient", {}))
    hydrated.update(patient)
    return hydrated


def _load_optional_joblib(path: Path) -> Any | None:
    if not path.exists() or joblib is None:
        return None
    return joblib.load(path)


def _load_optional_pickle(path: Path) -> Any | None:
    if not path.exists():
        return None
    with path.open("rb") as handle:
        return pickle.load(handle)


@lru_cache(maxsize=1)
def load_backend_state() -> Dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    risk_model = _load_optional_joblib(RISK_MODEL_PATH)
    simulation_bundle = _load_optional_pickle(SIMULATION_BUNDLE_PATH) or {}

    context_payload = simulation_bundle.get("context")
    context = SimulationContext(**context_payload) if context_payload else _demo_context()
    feature_importances = simulation_bundle.get("feature_importances") or _demo_feature_importances()
    demo_patient = simulation_bundle.get("demo_patient") or _demo_patient()

    return {
        "mode": "artifact" if (risk_model is not None and context_payload is not None) else "demo",
        "risk_model": risk_model,
        "context": context,
        "feature_importances": feature_importances,
        "demo_patient": demo_patient,
        "artifact_paths": {
            "risk_model": str(RISK_MODEL_PATH),
            "simulation_bundle": str(SIMULATION_BUNDLE_PATH),
        },
    }


def score_patient_payload(patient: Dict[str, float]) -> Dict[str, Any]:
    state = load_backend_state()
    hydrated_patient = _hydrate_patient_features(state, patient)
    risk_score = score_patient(hydrated_patient, risk_model=state["risk_model"])
    return {
        "mode": state["mode"],
        "risk_score": risk_score,
        "feature_importances": state["feature_importances"],
    }


def simulate_payload(patient: Dict[str, float], moa_info: DrugMoAInput) -> Dict[str, Any]:
    state = load_backend_state()
    hydrated_patient = _hydrate_patient_features(state, patient)
    result = score_patient_pair(
        patient_row=hydrated_patient,
        context=state["context"],
        moa_info=moa_info,
        risk_model=state["risk_model"],
    )
    result["mode"] = state["mode"]
    result["feature_importances"] = state["feature_importances"]
    result["explanation_summary"] = build_explanation_summary(result["feature_deltas"], moa_info)
    result["demo_patient"] = state["demo_patient"]
    return result
