from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Iterable, List, Mapping, Optional

import numpy as np
import pandas as pd

from insilico_moa import DrugMoAInput

RADAR_AXES: List[tuple[str, str, bool]] = [
    ("BMI", "BMI", False),
    ("HighBP", "BP", False),
    ("HighChol", "Chol", False),
    ("PhysActivity", "Activity", True),
    ("GenHlth", "Gen health", False),
    ("PhysHlth", "Phys health", False),
]

COHORT_BUCKETS: List[tuple[str, float]] = [
    ("Responders", 0.12),
    ("Partial", 0.04),
    ("No effect", -0.005),
]

SAFETY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
SAFETY_DAY_WEIGHTS = np.array([0.95, 1.10, 0.90, 1.0, 1.05, 0.62, 0.58], dtype=float)


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


def _normalize_feature_for_radar(
    value: float,
    bounds: tuple[float, float],
    *,
    higher_is_better: bool,
) -> float:
    lower, upper = bounds
    if upper <= lower:
        return 50.0

    normalized = (float(value) - float(lower)) / (float(upper) - float(lower))
    normalized = float(np.clip(normalized, 0.0, 1.0))
    if not higher_is_better:
        normalized = 1.0 - normalized
    return round(normalized * 100.0, 1)


def build_biomarker_radar(
    baseline_features: Mapping[str, Any],
    trial_features: Mapping[str, Any],
    context: SimulationContext,
) -> List[Dict[str, Any]]:
    radar = []
    for feature, label, higher_is_better in RADAR_AXES:
        if feature not in context.bounded_columns:
            continue
        if feature not in baseline_features or feature not in trial_features:
            continue
        bounds = context.bounded_columns[feature]
        radar.append(
            {
                "biomarker": label,
                "baseline": _normalize_feature_for_radar(
                    float(baseline_features[feature]),
                    bounds,
                    higher_is_better=higher_is_better,
                ),
                "twin": _normalize_feature_for_radar(
                    float(trial_features[feature]),
                    bounds,
                    higher_is_better=higher_is_better,
                ),
            }
        )
    return radar


def _sample_cohort_member(
    baseline_features: pd.Series,
    context: SimulationContext,
    rng: np.random.Generator,
) -> pd.Series:
    sampled = baseline_features.copy()
    training_mean = pd.Series(context.training_mean)
    training_std = pd.Series(context.training_std)
    mutable_columns = set(context.intervention_mutable_columns)

    for column in context.feature_columns:
        baseline_value = float(baseline_features[column])
        if column in context.binary_columns:
            baseline_prob = 0.82 if baseline_value >= 0.5 else 0.18
            training_prob = float(np.clip(training_mean.get(column, baseline_value), 0.02, 0.98))
            sampled_prob = float(np.clip((0.7 * baseline_prob) + (0.3 * training_prob) + rng.normal(0.0, 0.04), 0.01, 0.99))
            sampled[column] = float(rng.random() < sampled_prob)
            continue

        spread_multiplier = 0.18 if column in mutable_columns else 0.10
        spread = max(float(training_std.get(column, 1.0)) * spread_multiplier, 0.05)
        sampled[column] = float(rng.normal(loc=baseline_value, scale=spread))

    return project_row_to_valid_support(sampled, context)


def build_cohort_summary(
    baseline_features: Mapping[str, Any],
    context: SimulationContext,
    moa_info: DrugMoAInput,
    risk_model: Optional[Any] = None,
    cohort_size: int = 720,
    seed: int = 7,
) -> Dict[str, Any]:
    baseline_series = row_to_feature_series(baseline_features, context.feature_columns)
    rng = np.random.default_rng(seed)

    bucket_counts = {
        "Responders": 0,
        "Partial": 0,
        "No effect": 0,
        "Adverse": 0,
    }
    adverse_events = [
        {"day": day, "mild": 0, "moderate": 0, "severe": 0}
        for day in SAFETY_DAYS
    ]
    improvements: List[float] = []

    cohort_size = max(int(cohort_size), 24)
    default_gamma = moa_info.resolved_gamma(context.default_gamma)

    for _ in range(cohort_size):
        cohort_member = _sample_cohort_member(baseline_series, context, rng)
        member_gamma = float(np.clip(default_gamma + rng.normal(0.0, 0.035), 0.05, 0.85))
        twin_member = simulate_trial_twin(
            cohort_member.to_dict(),
            context=context,
            moa_info=moa_info,
            gamma=member_gamma,
        )
        baseline_score = score_patient(cohort_member.to_dict(), risk_model=risk_model)
        trial_score = score_patient(twin_member.to_dict(), risk_model=risk_model)
        improvement = float(baseline_score - trial_score)
        improvements.append(improvement)

        assigned_bucket = "Adverse"
        for bucket_name, threshold in COHORT_BUCKETS:
            if improvement >= threshold:
                assigned_bucket = bucket_name
                break
        bucket_counts[assigned_bucket] += 1

        tolerability_load = (
            0.20
            + (member_gamma * 0.45)
            + (max(0.0, baseline_score - 0.35) * 0.25)
            + (max(0.0, float(cohort_member.get("BMI", 0.0)) - 30.0) / 20.0 * 0.15)
        )

        for day_index, day_weight in enumerate(SAFETY_DAY_WEIGHTS):
            mild_prob = float(np.clip(0.001 + (tolerability_load * 0.012 * day_weight), 0.0, 0.08))
            moderate_prob = float(np.clip(0.0004 + (tolerability_load * 0.0045 * day_weight), 0.0, 0.04))
            severe_prob = float(
                np.clip(0.0001 + (max(0.0, tolerability_load - 0.35) * 0.0018 * day_weight), 0.0, 0.015)
            )
            adverse_events[day_index]["mild"] += int(rng.random() < mild_prob)
            adverse_events[day_index]["moderate"] += int(rng.random() < moderate_prob)
            adverse_events[day_index]["severe"] += int(rng.random() < severe_prob)

    improvement_array = np.array(improvements, dtype=float)
    improvement_mean = float(improvement_array.mean()) if len(improvement_array) else 0.0
    improvement_std = float(improvement_array.std()) if len(improvement_array) else 0.0
    signal = 0.0 if improvement_std < 1e-6 else (improvement_mean / improvement_std) * np.sqrt(len(improvement_array))
    positive_rate = float((improvement_array > 0).mean()) if len(improvement_array) else 0.5
    confidence_score = float(np.clip(40.0 + (positive_rate * 30.0) + (25.0 * np.tanh(signal / 8.0)), 50.0, 99.0))

    return {
        "cohort_size": cohort_size,
        "cohort_breakdown": [
            {"name": name, "value": bucket_counts[name]}
            for name in ("Responders", "Partial", "No effect", "Adverse")
        ],
        "adverse_events": adverse_events,
        "confidence_score": confidence_score,
    }


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
    cohort_summary = build_cohort_summary(
        baseline_features.to_dict(),
        context=context,
        moa_info=moa_info,
        risk_model=risk_model,
    )

    return {
        "baseline_features": baseline_features.to_dict(),
        "trial_twin_features": trial_twin.to_dict(),
        "baseline_score": float(baseline_score),
        "trial_score": float(trial_score),
        "predicted_improvement": float(improvement),
        "gamma": float(gamma_value),
        "feature_deltas": summarize_feature_deltas(baseline_features.to_dict(), trial_twin.to_dict()),
        "biomarker_radar": build_biomarker_radar(
            baseline_features.to_dict(),
            trial_twin.to_dict(),
            context=context,
        ),
        "cohort_size": cohort_summary["cohort_size"],
        "cohort_breakdown": cohort_summary["cohort_breakdown"],
        "adverse_events": cohort_summary["adverse_events"],
        "confidence_score": cohort_summary["confidence_score"],
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
