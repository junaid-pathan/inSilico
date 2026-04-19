"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GooeyText } from "@/components/ui/gooey-text-morphing"

export function LandingHero() {
  return (
    <section
      id="home"
      className="relative isolate flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden pt-24"
    >
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10 grid-lines opacity-60" />

      {/* Ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 left-1/2 -z-10 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[oklch(0.4_0.24_25)]/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[420px] w-[420px] rounded-full bg-[oklch(0.45_0.20_35)]/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-10 -z-10 h-[360px] w-[360px] rounded-full bg-[oklch(0.45_0.15_45)]/10 blur-[120px]"
      />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-20 text-center">

        <h1 className="font-display text-6xl font-bold leading-none tracking-tight md:text-8xl lg:text-[9rem]">
          TRIALFORGE
        </h1>

        <div className="flex h-[72px] items-center justify-center md:h-[104px]">
          <GooeyText
            texts={["Simulate.", "Optimize.", "Predict.", "Decide."]}
            morphTime={1}
            cooldownTime={0.8}
            className="font-display font-bold"
            textClassName="text-4xl md:text-6xl text-foreground"
          />
        </div>

        <p className="max-w-2xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
          Forge safer, faster clinical trials. TrialForge simulates digital trial twins, composes drug
          combinations, and walks every participant through their journey with a friendly AI companion.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="group bg-white text-black hover:bg-white/90">
            <Link href="/simulator">
              Launch Simulator
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <dl className="mt-8 grid w-full max-w-2xl grid-cols-3 gap-3">
          {[
            { k: "12.4K", v: "Twin simulations" },
            { k: "98.2%", v: "Consent clarity" },
            { k: "4.6x", v: "Faster protocols" },
          ].map((item) => (
            <div key={item.v} className="card-glass rounded-2xl p-4 text-center">
              <dt className="font-display text-lg font-bold text-foreground md:text-2xl">{item.k}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{item.v}</dd>
            </div>
          ))}
        </dl>

        {/* scroll hint */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Scroll</span>
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-muted-foreground/40 pt-1.5">
            <span className="h-1.5 w-0.5 animate-scroll-hint rounded-full bg-[oklch(0.64_0.24_25)]" />
          </div>
        </div>
      </div>
    </section>
  )
}
