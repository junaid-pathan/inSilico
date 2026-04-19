import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  accent?: "primary" | "accent"
  children?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  accent = "primary",
  children,
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden pb-8 pt-32 md:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-lines opacity-40"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-20 left-1/2 -z-10 h-72 w-[80%] -translate-x-1/2 rounded-full blur-[120px]",
          accent === "primary"
            ? "bg-[oklch(0.65_0.26_310)]/25"
            : "bg-[oklch(0.7_0.18_230)]/20",
        )}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.3em]",
            accent === "primary"
              ? "text-[oklch(0.78_0.2_310)]"
              : "text-[oklch(0.78_0.15_200)]",
          )}
        >
          / {eyebrow}
        </p>
        <h1
          className={cn(
            "font-display mt-3 text-balance text-4xl font-black uppercase leading-[0.9] tracking-tight text-foreground md:text-6xl lg:text-7xl",
            "text-glow",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-pretty text-muted-foreground md:text-lg">
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </header>
  )
}
