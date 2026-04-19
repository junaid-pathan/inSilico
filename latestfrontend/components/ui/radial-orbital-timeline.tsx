"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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

export default function RadialOrbitalTimeline({ timelineData, centerLabel = "TrialForge" }: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [rotationAngle, setRotationAngle] = useState<number>(0)
  const [autoRotate, setAutoRotate] = useState<boolean>(true)
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({})
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({})
      setActiveNodeId(null)
      setPulseEffect({})
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
        const relatedItems = getRelatedItems(id)
        const newPulseEffect: Record<number, boolean> = {}
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true
        })
        setPulseEffect(newPulseEffect)
        centerViewOnNode(id)
      } else {
        setActiveNodeId(null)
        setAutoRotate(true)
        setPulseEffect({})
      }

      return newState
    })
  }

  useEffect(() => {
    let rotationTimer: ReturnType<typeof setInterval> | undefined
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360
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
    const radius = 220
    const radian = (angle * Math.PI) / 180
    const x = Number((radius * Math.cos(radian)).toFixed(3))
    const y = Number((radius * Math.sin(radian)).toFixed(3))
    const zIndex = Math.round(100 + 50 * Math.cos(radian))
    const opacity = Number(Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))).toFixed(3))
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

  return (
    <div
      className="w-full h-[640px] md:h-[720px] flex flex-col items-center justify-center overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{ perspective: "1000px" }}
        >
          {/* center orb */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-[oklch(0.65_0.26_310)] via-[oklch(0.7_0.18_230)] to-[oklch(0.78_0.15_200)] flex items-center justify-center z-10 shadow-2xl">
            <div className="absolute w-28 h-28 rounded-full border border-white/20 animate-pulse-ring opacity-70" />
            <div
              className="absolute w-32 h-32 rounded-full border border-white/10 animate-pulse-ring opacity-50"
              style={{ animationDelay: "0.5s" }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-2">
              <span className="font-display text-[10px] md:text-xs font-bold tracking-widest text-white">
                {centerLabel}
              </span>
              <span className="mt-1 h-px w-6 bg-white/60" />
              <span className="mt-1 text-[8px] text-white/80 tracking-wider">CORE</span>
            </div>
          </div>

          {/* orbit rings */}
          <div className="absolute w-[460px] h-[460px] rounded-full border border-white/10" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-white/5" />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length)
            const isExpanded = expandedItems[item.id]
            const isRelated = isRelatedToActive(item.id)
            const isPulsing = pulseEffect[item.id]
            const Icon = item.icon

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
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
                onClick={(e) => {
                  e.stopPropagation()
                  toggleItem(item.id)
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${isPulsing ? "animate-pulse duration-1000" : ""}`}
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                />

                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${
                      isExpanded
                        ? "bg-white text-black"
                        : isRelated
                          ? "bg-white/70 text-black"
                          : "bg-black text-white"
                    }
                    border-2
                    ${
                      isExpanded
                        ? "border-white shadow-lg shadow-white/30"
                        : isRelated
                          ? "border-white animate-pulse"
                          : "border-white/40"
                    }
                    transition-all duration-300 transform
                    ${isExpanded ? "scale-125" : ""}
                  `}
                >
                  <Icon size={18} />
                </div>

                <div
                  className={`
                    absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap
                    text-xs font-semibold tracking-wider
                    transition-all duration-300
                    ${isExpanded ? "text-white scale-110" : "text-white/70"}
                  `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-24 left-1/2 -translate-x-1/2 w-72 bg-black/90 backdrop-blur-lg border-white/30 shadow-xl shadow-white/10 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-white/50" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge className={`px-2 text-xs ${getStatusStyles(item.status)}`}>
                          {item.status === "completed"
                            ? "COMPLETE"
                            : item.status === "in-progress"
                              ? "IN PROGRESS"
                              : "PENDING"}
                        </Badge>
                        <span className="text-xs font-mono text-white/50">{item.date}</span>
                      </div>
                      <CardTitle className="text-sm mt-2 text-white">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80">
                      <p className="leading-relaxed">{item.content}</p>

                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1" />
                            Signal Strength
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[oklch(0.65_0.26_310)] to-[oklch(0.7_0.18_230)]"
                            style={{ width: `${item.energy}%` }}
                          />
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center mb-2">
                            <LinkIcon size={10} className="text-white/70 mr-1" />
                            <h4 className="text-xs uppercase tracking-wider font-medium text-white/70">
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
    </div>
  )
}
