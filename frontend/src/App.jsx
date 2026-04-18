import { useMemo, useState } from "react";

import { API_MODE, api } from "./api";
import DrugComposer from "./components/DrugComposer";
import PatientForm from "./components/PatientForm";
import SectionCard from "./components/SectionCard";
import SimulationPanel from "./components/SimulationPanel";

const patientPresets = {
  highRisk: {
    HighBP: 1,
    HighChol: 1,
    BMI: 35,
    Smoker: 0,
    PhysActivity: 0,
    Fruits: 0,
    Veggies: 1,
    DiffWalk: 1,
    GenHlth: 4,
    PhysHlth: 12,
    MentHlth: 7,
    Age: 9,
  },
  moderateRisk: {
    HighBP: 0,
    HighChol: 1,
    BMI: 29,
    Smoker: 0,
    PhysActivity: 1,
    Fruits: 1,
    Veggies: 1,
    DiffWalk: 0,
    GenHlth: 3,
    PhysHlth: 4,
    MentHlth: 2,
    Age: 7,
  },
};

const defaultMoa = {
  drug_name: "GLP-1 Demo",
  moa_summary: "Improves glucose control and supports weight loss through appetite regulation.",
  expected_biomarker_effect: "Lower fasting glucose, lower BMI, improved cardiometabolic burden.",
  gamma: 0.42,
  reasoning_brief: "Strong effect due to combined glycemic control and weight reduction.",
};

export default function App() {
  const [patient, setPatient] = useState(patientPresets.highRisk);
  const [moa, setMoa] = useState(defaultMoa);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const narrative = useMemo(() => {
    if (!result) {
      return "This preview shows the product shell before artifact-backed inference is connected.";
    }

    return `The patient starts at ${(result.baseline_score * 100).toFixed(1)}% estimated diabetes risk and moves to ${(result.trial_score * 100).toFixed(1)}% after applying gamma ${result.gamma.toFixed(2)}.`;
  }, [result]);

  async function handleBaselineScore() {
    setLoading(true);
    setError("");
    try {
      const response = await api.scorePatient(patient);
      setScore(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulation() {
    setLoading(true);
    setError("");
    try {
      const response = await api.simulateTrial(patient, moa);
      setResult(response);
      setScore({
        risk_score: response.baseline_score,
        mode: response.mode,
        feature_importances: response.feature_importances,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TrialForge</p>
          <h1>Diabetes intervention simulator</h1>
          <p className="hero-copy">
            A mock-first React shell for the notebook-driven gamma, MoA, and trial twin workflow.
          </p>
        </div>
        <div className="hero-badge">API mode: {API_MODE}</div>
      </header>

      <main className="layout">
        <SectionCard
          title="Upload / Choose Drug"
          subtitle="Capture the intervention story as structured MoA text plus a gamma impact score."
        >
          <DrugComposer
            moa={moa}
            onChange={(field, value) => setMoa((current) => ({ ...current, [field]: value }))}
            onLoadDemo={(nextMoA) => setMoa(nextMoA)}
          />
        </SectionCard>

        <SectionCard
          title="Patient Input"
          subtitle="Enter a BRFSS-style patient profile. These fields match the backend demo contract."
          actions={
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={handleBaselineScore} disabled={loading}>
                Score baseline
              </button>
              <button type="button" className="primary-button" onClick={handleSimulation} disabled={loading}>
                {loading ? "Running..." : "Simulate trial"}
              </button>
            </div>
          }
        >
          <PatientForm
            patient={patient}
            onChange={(field, value) => setPatient((current) => ({ ...current, [field]: value }))}
            onLoadPreset={(presetKey) => setPatient(patientPresets[presetKey])}
          />
          {score ? (
            <p className="baseline-score">
              Current baseline score: <strong>{(score.risk_score * 100).toFixed(1)}%</strong> ({score.mode} mode)
            </p>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
        </SectionCard>

        <SectionCard
          title="Simulation Result"
          subtitle={narrative}
        >
          <SimulationPanel result={result} />
        </SectionCard>
      </main>
    </div>
  );
}
