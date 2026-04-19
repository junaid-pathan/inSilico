"use client"

import { FlaskConical, Search, Activity, Sparkles, Users, BarChart3 } from "lucide-react"
import { ContainerScroll } from "@/components/ui/container-scroll-animation"

const modules = [
  {
    id: 1,
    icon: FlaskConical,
    label: "Module 01",
    title: "Drug Composer",
    description:
      "Upload any trial PDF. Gemini extracts drug name, mechanism of action, and expected biomarker effects into a structured record the simulator can run on.",
    accent: "oklch(0.64 0.24 25)",
    badge: "Extraction",
  },
  {
    id: 2,
    icon: Search,
    label: "Module 02",
    title: "RAG Retriever",
    description:
      "ChromaDB-backed retrieval over chunked trial documents. Surfaces the exact paragraphs the extractor needs for HbA1c, weight, BP, and RRR queries.",
    accent: "oklch(0.68 0.20 40)",
    badge: "Retrieval",
  },
  {
    id: 3,
    icon: Activity,
    label: "Module 03",
    title: "Gamma Compiler",
    description:
      "Pulls measurable endpoints from retrieved chunks and feeds them into a calibrated γ formula — gamma computed from published outcomes, not guessed.",
    accent: "oklch(0.62 0.22 15)",
    badge: "Analytics",
  },
  {
    id: 4,
    icon: Sparkles,
    label: "Module 04",
    title: "Trial Twin Forge",
    description:
      "TVAE-generated synthetic patients with realistic correlations. Applies a γ-scaled recovery shift to manufacture counterfactual trial twins for every profile.",
    accent: "oklch(0.66 0.24 30)",
    badge: "Simulation",
  },
  {
    id: 5,
    icon: Users,
    label: "Module 05",
    title: "Cohort Simulator",
    description:
      "Runs 720 simulated twins through the intervention. Buckets each patient as Responder, Partial, No-effect, or Adverse to visualise expected response distribution.",
    accent: "oklch(0.60 0.20 20)",
    badge: "Cohort",
  },
  {
    id: 6,
    icon: BarChart3,
    label: "Module 06",
    title: "Risk Explainer",
    description:
      "RandomForest risk model with SHAP-based explainability. Surfaces which BRFSS features drive the baseline-to-twin risk shift for each patient.",
    accent: "oklch(0.58 0.22 12)",
    badge: "Explainability",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="relative overflow-hidden">
      {/* Header sits above the scroll container */}
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-0 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          / The Platform
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          Six modules.{" "}
          <span className="shimmer-text">One orbit.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Every TrialForge module orbits the same core — from raw PDF to
          cohort-level simulation in seconds.
        </p>
      </div>

      <div className="-mt-40 md:-mt-56 -mb-48 md:-mb-64">
      <ContainerScroll titleComponent={<></>}>
        {/* Tablet content — scrollable grid of module cards */}
        <div className="h-full w-full flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 place-items-center w-full max-w-full">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <div
                  key={mod.id}
                  className="group relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
                >
                  {/* Glow blob */}
                  <div
                    className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
                    style={{ background: mod.accent }}
                  />

                  {/* Icon + badge row */}
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        background: `color-mix(in oklch, ${mod.accent} 20%, transparent)`,
                        border: `1px solid color-mix(in oklch, ${mod.accent} 35%, transparent)`,
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: mod.accent }}
                      />
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                      style={{
                        color: mod.accent,
                        background: `color-mix(in oklch, ${mod.accent} 15%, transparent)`,
                        border: `1px solid color-mix(in oklch, ${mod.accent} 30%, transparent)`,
                      }}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  {/* Text */}
                  <div>
                    <p
                      className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                      style={{ color: mod.accent }}
                    >
                      {mod.label}
                    </p>
                    <h3 className="font-display text-sm font-bold text-white/90 md:text-base">
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
                      {mod.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ContainerScroll>
      </div>
    </section>
  )
}
