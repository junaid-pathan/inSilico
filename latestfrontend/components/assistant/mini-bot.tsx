"use client"

import { useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { SplineScene } from "@/components/spline-scene"
import { Button } from "@/components/ui/button"

const ROBOT_SCENE_URL =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode"

interface Message {
  role: "bot" | "user"
  text: string
}

const seedMessages: Message[] = [
  {
    role: "bot",
    text: "Hi, I'm Whobee — your InSilico companion. I'll walk you through your day, explain anything you don't understand, and nudge you if you miss a step.",
  },
  {
    role: "bot",
    text: "You have a lab draw at 11:00 AM at Site 03 · Rm 412. Want me to drop a transit pin in your phone?",
  },
]

const suggestions = [
  "What do I do if I miss my morning dose?",
  "Explain my HbA1c number in plain English",
  "What side effects should I watch for this week?",
  "When is my next in-person visit?",
]

export function MiniBot() {
  const [messages, setMessages] = useState<Message[]>(seedMessages)
  const [input, setInput] = useState("")

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((m) => [...m, { role: "user", text: trimmed }])
    setInput("")

    // Mock Whobee response
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "Great question. In a wired build this routes to the InSilico backend using the MoA + patient context. For now I'm a placeholder that logs your question and shows you where answers will land.",
        },
      ])
    }, 700)
  }

  return (
    <section
      id="whobee"
      className="card-glass relative grid gap-4 overflow-hidden rounded-3xl p-4 md:grid-cols-[260px_1fr] md:p-6"
    >
      {/* 3D bot */}
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_40%,oklch(0.65_0.26_310/0.35),oklch(0.14_0.05_295)_70%)] md:h-full">
        <div className="absolute inset-0">
          <SplineScene
            scene={ROBOT_SCENE_URL}
            className="!h-full !w-full"
          />
        </div>
        {/* watermark mask */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-10 w-40"
          style={{
            background:
              "linear-gradient(to top left, oklch(0.14 0.05 295) 40%, transparent)",
          }}
        />
        <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/70 px-2.5 py-1 backdrop-blur">
          <Sparkles className="h-3 w-3 text-primary" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground">
            Whobee · online
          </span>
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-col">
        <div className="mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            / Workflow assistant
          </p>
          <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-tight md:text-2xl">
            Ask anything about your trial
          </h2>
        </div>

        <div className="scroll-neon flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-card/30 p-4 md:max-h-[320px]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-foreground"
                    : "max-w-[80%] rounded-2xl rounded-bl-md bg-primary/15 px-4 py-2.5 text-sm text-foreground"
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/20"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="mt-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/40 p-1.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Whobee about your trial…"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Message Whobee"
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Placeholder responses — wire to /api/whobee in your backend.
        </p>
      </div>
    </section>
  )
}
