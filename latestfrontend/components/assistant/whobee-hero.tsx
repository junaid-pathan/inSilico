"use client"

import { useState, useEffect } from "react"
import { Sparkles, Send } from "lucide-react"
import { SplineScene } from "@/components/spline-scene"
import { Spotlight } from "@/components/ui/spotlight"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

// The humanoid robot scene from the reference demo
const ROBOT_SCENE_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"

const suggestions = [
  "What do I do if I miss my dose?",
  "Explain my HbA1c number",
  "What side effects should I watch for?",
  "When is my next visit?",
]

interface Message {
  role: "bot" | "user"
  text: string
}

export function WhobeeHero() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [dots, setDots] = useState(".")

  // Animate chat bubble in after a short delay
  useEffect(() => {
    const t = setTimeout(() => setChatOpen(true), 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isTyping) return
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 400)
    return () => clearInterval(iv)
  }, [isTyping])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    
    // Add user message to UI
    setMessages((m) => [...m, { role: "user", text: trimmed }])
    setInput("")
    setIsTyping(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/whobee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, session_id: "trialforge-user" }),
      })

      const data = await response.json()
      setIsTyping(false)

      if (data.error) {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Sorry, I had trouble connecting to my brain. " + (data.detail || "") },
        ])
      } else {
        // OpenClaw typically returns the response in data.text or data.message.text
        const botResponse = data.text || data.response || data.message || "I processed your request but didn't get a text response.";
        setMessages((m) => [...m, { role: "bot", text: botResponse }])
      }
    } catch (err) {
      setIsTyping(false)
      setMessages((m) => [
        ...m,
        { role: "bot", text: "I'm offline right now. Please check if the backend is running." },
      ])
    }
  }


  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{
        background: "rgba(0,0,0,0.82)",
        minHeight: 520,
      }}
    >
      {/* Spotlight sweep */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="relative z-10 flex h-full min-h-[520px] flex-col md:flex-row">
        {/* ── LEFT: Text + Chat bubble ── */}
        <div className="flex flex-1 flex-col justify-center gap-8 p-8 md:p-12 lg:p-16">
          {/* Headline */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
              / Workflow assistant
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              How can I help<br />you today?
            </h1>
            <p className="mt-4 max-w-sm text-base text-white/50 leading-relaxed">
              Whobee knows your trial inside out — ask anything, from dosing
              schedules to side effects, anytime.
            </p>
          </div>

          {/* Chat bubble */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                {/* Bot intro bubble */}
                {messages.length === 0 && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-3 inline-flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur">
                      Hi! I&apos;m Whobee — your TrialForge companion. Ask me anything about your trial.
                    </div>
                  </motion.div>
                )}

                {/* Message thread */}
                {messages.length > 0 && (
                  <div className="mb-3 flex max-h-[180px] flex-col gap-2 overflow-y-auto scroll-neon">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start items-start gap-2"}`}>
                        {m.role === "bot" && (
                          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                            <Sparkles className="h-3 w-3 text-white" />
                          </span>
                        )}
                        <div className={
                          m.role === "user"
                            ? "max-w-[80%] rounded-2xl rounded-br-sm bg-white/20 px-3 py-2 text-sm text-white"
                            : "max-w-[80%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                        }>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                          <Sparkles className="h-3 w-3 text-white" />
                        </span>
                        <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-3 py-2 font-mono text-sm text-white/60">
                          {dots}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick suggestions */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 transition-all hover:bg-white/20 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input bar */}
                <form
                  onSubmit={(e) => { e.preventDefault(); send(input) }}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Whobee anything…"
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                    aria-label="Message Whobee"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl bg-white text-black hover:bg-white/90"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: 3D Robot ── */}
        <div className="relative flex-1 md:min-h-[520px]">
          <SplineScene
            scene={ROBOT_SCENE_URL}
            className="!h-full !w-full"
          />
          {/* Bottom fade to blend with background */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  )
}
