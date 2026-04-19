"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypewriterTitleProps {
  text: string
  className?: string
}

/**
 * 3D layered title with typewriter reveal.
 * Monochrome base with a subtle purple/teal halo glow.
 */
export function TypewriterTitle({ text, className }: TypewriterTitleProps) {
  const [typed, setTyped] = useState("")

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i += 1
      setTyped(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, 85)
    return () => clearInterval(id)
  }, [text])

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Depth shadow layers (3D extrusion) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none font-display font-black uppercase tracking-tight text-[oklch(0.25_0.1_310)] translate-x-[3px] translate-y-[3px] blur-[1px]"
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none font-display font-black uppercase tracking-tight text-[oklch(0.35_0.15_310)] translate-x-[1.5px] translate-y-[1.5px]"
      >
        {text}
      </span>

      {/* Foreground typewriter */}
      <span
        className="relative block font-display font-black uppercase tracking-tight text-foreground"
        style={{
          textShadow:
            "0 0 24px oklch(0.65 0.26 310 / 0.45), 0 0 60px oklch(0.7 0.18 230 / 0.25)",
        }}
      >
        {typed}
        <span className="ml-1 inline-block h-[0.8em] w-[3px] translate-y-[0.05em] animate-pulse bg-[oklch(0.65_0.26_310)]" />
      </span>
    </div>
  )
}
