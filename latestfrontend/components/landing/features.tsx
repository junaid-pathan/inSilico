"use client"

import { FlaskConical, Users, ShieldCheck, Activity, Dna, Bot } from "lucide-react"
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline"

const timelineData = [
  {
    id: 1,
    title: "Cohort Simulator",
    date: "Module 01",
    content:
      "Generate synthetic patient cohorts with realistic demographics, comorbidities, and biomarkers to stress-test your protocol before recruitment.",
    category: "Simulation",
    icon: Users,
    relatedIds: [2, 6],
    status: "completed" as const,
    energy: 96,
  },
  {
    id: 2,
    title: "Drug Composer",
    date: "Module 02",
    content:
      "Compose multi-agent regimens, preview pharmacokinetics, and detect interaction risk across your entire drug library.",
    category: "Pharmacology",
    icon: FlaskConical,
    relatedIds: [1, 3],
    status: "in-progress" as const,
    energy: 82,
  },
  {
    id: 3,
    title: "Safety Sentinel",
    date: "Module 03",
    content:
      "Continuous adverse-event monitoring with dose-dependent risk scoring and automatic protocol deviation alerts.",
    category: "Safety",
    icon: ShieldCheck,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 70,
  },
  {
    id: 4,
    title: "Endpoint Engine",
    date: "Module 04",
    content:
      "Power calculations, Bayesian efficacy readouts, and real-time endpoint tracking with dropout-adjusted projections.",
    category: "Analytics",
    icon: Activity,
    relatedIds: [3, 5],
    status: "pending" as const,
    energy: 54,
  },
  {
    id: 5,
    title: "Genomic Stratifier",
    date: "Module 05",
    content:
      "Stratify patients by biomarker, HLA type, and variant signature to pinpoint responder sub-populations.",
    category: "Genomics",
    icon: Dna,
    relatedIds: [4, 6],
    status: "pending" as const,
    energy: 42,
  },
  {
    id: 6,
    title: "Workflow Assistant",
    date: "Module 06",
    content:
      "An AI companion that syncs calendars, wearables, and health apps — guiding every participant through their trial journey.",
    category: "Assistant",
    icon: Bot,
    relatedIds: [1, 5],
    status: "in-progress" as const,
    energy: 88,
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
