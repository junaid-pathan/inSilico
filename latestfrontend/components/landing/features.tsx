"use client"

import { FlaskConical, Users, Search, Activity, Sparkles, BarChart3 } from "lucide-react"
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline"

const timelineData = [
  {
    id: 1,
    title: "Drug Composer",
    date: "Module 01",
    content:
      "Upload any trial PDF. Gemini extracts drug name, mechanism of action, and expected biomarker effects into a structured record the simulator can run on.",
    category: "Extraction",
    icon: FlaskConical,
    relatedIds: [2, 3],
    status: "completed" as const,
    energy: 94,
  },
  {
    id: 2,
    title: "RAG Retriever",
    date: "Module 02",
    content:
      "ChromaDB-backed retrieval over chunked trial documents. Targeted queries for HbA1c, weight, BP, and RRR surface the exact paragraphs the extractor needs.",
    category: "Retrieval",
    icon: Search,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Gamma Compiler",
    date: "Module 03",
    content:
      "Pulls measurable endpoints from retrieved chunks and feeds them into a calibrated γ formula — so gamma is computed from published outcomes, not guessed.",
    category: "Analytics",
    icon: Activity,
    relatedIds: [2, 4],
    status: "completed" as const,
    energy: 86,
  },
  {
    id: 4,
    title: "Trial Twin Forge",
    date: "Module 04",
    content:
      "TVAE-generated synthetic patients with realistic correlations. Applies a γ-scaled recovery shift to manufacture counterfactual trial twins for every profile.",
    category: "Simulation",
    icon: Sparkles,
    relatedIds: [3, 5],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 5,
    title: "Cohort Simulator",
    date: "Module 05",
    content:
      "Runs 720 simulated twins through the intervention. Buckets each patient as Responder, Partial, No-effect, or Adverse to visualize expected response distribution.",
    category: "Cohort",
    icon: Users,
    relatedIds: [4, 6],
    status: "completed" as const,
    energy: 88,
  },
  {
    id: 6,
    title: "Risk Explainer",
    date: "Module 06",
    content:
      "RandomForest risk model with SHAP-based explainability. Surfaces which BRFSS features drive the baseline-to-twin risk shift for each patient.",
    category: "Explainability",
    icon: BarChart3,
    relatedIds: [5, 1],
    status: "completed" as const,
    energy: 84,
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto mb-12 max-w-6xl px-6 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          / The Platform
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          Six modules. <span className="shimmer-text">One orbit.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Every TrialForge module orbits the same core. Click a node to explore its signal, status, and connections.
        </p>
      </div>

      <RadialOrbitalTimeline timelineData={timelineData} centerLabel="TRIALFORGE" />
    </section>
  )
}
