"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Home" },
  { href: "/simulator", label: "Simulator" },
  { href: "/assistant", label: "Assistant" },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pt-4 md:pt-6">
        <nav
          className="card-glass flex items-center justify-between rounded-full border px-4 py-2.5 md:px-6"
          aria-label="Primary"
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="relative inline-flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/60" />
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/40">
                <Activity className="h-4 w-4" aria-hidden />
              </span>
            </span>
            <span className="font-display text-sm font-bold tracking-widest text-foreground">
              TRIALFORGE
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "font-display rounded-full px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors",
                      active
                        ? "bg-primary/20 text-primary-foreground text-glow"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="hidden md:flex">
            <Button
              asChild
              size="sm"
              className="font-display rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 hover:bg-accent/90"
            >
              <Link href="/assistant">Enroll</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-foreground"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open ? (
          <div className="card-glass mt-2 rounded-2xl p-3 md:hidden">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "font-display block rounded-xl px-4 py-3 text-xs uppercase tracking-widest",
                      pathname === link.href
                        ? "bg-primary/20 text-foreground text-glow"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  )
}
