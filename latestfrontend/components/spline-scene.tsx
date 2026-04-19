"use client"

import { Suspense, lazy } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const Spline = lazy(() => import("@splinetool/react-spline"))

interface SplineSceneProps {
  scene: string
  className?: string
  fallbackClassName?: string
}

export function SplineScene({ scene, className, fallbackClassName }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-primary",
            fallbackClassName,
          )}
        >
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="sr-only">Loading 3D scene</span>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
