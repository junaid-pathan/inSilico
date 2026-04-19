import Link from "next/link"
import { Activity } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Activity className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="font-display text-sm font-bold tracking-widest">
              TRIALFORGE
            </span>
          </Link>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              {[
                { href: "/simulator", label: "Simulator" },
                { href: "/insights", label: "Insights" },
                { href: "/assistant", label: "Assistant" },
                { href: "#", label: "IRB Consent" },
                { href: "#", label: "Privacy" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            © {new Date().getFullYear()} TrialForge · Research use only
          </p>
        </div>
      </div>
    </footer>
  )
}
