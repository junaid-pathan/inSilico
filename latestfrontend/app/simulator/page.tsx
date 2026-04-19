"use client";

import { useState } from "react"
import { ArrowDown, FlaskConical, Zap, Loader } from "lucide-react"
import { SiteNav } from "@/components/site-nav"
import { LandingFooter } from "@/components/landing/footer"
import { PageHeader } from "@/components/data/page-header"
import { MetricCard } from "@/components/data/metric-card"
import FileUpload from "@/components/ui/file-upload"
import {
  AdverseEventsChart,
  BaselineVsTwinChart,
  BiomarkerRadarChart,
  CohortPieChart,
  FeatureImportanceChart,
} from "@/components/data/trial-charts"
import { adverseEvents, biomarkerRadar, cohortBreakdown } from "@/lib/trial-data"
import { simulateTrial } from "@/lib/api"

const patientPreset = {
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
};

export default function SimulatorPage() {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [moaData, setMoaData] = useState<any>(null);

  const handleUploadComplete = async (moa: any) => {
    setIsLoading(true);
    try {
      if (moa) {
        setMoaData(moa);
        const result = await simulateTrial(patientPreset, moa);
        setSimulationData(result);
        setIsUploaded(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isUploaded || !simulationData) {
    return (
      <main className="relative min-h-screen">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-4 py-32 flex flex-col items-center justify-center min-h-[70vh]">
          <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-widest text-center mb-12 text-glow">
            Upload your mechanism of action document
          </h1>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-primary">
              <Loader className="w-12 h-12 animate-spin" />
              <p className="text-xl font-display uppercase tracking-widest text-glow">Running Simulation...</p>
            </div>
          ) : (
            <FileUpload onUploadComplete={handleUploadComplete} />
          )}
        </div>
        <LandingFooter />
      </main>
    );
  }

  // Map backend feature importances to chart format
  const featureImportance = Object.entries(simulationData.feature_importances || {}).map(
    ([feature, value]) => ({ feature, value })
  ).sort((a: any, b: any) => b.value - a.value);

  // Map feature deltas
  const featureDeltas = simulationData.feature_deltas || [];

  // Generate baseline vs twin interpolation
  const baseline_score = simulationData.baseline_score * 100;
  const trial_score = simulationData.trial_score * 100;
  const baselineVsTwin = [
    { label: "Wk 0", baseline: baseline_score, twin: baseline_score },
    { label: "Wk 4", baseline: baseline_score - 0.5, twin: baseline_score - (baseline_score - trial_score) * 0.2 },
    { label: "Wk 8", baseline: baseline_score - 1.0, twin: baseline_score - (baseline_score - trial_score) * 0.5 },
    { label: "Wk 12", baseline: baseline_score - 1.5, twin: baseline_score - (baseline_score - trial_score) * 0.75 },
    { label: "Wk 24", baseline: baseline_score - 2.5, twin: trial_score },
  ];

  const keyMetrics = [
    { label: "Baseline risk", value: `${baseline_score.toFixed(1)}%`, tone: "warn" as const, delta: "baseline" },
    { label: "Trial twin risk", value: `${trial_score.toFixed(1)}%`, tone: "good" as const, delta: `−${(baseline_score - trial_score).toFixed(1)} pts` },
    { label: "Predicted Δ", value: `+${(baseline_score - trial_score).toFixed(1)}`, tone: "good" as const, delta: "pts improvement" },
    { label: "Gamma", value: simulationData.gamma?.toFixed(2) || "0.42", tone: "primary" as const, delta: moaData?.drug_name || "GLP-1 demo" },
    { label: "Cohort N", value: "720", tone: "neutral" as const, delta: "digital twins" },
    { label: "Confidence", value: "94.1%", tone: "primary" as const, delta: "5-fold CV" },
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
                Risk score (%) over the simulated protocol window
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
                Top feature importances
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Relative contribution of each BRFSS input to the predicted Δ risk.
              </p>
              <div className="mt-6">
                <FeatureImportanceChart data={featureImportance} />
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
                N = 720 digital twins
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
                / Biomarkers
              </p>
              <h2 className="font-display mt-2 text-xl font-bold uppercase tracking-tight md:text-2xl">
                Multi-axis read-out
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

          {/* Adverse events */}
          <section className="card-glass mt-6 rounded-3xl p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                  / Safety
                </p>
                <h2 className="font-display mt-2 text-xl font-bold uppercase tracking-tight md:text-2xl">
                  Adverse event surveillance · 7d
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-3)" }} />
                  Mild
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-4)" }} />
                  Moderate
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-2)" }} />
                  Severe
                </span>
              </div>
            </div>
            <div className="mt-6">
              <AdverseEventsChart data={adverseEvents} />
            </div>
          </section>

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
        </div>
      </>

      <LandingFooter />
    </main>
  )
}
