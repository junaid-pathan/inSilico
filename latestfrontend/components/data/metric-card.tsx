import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  tone?: "good" | "warn" | "primary" | "neutral"
  hint?: string
}

const toneStyles: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  good: "from-[oklch(0.55_0.2_160/0.15)] to-transparent border-[oklch(0.6_0.2_160/0.3)]",
  warn: "from-[oklch(0.64_0.24_25/0.15)] to-transparent border-[oklch(0.64_0.24_25/0.35)]",
  primary: "from-[oklch(0.65_0.26_310/0.15)] to-transparent border-[oklch(0.65_0.26_310/0.35)]",
  neutral: "from-white/5 to-transparent border-white/10",
}

const toneText: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  good: "text-[oklch(0.82_0.16_160)]",
  warn: "text-[oklch(0.8_0.2_25)]",
  primary: "text-[oklch(0.78_0.2_310)]",
  neutral: "text-foreground",
}

export function MetricCard({
  label,
  value,
  delta,
  tone = "neutral",
  hint,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "card-glass relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5",
        toneStyles[tone],
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-3 text-3xl font-black tracking-tight md:text-4xl",
          toneText[tone],
          tone === "primary" && "text-glow",
        )}
      >
        {value}
      </p>
      {delta ? (
        <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
      ) : null}
      {hint ? (
        <p className="mt-3 text-xs text-muted-foreground/80">{hint}</p>
      ) : null}
    </div>
  )
}
