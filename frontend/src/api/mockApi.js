const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);

const demoFeatureImportances = {
  BMI: 0.23,
  HighBP: 0.18,
  GenHlth: 0.16,
  DiffWalk: 0.12,
  PhysActivity: 0.09,
  HighChol: 0.08,
};

const estimateRisk = (patient) => {
  const score =
    0.3 * (patient.BMI / 50) +
    0.18 * patient.HighBP +
    0.17 * patient.HighChol +
    0.14 * patient.DiffWalk -
    0.1 * patient.PhysActivity +
    0.08 * (patient.GenHlth / 5) +
    0.06 * (patient.Age / 13);

  return clamp(1 / (1 + Math.exp(-3 * (score - 0.35))), 0.01, 0.99);
};

const buildTwin = (patient, gamma) => {
  return {
    ...patient,
    HighBP: patient.HighBP ? Number(gamma < 0.55) : 0,
    HighChol: patient.HighChol ? Number(gamma < 0.65) : 0,
    BMI: clamp(patient.BMI - gamma * 4.2, 16, 55),
    PhysActivity: Number(gamma > 0.22 || patient.PhysActivity),
    Fruits: Number(gamma > 0.2 || patient.Fruits),
    Veggies: Number(gamma > 0.12 || patient.Veggies),
    DiffWalk: patient.DiffWalk ? Number(gamma < 0.5) : 0,
    GenHlth: clamp(patient.GenHlth - gamma * 1.6, 1, 5),
    PhysHlth: clamp(patient.PhysHlth - gamma * 5.0, 0, 30),
    MentHlth: clamp(patient.MentHlth - gamma * 1.5, 0, 30),
  };
};

const summarizeDeltas = (baseline, trial) =>
  Object.keys(baseline)
    .map((feature) => ({
      feature,
      baseline: Number(baseline[feature]),
      trial_twin: Number(trial[feature]),
      delta: Number(trial[feature]) - Number(baseline[feature]),
    }))
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 6);

export async function scorePatient(patient) {
  return {
    mode: "mock",
    risk_score: estimateRisk(patient),
    feature_importances: demoFeatureImportances,
  };
}

export async function parseTrialPdf(_file) {
  throw new Error(
    "PDF parsing requires the live backend. Set VITE_API_MODE=backend and run the FastAPI server."
  );
}

export async function simulateTrial(patient, moa) {
  const gamma = clamp(moa.gamma ?? 0.3, 0, 1);
  const trialTwin = buildTwin(patient, gamma);
  const baselineScore = estimateRisk(patient);
  const trialScore = estimateRisk(trialTwin);
  const featureDeltas = summarizeDeltas(patient, trialTwin);

  return {
    mode: "mock",
    baseline_features: patient,
    trial_twin_features: trialTwin,
    baseline_score: baselineScore,
    trial_score: trialScore,
    predicted_improvement: baselineScore - trialScore,
    gamma,
    feature_deltas: featureDeltas,
    feature_importances: demoFeatureImportances,
    explanation_summary: `${moa.drug_name} applies a gamma-weighted recovery move toward a healthier diabetes profile.`,
  };
}
