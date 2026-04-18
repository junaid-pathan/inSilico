import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "./api";
import DrugComposer from "./components/DrugComposer";
import HelpCenter from "./components/HelpCenter";
import HomePage from "./components/HomePage";
import PatientForm from "./components/PatientForm";
import SectionCard from "./components/SectionCard";
import SimulationPanel from "./components/SimulationPanel";

/* ── presets & defaults ─────────────────────────────── */

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

/* ── simple hash router ─────────────────────────────── */

const PAGES = {
  home: "home",
  upload: "upload",
  patient: "patient",
  help: "help",
};

function useHashRoute(defaultRoute) {
  const read = () => window.location.hash.replace("#", "") || defaultRoute;
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onHash = () => setRoute(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((page) => {
    window.location.hash = page;
  }, []);

  return [route, navigate];
}

/* ── scroll-aware navbar ────────────────────────────── */

function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const threshold = 12;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) {
        setHidden(false);
      } else if (y - lastY.current > threshold) {
        setHidden(true);
      } else if (lastY.current - y > threshold) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

/* ── app ────────────────────────────────────────────── */

export default function App() {
  const [page, navigate] = useHashRoute(PAGES.home);
  const navHidden = useScrollDirection();

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

    return `The patient starts at ${(result.baseline_score * 100).toFixed(1)}% estimated disease risk and moves to ${(result.trial_score * 100).toFixed(1)}% after applying gamma ${result.gamma.toFixed(2)}.`;
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
      {/* ── hero header ── */}
      <header className="hero">
        <div>
          <p className="eyebrow">TrialForge</p>
          <h1>Clinical intervention simulator</h1>
          <p className="hero-copy">
            AI-powered digital twin platform for clinical trial simulation and patient outcome prediction.
          </p>
        </div>
      </header>

      {/* ── navigation menu ── */}
      <nav className={`nav-bar${navHidden ? " nav-bar--hidden" : ""}`} id="main-nav">
        <button
          type="button"
          id="nav-home"
          className={`nav-link${page === PAGES.home ? " nav-link--active" : ""}`}
          onClick={() => navigate(PAGES.home)}
        >
          <span className="nav-icon">🏠</span>
          Home
        </button>
        <button
          type="button"
          id="nav-upload"
          className={`nav-link${page === PAGES.upload ? " nav-link--active" : ""}`}
          onClick={() => navigate(PAGES.upload)}
        >
          <span className="nav-icon">📄</span>
          Upload Medical Data
        </button>
        <button
          type="button"
          id="nav-patient"
          className={`nav-link${page === PAGES.patient ? " nav-link--active" : ""}`}
          onClick={() => navigate(PAGES.patient)}
        >
          <span className="nav-icon">🩺</span>
          Patient Input
        </button>
        <button
          type="button"
          id="nav-help"
          className={`nav-link${page === PAGES.help ? " nav-link--active" : ""}`}
          onClick={() => navigate(PAGES.help)}
        >
          <span className="nav-icon">❓</span>
          Help Center
        </button>
      </nav>

      {/* ── page content ── */}
      <main className="layout">
        {page === PAGES.home && (
          <HomePage onNavigate={navigate} />
        )}

        {page === PAGES.upload && (
          <>
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
              title="Simulation Result"
              subtitle={narrative}
            >
              <SimulationPanel result={result} />
            </SectionCard>
          </>
        )}

        {page === PAGES.patient && (
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
        )}

        {page === PAGES.help && (
          <HelpCenter />
        )}
      </main>
    </div>
  );
}
