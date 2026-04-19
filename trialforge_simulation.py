from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Iterable, List, Mapping, Optional

import numpy as np
import pandas as pd

from trialforge_moa import DrugMoAInput


@dataclass
class SimulationContext:
    feature_columns: List[str]
    binary_columns: List[str]
    bounded_columns: Dict[str, tuple[float, float]]
    training_mean: Dict[str, float]
    training_std: Dict[str, float]
    healthy_mu: Dict[str, float]
    disease_mu: Dict[str, float]
    recovery_vector: Dict[str, float]
    intervention_mutable_columns: List[str] = field(default_factory=list)
    immutable_columns: List[str] = field(default_factory=list)
    default_gamma: float = 0.30

    def __post_init__(self) -> None:
        if not self.intervention_mutable_columns:
            self.intervention_mutable_columns = infer_intervention_mutable_columns(self.feature_columns)
        if not self.immutable_columns:
            mutable = set(self.intervention_mutable_columns)
            self.immutable_columns = [column for column in self.feature_columns if column not in mutable]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def infer_intervention_mutable_columns(feature_columns: Iterable[str]) -> List[str]:
    mutable_candidates = [
        "HighBP",
        "HighChol",
        "BMI",
        "PhysActivity",
        "Fruits",
        "Veggies",
        "GenHlth",
        "MentHlth",
        "PhysHlth",
        "DiffWalk",
        "Smoker",
        "HvyAlcoholConsump",
    ]
    available = set(feature_columns)
    return [column for column in mutable_candidates if column in available]


def infer_immutable_columns(feature_columns: Iterable[str]) -> List[str]:
    mutable = set(infer_intervention_mutable_columns(feature_columns))
    return [column for column in feature_columns if column not in mutable]


def build_simulation_context(
    train_df: pd.DataFrame,
    feature_columns: Optional[Iterable[str]] = None,
    intervention_mutable_columns: Optional[Iterable[str]] = None,
    immutable_columns: Optional[Iterable[str]] = None,
    default_gamma: float = 0.30,
) -> SimulationContext:
    if "target" not in train_df.columns:
        raise ValueError("Training data must contain a 'target' column.")

    feature_columns = list(feature_columns or [col for col in train_df.columns if col != "target"])
    features = train_df[feature_columns].copy()

    training_mean = features.mean()
    training_std = features.std().replace(0, 1.0)
    scaled = (features - training_mean) / training_std

    healthy_scaled = scaled[train_df["target"] == 0]
    disease_scaled = scaled[train_df["target"] == 1]

    binary_columns = [
        col for col in feature_columns if sorted(train_df[col].dropna().unique().tolist()) in ([0, 1], [0.0, 1.0])
    ]
    bounded_columns = {
        col: (float(train_df[col].min()), float(train_df[col].max()))
        for col in feature_columns
    }

    healthy_mu = healthy_scaled.mean()
    disease_mu = disease_scaled.mean()
    recovery_vector = healthy_mu - disease_mu

    return SimulationContext(
        feature_columns=feature_columns,
        binary_columns=binary_columns,
        bounded_columns=bounded_columns,
        training_mean=healthy_mu.mul(0).add(training_mean).to_dict(),
        training_std=training_std.to_dict(),
        healthy_mu=healthy_mu.to_dict(),
        disease_mu=disease_mu.to_dict(),
        recovery_vector=recovery_vector.to_dict(),
        intervention_mutable_columns=list(
            intervention_mutable_columns or infer_intervention_mutable_columns(feature_columns)
        ),
        immutable_columns=list(immutable_columns or infer_immutable_columns(feature_columns)),
        default_gamma=default_gamma,
    )


def choose_demo_patient(test_df: pd.DataFrame, preferred_target: int = 1) -> pd.Series:
    subset = test_df[test_df["target"] == preferred_target]
    if subset.empty:
        subset = test_df
    return subset.iloc[0]


def row_to_feature_series(
    patient_row: Mapping[str, Any] | pd.Series,
    feature_columns: Iterable[str],
) -> pd.Series:
    row = pd.Series(dict(patient_row))
    return row[list(feature_columns)].astype(float)


def project_row_to_valid_support(patient_features: pd.Series, context: SimulationContext) -> pd.Series:
    projected = patient_features.copy()

    for column in context.feature_columns:
        lower, upper = context.bounded_columns[column]
        projected[column] = float(np.clip(projected[column], lower, upper))

    for column in context.binary_columns:
        projected[column] = float(int(projected[column] >= 0.5))

    return projected


def simulate_trial_twin(
    patient_row: Mapping[str, Any] | pd.Series,
    context: SimulationContext,
    moa_info: DrugMoAInput,
    gamma: Optional[float] = None,
) -> pd.Series:
    gamma_value = moa_info.resolved_gamma(context.default_gamma) if gamma is None else max(0.0, min(1.0, float(gamma)))
    patient_features = row_to_feature_series(patient_row, context.feature_columns)

    mean = pd.Series(context.training_mean)
    std = pd.Series(context.training_std)
    recovery = pd.Series(context.recovery_vector)
    mutable_columns = set(context.intervention_mutable_columns)

    for column in recovery.index:
        if column not in mutable_columns:
            recovery[column] = 0.0

    scaled_patient = (patient_features - mean) / std
    scaled_twin = scaled_patient + (gamma_value * recovery)
    raw_twin = (scaled_twin * std) + mean

    for column in context.immutable_columns:
        if column in raw_twin.index and column in patient_features.index:
            raw_twin[column] = patient_features[column]

    return project_row_to_valid_support(raw_twin, context)


def estimate_mock_risk(patient_features: Mapping[str, Any]) -> float:
    row = pd.Series(dict(patient_features)).astype(float)
    score = (
        0.30 * row.get("BMI", 0.0) / 50.0
        + 0.18 * row.get("HighBP", 0.0)
        + 0.17 * row.get("HighChol", 0.0)
        + 0.14 * row.get("DiffWalk", 0.0)
        + 0.10 * row.get("PhysActivity", 0.0) * -1.0
        + 0.08 * row.get("GenHlth", 0.0) / 5.0
        + 0.06 * row.get("Age", 0.0) / 13.0
    )
    probability = 1.0 / (1.0 + np.exp(-3.0 * (score - 0.35)))
    return float(np.clip(probability, 0.01, 0.99))


def score_patient(patient_features: Mapping[str, Any], risk_model: Optional[Any] = None) -> float:
    if risk_model is None:
        return estimate_mock_risk(patient_features)

    feature_frame = pd.DataFrame([dict(patient_features)])
    if hasattr(risk_model, "predict_proba"):
        return float(risk_model.predict_proba(feature_frame)[0, 1])
    return float(risk_model.predict(feature_frame)[0])


def build_feature_delta_table(
    baseline_features: Mapping[str, Any],
    trial_features: Mapping[str, Any],
) -> pd.DataFrame:
    baseline = pd.Series(dict(baseline_features)).astype(float)
    trial = pd.Series(dict(trial_features)).astype(float)
    deltas = pd.DataFrame(
        {
            "baseline": baseline,
            "trial_twin": trial,
            "delta": trial - baseline,
            "abs_delta": (trial - baseline).abs(),
        }
    )
    return deltas.sort_values(["abs_delta", "delta"], ascending=[False, True])


def summarize_feature_deltas(
    baseline_features: Mapping[str, Any],
    trial_features: Mapping[str, Any],
    top_k: int = 6,
) -> List[Dict[str, Any]]:
    delta_table = build_feature_delta_table(baseline_features, trial_features)
    summary = []
    for feature, row in delta_table.head(top_k).iterrows():
        summary.append(
            {
                "feature": feature,
                "baseline": float(row["baseline"]),
                "trial_twin": float(row["trial_twin"]),
                "delta": float(row["delta"]),
            }
        )
    return summary


def score_patient_pair(
    patient_row: Mapping[str, Any] | pd.Series,
    context: SimulationContext,
    moa_info: DrugMoAInput,
    gamma: Optional[float] = None,
    risk_model: Optional[Any] = None,
) -> Dict[str, Any]:
    gamma_value = moa_info.resolved_gamma(context.default_gamma) if gamma is None else max(0.0, min(1.0, float(gamma)))
    baseline_features = row_to_feature_series(patient_row, context.feature_columns)
    trial_twin = simulate_trial_twin(patient_row, context=context, moa_info=moa_info, gamma=gamma_value)

    baseline_score = score_patient(baseline_features.to_dict(), risk_model=risk_model)
    trial_score = score_patient(trial_twin.to_dict(), risk_model=risk_model)
    improvement = baseline_score - trial_score

    return {
        "baseline_features": baseline_features.to_dict(),
        "trial_twin_features": trial_twin.to_dict(),
        "baseline_score": float(baseline_score),
        "trial_score": float(trial_score),
        "predicted_improvement": float(improvement),
        "gamma": float(gamma_value),
        "feature_deltas": summarize_feature_deltas(baseline_features.to_dict(), trial_twin.to_dict()),
    }


def export_simulation_bundle(
    context: SimulationContext,
    feature_importances: Optional[Mapping[str, float]] = None,
    demo_patient: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "context": context.to_dict(),
        "feature_importances": dict(feature_importances or {}),
        "demo_patient": dict(demo_patient or {}),
        "artifact_contract": {
            "risk_model": "Serialized estimator with predict_proba support.",
            "simulation_bundle": "Pickle or joblib file containing this dictionary.",
        },
    }


def build_explanation_summary(
    feature_deltas: Iterable[Mapping[str, Any]],
    moa_info: DrugMoAInput,
) -> str:
    top_changes = list(feature_deltas)[:3]
    if not top_changes:
        return f"{moa_info.drug_name} applied a gamma-guided recovery move with no material feature changes."

    formatted = ", ".join(
        f"{item['feature']} ({item['delta']:+.2f})" for item in top_changes
    )
    return (
        f"{moa_info.drug_name} shifts the patient toward the healthier centroid, with the largest simulated "
        f"changes in {formatted}. The gamma score encodes the assumed intervention strength."
    )
