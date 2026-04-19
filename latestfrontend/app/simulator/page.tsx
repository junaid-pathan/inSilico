"use client";

import { useSimulator } from "@/context/simulator-context"
import { ArrowDown, FlaskConical, Zap, Loader } from "lucide-react"
import { SiteNav } from "@/components/site-nav"
import { LandingFooter } from "@/components/landing/footer"
import { PageHeader } from "@/components/data/page-header"
import { MetricCard } from "@/components/data/metric-card"
import FileUpload from "@/components/ui/file-upload"
import {
  PatientProfileWizard,
  patientPresets,
  type PatientProfile,
} from "@/components/simulator/patient-profile-form"
import {
  BaselineVsTwinChart,
  BiomarkerRadarChart,
  CohortPieChart,
  FeatureImportanceChart,
  LocalShapChart,
} from "@/components/data/trial-charts"
import { scorePatient, simulateTrial } from "@/lib/api"

const cohortColors: Record<string, string> = {
  Responders: "var(--chart-1)",
  Partial: "var(--chart-5)",
  "No effect": "var(--chart-3)",
  Adverse: "var(--chart-2)",
}

export default function SimulatorPage() {
  const {
    patient,
    isUploaded,
    setIsUploaded,
    isLoading,
    setIsLoading,
    simulationData,
    setSimulationData,
    moaData,
    setMoaData,
    baselineScore,
    setBaselineScore,
    requestError,
    setRequestError,
    isReadyForUpload,
    setIsReadyForUpload,
    updatePatientField,
    loadPatientPreset,
  } = useSimulator();

  const handleBaselineScore = async () => {
    setIsLoading(true)
    setRequestError("")
    try {
      const response = await scorePatient(patient)
      setBaselineScore(response)
    } catch (err: any) {
      setRequestError(err.message || "Failed to score baseline patient")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadComplete = async (moa: any) => {
    setIsLoading(true);
    setRequestError("");
    try {
      if (moa) {
        setMoaData(moa);
        const result = await simulateTrial(patient, moa);
        setSimulationData(result);
        setBaselineScore({
          risk_score: result.baseline_score,
          mode: result.mode,
        });
        setIsUploaded(true);
      }
    } catch (err: any) {
      console.error(err);
      setRequestError(err.message || "Failed to run simulation");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isUploaded || !simulationData) {
    return (
      <main className="relative min-h-screen">
        <SiteNav />
        <div className="mx-auto max-w-5xl px-4 py-24 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-widest text-glow">
              Guided simulation intake
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Answer the BRFSS-style patient questions one by one. After the review step, upload the
              mechanism-of-action document to run the simulation on the profile you entered.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-8">
            <section className="card-glass rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                  / Patient input
                </p>
                <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight">
                  Baseline profile
                </h2>
              </div>
              <PatientProfileWizard
                patient={patient}
                onChange={updatePatientField}
                onLoadPreset={loadPatientPreset}
                onScoreBaseline={handleBaselineScore}
                baselineScore={baselineScore}
                isLoading={isLoading}
                error={requestError}
                onReviewStepChange={setIsReadyForUpload}
              />
            </section>

            {isReadyForUpload ? (
              <section className="card-glass rounded-3xl p-6 md:p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                  / Mechanism upload
                </p>
                <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight">
                  Upload MoA document
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Final step. Once the PDF is parsed, TrialForge will run the intervention simulation
                  on the patient profile you just reviewed.
                </p>

                <div className="mt-6">
                  {isLoading ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-primary">
                      <Loader className="h-12 w-12 animate-spin" />
                      <p className="text-center text-xl font-display uppercase tracking-widest text-glow">
                        Running simulation...
                      </p>
                    </div>
                  ) : (
                    <FileUpload onUploadComplete={handleUploadComplete} />
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>
        <LandingFooter />
      </main>
    );
  }

  // Map backend feature importances to chart format
  const featureImportance = Object.entries(simulationData.feature_importances || {}).map(
    ([feature, value]) => ({ feature, value })
  ).sort((a: any, b: any) => b.value - a.value);
  const localShapDelta = simulationData.local_shap?.delta || [];

  // Map feature deltas
  const featureDeltas = simulationData.feature_deltas || [];
  const biomarkerRadar = simulationData.biomarker_radar || [];
  const cohortBreakdown = (simulationData.cohort_breakdown || []).map((entry: any) => ({
    ...entry,
    color: cohortColors[entry.name] || "var(--chart-3)",
  }));
  const cohortSize = simulationData.cohort_size || cohortBreakdown.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0);
  const confidenceScore = Number.isFinite(simulationData.confidence_score) ? simulationData.confidence_score : null;

  // Generate baseline vs twin interpolation
  const baseline_score = simulationData.baseline_score * 100;
  const trial_score = simulationData.trial_score * 100;
  const improvementPoints = baseline_score - trial_score;
  const baselineVsTwin = [
    { label: "Wk 0", baseline: baseline_score, twin: baseline_score },
    { label: "Wk 4", baseline: baseline_score, twin: baseline_score - (improvementPoints * 0.2) },
    { label: "Wk 8", baseline: baseline_score, twin: baseline_score - (improvementPoints * 0.45) },
    { label: "Wk 12", baseline: baseline_score, twin: baseline_score - (improvementPoints * 0.7) },
    { label: "Wk 24", baseline: baseline_score, twin: trial_score },
  ];

  const keyMetrics = [
    { label: "Baseline risk", value: `${baseline_score.toFixed(1)}%`, tone: "warn" as const, delta: "baseline" },
    { label: "Trial twin risk", value: `${trial_score.toFixed(1)}%`, tone: "good" as const, delta: `−${(baseline_score - trial_score).toFixed(1)} pts` },
    { label: "Predicted Δ", value: `+${(baseline_score - trial_score).toFixed(1)}`, tone: "good" as const, delta: "pts improvement" },
    { label: "Gamma", value: simulationData.gamma?.toFixed(2) || "0.42", tone: "primary" as const, delta: moaData?.drug_name || "GLP-1 demo" },
    { label: "Cohort N", value: `${cohortSize}`, tone: "neutral" as const, delta: "simulated twins" },
    { label: "Confidence", value: confidenceScore !== null ? `${confidenceScore.toFixed(1)}%` : "n/a", tone: "primary" as const, delta: "cohort-derived" },
  ];

  return (
    <main className="relative min-h-screen">
      <SiteNav />

      <>
        <PageHeader
          eyebrow="Simulator · 01"
          title="Trial Twin"
          subtitle="A gamma-adjusted digital twin of your BRFSS-style cohort, compared head-to-head against the baseline. Scroll for the full outcome story."
        >
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs text-foreground">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              {moaData?.drug_name || "GLP-1 Demo"} · γ {simulationData.gamma?.toFixed(2) || "0.42"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs text-foreground">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Live compute
            </span>
          </div>
        </PageHeader>

        <div className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
          {/* Metrics grid */}
          <section aria-labelledby="metrics-heading" className="mb-16">
            <h2 id="metrics-heading" className="sr-only">
              Key metrics
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {keyMetrics.map((m) => (
                <MetricCard
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  delta={m.delta}
                  tone={m.tone}
                />
              ))}
            </div>
          </section>

          {/* Risk trajectory */}
          <section className="card-glass relative mb-10 overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                  / Trajectory
                </p>
                <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight md:text-3xl">
                  Baseline vs. Trial twin · 24 wk
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Interpolated risk score (%) from the simulated start/end states
              </p>
            </div>
            <BaselineVsTwinChart data={baselineVsTwin} />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Feature importance */}
            <section className="card-glass col-span-1 rounded-3xl p-6 lg:col-span-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                / Explainability
              </p>
              <h2 className="font-display mt-2 text-xl font-bold uppercase tracking-tight md:text-2xl">
                Local SHAP shifts
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Patient-specific SHAP contributions showing which features move predicted risk up or down.
              </p>
              <div className="mt-6">
                {localShapDelta.length > 0 ? (
                  <LocalShapChart data={localShapDelta} />
                ) : (
                  <FeatureImportanceChart data={featureImportance} />
                )}
              </div>
            </section>

            {/* Cohort pie */}
            <section className="card-glass col-span-1 rounded-3xl p-6 lg:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                / Cohort
              </p>
              <h2 className="font-display mt-2 text-xl font-bold uppercase tracking-tight md:text-2xl">
                Response breakdown
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                N = {cohortSize} simulated twins
              </p>
              <div className="mt-4">
                <CohortPieChart data={cohortBreakdown} />
              </div>
            </section>
          </div>

          {/* Radar + Feature deltas */}
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="card-glass col-span-1 rounded-3xl p-6 lg:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                / Feature profile
              </p>
              <h2 className="font-display mt-2 text-xl font-bold uppercase tracking-tight md:text-2xl">
                Model read-out
              </h2>
              <div className="mt-4">
                <BiomarkerRadarChart data={biomarkerRadar} />
              </div>
            </section>

            <section className="card-glass col-span-1 rounded-3xl p-6 lg:col-span-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                    / Feature deltas
                  </p>
                  <h2 className="font-display mt-2 text-xl font-bold uppercase tracking-tight md:text-2xl">
                    Changed inputs
                  </h2>
                </div>
                <ArrowDown className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 border-b border-border/60 bg-muted/30 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Feature</span>
                  <span>Baseline</span>
                  <span>Twin</span>
                  <span className="text-right">Δ</span>
                </div>
                <ul>
                  {featureDeltas.map((d: any) => {
                    const good = d.feature === "PhysActivity" ? d.delta > 0 : d.delta < 0
                    return (
                      <li
                        key={d.feature}
                        className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 border-b border-border/40 px-4 py-3 text-sm last:border-0"
                      >
                        <span className="font-medium text-foreground">
                          {d.feature}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {d.baseline.toFixed(2)}
                        </span>
                        <span className="font-mono text-xs text-foreground">
                          {d.trial_twin.toFixed(2)}
                        </span>
                        <span
                          className={`text-right font-mono text-xs font-bold ${
                            good ? "text-[oklch(0.8_0.18_160)]" : "text-accent"
                          }`}
                        >
                          {d.delta > 0 ? "+" : ""}
                          {d.delta.toFixed(2)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          </div>

          {/* Narrative panel */}
          <section className="card-glass relative mt-10 overflow-hidden rounded-3xl p-8 md:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
              / Narrative summary
            </p>
            <p className="font-display mt-4 text-2xl font-bold uppercase leading-tight tracking-tight md:text-3xl">
              The twin starts at{" "}
              <span className="text-accent text-glow">{baseline_score.toFixed(1)}%</span> risk and
              moves to{" "}
              <span className="text-primary text-glow">{trial_score.toFixed(1)}%</span> after applying
              gamma {simulationData.gamma?.toFixed(2) || "0.42"} — a predicted improvement of {(baseline_score - trial_score).toFixed(1)} points.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {simulationData.explanation_summary || "Gains are driven by significant changes in key physiological parameters based on the mechanism of action."}
            </p>
          </section>

          {/* New Simulation Upload */}
          <section className="card-glass relative mt-10 overflow-hidden rounded-3xl p-8 md:p-10 mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
              / Next Steps
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight md:text-3xl">
              Run another simulation
            </h2>
            <p className="mt-2 text-sm text-muted-foreground mb-6">
              Upload a new clinical trial mechanism-of-action PDF to automatically generate a new digital twin.
            </p>
            {isLoading ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-primary">
                <Loader className="h-12 w-12 animate-spin" />
                <p className="text-center text-xl font-display uppercase tracking-widest text-glow">
                  Running simulation...
                </p>
              </div>
            ) : (
              <FileUpload onUploadComplete={handleUploadComplete} />
            )}
          </section>
        </div>
      </>

      <LandingFooter />
    </main>
  )
}
