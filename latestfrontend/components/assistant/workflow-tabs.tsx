"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Footprints,
  Heart,
  MapPin,
  Pill,
  Smartphone,
  Sparkles,
  Watch,
  XCircle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TabKey = "calendar" | "steps" | "wearables" | "guidance"

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "steps", label: "Today's Steps", icon: Footprints },
  { key: "wearables", label: "Wearables", icon: Watch },
  { key: "guidance", label: "Do & Don't", icon: Sparkles },
]

const calendarEvents = [
  {
    time: "08:30",
    title: "Morning dose · GLP-1",
    location: "At home",
    type: "dose" as const,
    status: "upcoming",
  },
  {
    time: "11:00",
    title: "Lab draw · HbA1c",
    location: "Site 03 · Boston MGH · Rm 412",
    type: "visit" as const,
    status: "upcoming",
  },
  {
    time: "13:30",
    title: "Whobee check-in",
    location: "In-app video call",
    type: "checkin" as const,
    status: "upcoming",
  },
  {
    time: "18:00",
    title: "30 min walk · log in Apple Health",
    location: "Anywhere",
    type: "activity" as const,
    status: "upcoming",
  },
  {
    time: "21:00",
    title: "Evening dose · GLP-1",
    location: "At home",
    type: "dose" as const,
    status: "upcoming",
  },
]

const todaySteps = [
  { title: "Take morning dose with food", done: true },
  { title: "Log fasting glucose in app", done: true },
  { title: "Drink 2L of water", done: false },
  { title: "Complete Week-4 symptom survey", done: false },
  { title: "30 minute walk (Fitbit will auto-log)", done: false },
  { title: "Evening dose at 9:00 PM", done: false },
]

const wearables = [
  { name: "Apple Health", status: "Connected", metric: "7,842 steps", icon: Smartphone, good: true },
  { name: "Fitbit Charge 6", status: "Connected", metric: "HR avg 72 bpm", icon: Watch, good: true },
  { name: "Dexcom G7 CGM", status: "Connected", metric: "Glucose 118 mg/dL", icon: Heart, good: true },
  { name: "Oura Ring", status: "Pair pending", metric: "— awaiting handshake", icon: Zap, good: false },
]

const dos = [
  "Take doses with a glass of water",
  "Walk 20+ minutes after lunch",
  "Report any severe nausea in-app within 2h",
  "Keep a consistent sleep window",
]

const donts = [
  "Skip a scheduled dose without logging it",
  "Alcohol within 4 hours of your dose",
  "Strenuous workouts during week 1",
  "Grapefruit juice — interacts with the drug",
]

export function WorkflowTabs() {
  const [active, setActive] = useState<TabKey>("calendar")

  return (
    <section className="card-glass relative overflow-hidden rounded-3xl p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            / Journey orchestrator
          </p>
          <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-tight md:text-2xl">
            Your trial day
          </h2>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Syncing with Google Calendar
          </span>
        </div>
      </div>

      {/* Tab nav */}
      <div
        role="tablist"
        aria-label="Workflow tabs"
        className="mb-5 flex flex-wrap gap-1.5 rounded-2xl bg-muted/30 p-1.5"
      >
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = active === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              className={cn(
                "font-display inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium uppercase tracking-widest transition-colors md:flex-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Panels */}
      <div className="min-h-[340px]">
        {active === "calendar" ? (
          <div
            role="tabpanel"
            className="grid gap-4 md:grid-cols-[1fr_2fr]"
          >
            {/* Mini month placeholder */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-sm font-bold uppercase tracking-wider">
                  Apr · Week 4
                </p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Google
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-muted-foreground">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1
                  const isToday = day === 18
                  const hasEvent = [3, 7, 10, 14, 17, 18, 21, 24].includes(day)
                  return (
                    <span
                      key={day}
                      className={cn(
                        "relative flex aspect-square items-center justify-center rounded-md text-xs",
                        isToday
                          ? "bg-primary font-bold text-primary-foreground"
                          : "text-foreground/80 hover:bg-muted/60",
                      )}
                    >
                      {day}
                      {hasEvent && !isToday ? (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />
                      ) : null}
                    </span>
                  )
                })}
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-accent" />{" "}
                Event days this month
              </p>
            </div>

            {/* Timeline */}
            <div className="relative rounded-2xl border border-border/60 bg-card/40 p-4">
              <p className="font-display text-sm font-bold uppercase tracking-wider">
                Today · Thu, Apr 18
              </p>
              <ol className="relative mt-4 space-y-4 pl-5 before:absolute before:left-2 before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border/60">
                {calendarEvents.map((e) => {
                  const Icon =
                    e.type === "dose"
                      ? Pill
                      : e.type === "visit"
                        ? MapPin
                        : e.type === "checkin"
                          ? Sparkles
                          : Footprints
                  return (
                    <li key={e.time} className="relative">
                      <span className="absolute -left-5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-primary/60 bg-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                            {e.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {e.location}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-foreground/80">
                          <Clock className="mr-1 inline h-3 w-3 text-muted-foreground" />
                          {e.time}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        ) : null}

        {active === "steps" ? (
          <div role="tabpanel" className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="font-display text-sm font-bold uppercase tracking-wider">
              4 of 6 complete · keep going
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: "33%" }}
              />
            </div>
            <ul className="mt-6 space-y-2.5">
              {todaySteps.map((s, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    s.done
                      ? "border-[oklch(0.55_0.2_160/0.3)] bg-[oklch(0.35_0.08_160/0.15)]"
                      : "border-border/60 bg-muted/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 flex-none items-center justify-center rounded-full",
                      s.done ? "bg-[oklch(0.6_0.2_160)]" : "border border-border",
                    )}
                  >
                    {s.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-background" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      s.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {active === "wearables" ? (
          <div role="tabpanel" className="grid gap-3 md:grid-cols-2">
            {wearables.map((w) => {
              const Icon = w.icon
              return (
                <div
                  key={w.name}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border bg-card/40 p-4",
                    w.good ? "border-primary/30" : "border-accent/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 flex-none items-center justify-center rounded-xl",
                      w.good ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold uppercase tracking-wider">
                      {w.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {w.metric}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-widest",
                      w.good ? "text-primary" : "text-accent",
                    )}
                  >
                    {w.status}
                  </span>
                </div>
              )
            })}
            <p className="md:col-span-2 mt-2 text-xs text-muted-foreground">
              Placeholders only — connect your health data provider in settings to
              enable live pulls.
            </p>
          </div>
        ) : null}

        {active === "guidance" ? (
          <div role="tabpanel" className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[oklch(0.55_0.2_160/0.3)] bg-[oklch(0.35_0.08_160/0.15)] p-5">
              <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-[oklch(0.8_0.18_160)]">
                <CheckCircle2 className="h-4 w-4" /> Do
              </p>
              <ul className="mt-3 space-y-2">
                {dos.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[oklch(0.8_0.18_160)]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[oklch(0.64_0.24_25/0.3)] bg-[oklch(0.3_0.1_25/0.12)] p-5">
              <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-accent">
                <AlertTriangle className="h-4 w-4" /> Don't
              </p>
              <ul className="mt-3 space-y-2">
                {donts.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 flex-none text-accent" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
