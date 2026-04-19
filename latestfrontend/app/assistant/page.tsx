import { Bell, LifeBuoy, ShieldPlus, UserRound } from "lucide-react"
import { SiteNav } from "@/components/site-nav"
import { LandingFooter } from "@/components/landing/footer"
import { PageHeader } from "@/components/data/page-header"
import { WorkflowTabs } from "@/components/assistant/workflow-tabs"
import { MiniBot } from "@/components/assistant/mini-bot"

const participant = {
  name: "Alex Morgan",
  arm: "GLP-1 · Arm B",
  site: "Site 03 · Boston MGH",
  week: "Week 4 of 24",
  adherence: 91,
}

export default function AssistantPage() {
  return (
    <main className="relative min-h-screen">
      <SiteNav />

      <PageHeader
        eyebrow="Assistant · 03"
        title="Workflow Companion"
        accent="accent"
        subtitle="Every trial day, in one place. Calendar, wearables, do's and don'ts, plus Whobee — a friendly 3D bot who answers any question you have along the way."
      />

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        {/* Participant badge */}
        <section className="card-glass mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <UserRound className="h-5 w-5" aria-hidden />
              </span>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-[oklch(0.7_0.2_160)]" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">{participant.name}</p>
              <p className="text-xs text-muted-foreground">
                {participant.arm} · {participant.site}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs">
              <ShieldPlus className="h-3.5 w-3.5 text-primary" />
              {participant.week}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.55_0.2_160/0.3)] bg-[oklch(0.35_0.08_160/0.15)] px-3 py-1.5 text-xs">
              <LifeBuoy className="h-3.5 w-3.5 text-[oklch(0.8_0.18_160)]" />
              Adherence {participant.adherence}%
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-3.5 w-3.5" />
              2 reminders
            </button>
          </div>
        </section>

        {/* Workflow tabs (calendar, steps, wearables, do/don't) */}
        <WorkflowTabs />

        {/* Mini bot */}
        <div className="mt-8">
          <MiniBot />
        </div>

        {/* Emergency / contact row */}
        <section className="card-glass-red mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              / Emergency line
            </p>
            <p className="font-display mt-1 text-lg font-bold uppercase tracking-tight">
              If this is a medical emergency, call 911.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Non-urgent concerns: page the on-call nurse at Site 03 — they&apos;ll answer 24/7.
            </p>
          </div>
          <button
            type="button"
            className="font-display rounded-full bg-accent px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/30 hover:bg-accent/90"
          >
            Page on-call
          </button>
        </section>
      </div>

      <LandingFooter />
    </main>
  )
}
