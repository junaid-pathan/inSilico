"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ArrowRight, Link as LinkIcon, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface TimelineItem {
  id: number
  title: string
  date: string
  content: string
  category: string
  icon: React.ElementType
  relatedIds: number[]
  status: "completed" | "in-progress" | "pending"
  energy: number
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[]
  centerLabel?: string
}

/** Monochrome white palette for all module nodes — dot accents pick up the page's red theme. */
const CATEGORY_GRADIENTS: Record<string, { from: string; to: string; glow: string }> = {
  Extraction:     { from: "oklch(1 0 0)",     to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" },
  Retrieval:      { from: "oklch(1 0 0)",     to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" },
  Analytics:      { from: "oklch(1 0 0)",     to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" },
  Simulation:     { from: "oklch(1 0 0)",     to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" },
  Cohort:         { from: "oklch(1 0 0)",     to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" },
  Explainability: { from: "oklch(1 0 0)",     to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" },
}

const DEFAULT_GRADIENT = { from: "oklch(1 0 0)", to: "oklch(0.86 0 0)", glow: "oklch(1 0 0 / 0.35)" }

function getGradient(category: string) {
  return CATEGORY_GRADIENTS[category] ?? DEFAULT_GRADIENT
}

export default function RadialOrbitalTimeline({ timelineData, centerLabel = "InSilico" }: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [rotationAngle, setRotationAngle] = useState<number>(0)
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({})
      setActiveNodeId(null)
      setAutoRotate(true)
    }
  }

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState: Record<number, boolean> = {}
      Object.keys(prev).forEach((key) => {
        newState[Number.parseInt(key)] = false
      })
      newState[id] = !prev[id]

      if (!prev[id]) {
        setActiveNodeId(id)
        setAutoRotate(false)
        centerViewOnNode(id)
      } else {
        setActiveNodeId(null)
        setAutoRotate(true)
      }

      return newState
    })
  }

  useEffect(() => {
    let rotationTimer: ReturnType<typeof setInterval> | undefined
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.25) % 360
          return Number(newAngle.toFixed(3))
        })
      }, 50)
    }
    return () => {
      if (rotationTimer) clearInterval(rotationTimer)
    }
  }, [autoRotate])

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId)
    const totalNodes = timelineData.length
    const targetAngle = (nodeIndex / totalNodes) * 360
    setRotationAngle(270 - targetAngle)
  }

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360
    const radius = 320
    const radian = (angle * Math.PI) / 180
    const x = Number((radius * Math.cos(radian)).toFixed(3))
    const y = Number((radius * Math.sin(radian)).toFixed(3))
    const zIndex = Math.round(100 + 50 * Math.cos(radian))
    const opacity = Number(Math.max(0.55, Math.min(1, 0.55 + 0.45 * ((1 + Math.sin(radian)) / 2))).toFixed(3))
    return { x, y, angle, zIndex, opacity }
  }

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId)
    return currentItem ? currentItem.relatedIds : []
  }

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false
    const relatedItems = getRelatedItems(activeNodeId)
    return relatedItems.includes(itemId)
  }

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-black bg-white border-white"
      case "in-progress":
        return "text-white bg-black border-white"
      case "pending":
        return "text-white bg-black/40 border-white/50"
      default:
        return "text-white bg-black/40 border-white/50"
    }
  }

  // Precompute live positions each render for the SVG connection layer
  const positions = useMemo(() => {
    const map = new Map<number, { x: number; y: number; opacity: number }>()
    timelineData.forEach((item, index) => {
      const p = calculateNodePosition(index, timelineData.length)
      map.set(item.id, { x: p.x, y: p.y, opacity: p.opacity })
    })
    return map
    // rotationAngle drives recompute; timelineData is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotationAngle, timelineData])

  const activeConnections = useMemo(() => {
    if (!activeNodeId) return [] as { from: { x: number; y: number }; to: { x: number; y: number }; toId: number }[]
    const from = positions.get(activeNodeId)
    if (!from) return []
    const related = getRelatedItems(activeNodeId)
    return related
      .map((rid) => {
        const to = positions.get(rid)
        return to ? { from, to, toId: rid } : null
      })
      .filter(Boolean) as { from: { x: number; y: number }; to: { x: number; y: number }; toId: number }[]
  }, [activeNodeId, positions, timelineData])

  return (
    <div
      className="w-full h-[820px] md:h-[960px] flex flex-col items-center justify-center overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      {/* Ambient glow behind orbit — picks up the page's red theme */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-[820px] w-[820px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, oklch(0.62 0.26 25 / 0.28) 0%, oklch(0.55 0.24 15 / 0.16) 38%, transparent 72%)",
            filter: "blur(34px)",
          }}
        />
      </div>

      <div className="relative w-full max-w-6xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{ perspective: "1200px" }}
        >
          {/* Orbit rings */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-white/35"
            style={{ transform: `rotate(${rotationAngle * 0.5}deg)` }}
          />
          <div
            className="absolute w-[720px] h-[720px] rounded-full border border-white/22"
            style={{ transform: `rotate(${-rotationAngle * 0.3}deg)` }}
          />
          <div className="absolute w-[840px] h-[840px] rounded-full border border-dashed border-white/15" />

          {/* Connection lines SVG — drawn when a node is active */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }}
            aria-hidden
          >
            <defs>
              <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(1 0 0 / 0.7)" />
                <stop offset="100%" stopColor="oklch(0.85 0 0 / 0.4)" />
              </linearGradient>
            </defs>
            {activeConnections.map(({ from, to, toId }) => (
              <line
                key={toId}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="url(#connection-gradient)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
                strokeLinecap="round"
                style={{
                  animation: "dash-flow 18s linear infinite",
                  opacity: 0.85,
                }}
              />
            ))}
          </svg>

          {/* Center orb */}
          <div className="absolute z-10 flex items-center justify-center">
            {/* Outer halo ring (spins slow) */}
            <div
              className="absolute w-52 h-52 rounded-full border border-dashed border-white/30"
              style={{ animation: "spin 22s linear infinite" }}
            />
            {/* Mid ring */}
            <div className="absolute w-44 h-44 rounded-full border border-white/20 animate-pulse-ring" />
            <div
              className="absolute w-40 h-40 rounded-full border border-white/15 animate-pulse-ring"
              style={{ animationDelay: "0.7s" }}
            />

            {/* Core orb — dimmed red to match page theme */}
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, oklch(0.78 0.16 28) 0%, oklch(0.58 0.22 20) 42%, oklch(0.38 0.22 18) 100%)",
                boxShadow:
                  "0 0 50px oklch(0.55 0.24 22 / 0.5), inset 0 0 22px oklch(1 0 0 / 0.12)",
              }}
            >
              <div className="flex flex-col items-center justify-center text-center px-2">
                <span className="font-display text-xs md:text-sm font-bold tracking-widest text-white drop-shadow">
                  {centerLabel}
                </span>
                <span className="mt-1.5 h-px w-8 bg-white/70" />
                <span className="mt-1 text-[10px] text-white/85 tracking-wider">CORE</span>
              </div>
            </div>
          </div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length)
            const isExpanded = expandedItems[item.id]
            const isRelated = isRelatedToActive(item.id)
            const isHovered = hoveredId === item.id
            const isActive = isExpanded || isHovered
            const dim = activeNodeId != null && !isExpanded && !isRelated
            const Icon = item.icon
            const gradient = getGradient(item.category)

            const nodeStyle: React.CSSProperties = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: dim ? 0.35 : position.opacity,
            }

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el
                }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                suppressHydrationWarning
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleItem(item.id)
                }}
              >
                {/* Soft glow halo */}
                <div
                  className="pointer-events-none absolute rounded-full -inset-1 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle, ${gradient.glow} 0%, transparent 65%)`,
                    width: `${item.energy * 0.55 + 60}px`,
                    height: `${item.energy * 0.55 + 60}px`,
                    left: `-${(item.energy * 0.55 + 60 - 48) / 2}px`,
                    top: `-${(item.energy * 0.55 + 60 - 48) / 2}px`,
                    opacity: isActive ? 1 : isRelated ? 0.75 : 0.45,
                  }}
                />

                {/* Icon chip — white by default, red accent when active */}
                <div
                  className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300
                    ${isExpanded ? "scale-125" : isHovered ? "scale-110" : ""}
                  `}
                  style={{
                    background: isActive
                      ? "radial-gradient(circle at 30% 30%, oklch(0.78 0.20 25), oklch(0.58 0.26 18))"
                      : "oklch(0.98 0 0)",
                    borderColor: isActive ? "oklch(0.78 0.18 25 / 0.95)" : "oklch(1 0 0 / 0.7)",
                    boxShadow: isActive
                      ? "0 0 24px oklch(0.62 0.28 22 / 0.7), inset 0 0 12px oklch(1 0 0 / 0.2)"
                      : "0 4px 14px oklch(0 0 0 / 0.4), 0 0 12px oklch(1 0 0 / 0.18)",
                    color: isActive ? "#fff" : "#0a0a0a",
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 2} />

                  {/* Small accent dot — red when active, soft red marker otherwise */}
                  <span
                    className="absolute -top-1 -right-1 block h-2 w-2 rounded-full"
                    style={{
                      background: isActive
                        ? "oklch(1 0 0)"
                        : "oklch(0.62 0.26 22)",
                      boxShadow: isActive
                        ? "0 0 8px oklch(1 0 0 / 0.6)"
                        : "0 0 6px oklch(0.62 0.28 22 / 0.7)",
                    }}
                  />
                </div>

                {/* Label pill */}
                <div
                  className={`
                    absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap
                    px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider
                    transition-all duration-300
                    ${isExpanded ? "text-white scale-105" : isHovered ? "text-white" : "text-white/80"}
                  `}
                  style={{
                    background: isActive
                      ? "oklch(0 0 0 / 0.7)"
                      : "oklch(0 0 0 / 0.45)",
                    backdropFilter: "blur(6px)",
                    border: `1px solid ${isActive ? "oklch(1 0 0 / 0.4)" : "oklch(1 0 0 / 0.1)"}`,
                    boxShadow: isActive ? `0 4px 20px ${gradient.glow}` : "none",
                  }}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-28 left-1/2 -translate-x-1/2 w-72 bg-black/98 backdrop-blur-md border-white/20 shadow-2xl overflow-visible"
                    style={{ boxShadow: `0 20px 60px -10px ${gradient.glow}, 0 0 0 1px oklch(1 0 0 / 0.08)` }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-3 w-px bg-white/50" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge className={`px-2 text-[10px] ${getStatusStyles(item.status)}`}>
                          {item.status === "completed"
                            ? "COMPLETE"
                            : item.status === "in-progress"
                              ? "IN PROGRESS"
                              : "PENDING"}
                        </Badge>
                        <span className="text-[10px] font-mono text-white/50">{item.date}</span>
                      </div>
                      <CardTitle className="text-sm mt-2 text-white flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                        />
                        {item.title}
                      </CardTitle>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                        / {item.category}
                      </p>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80">
                      <p className="leading-relaxed">{item.content}</p>

                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1" />
                            Signal Strength
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.energy}%`,
                              background: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})`,
                            }}
                          />
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center mb-2">
                            <LinkIcon size={10} className="text-white/70 mr-1" />
                            <h4 className="text-[10px] uppercase tracking-wider font-medium text-white/70">
                              Connected Nodes
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find((i) => i.id === relatedId)
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-xs rounded-md border-white/20 bg-transparent hover:bg-white/10 text-white/80 hover:text-white transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleItem(relatedId)
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight size={8} className="ml-1 text-white/60" />
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes dash-flow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -200; }
        }
      `}</style>
    </div>
  )
}
