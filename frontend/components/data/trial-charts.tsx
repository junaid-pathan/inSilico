"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  adverseEvents,
  baselineVsTwin,
  biomarkerRadar,
  cohortBreakdown,
  featureImportance,
} from "@/lib/trial-data"

const tooltipStyle = {
  backgroundColor: "oklch(0.17 0.05 295 / 0.95)",
  border: "1px solid oklch(0.65 0.26 310 / 0.4)",
  borderRadius: 12,
  color: "oklch(0.98 0.005 300)",
  fontSize: 12,
  fontFamily: "var(--font-geist-mono)",
}

export function BaselineVsTwinChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={baselineVsTwin} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="twinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(0.3 0.06 295 / 0.3)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          stroke="oklch(0.72 0.04 295)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="oklch(0.72 0.04 295)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          unit="%"
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--chart-1)", strokeOpacity: 0.3 }} />
        <Area
          type="monotone"
          dataKey="baseline"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#baseGrad)"
          name="Baseline"
        />
        <Area
          type="monotone"
          dataKey="twin"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill="url(#twinGrad)"
          name="Trial twin"
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FeatureImportanceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={featureImportance}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fiGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-5)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(0.3 0.06 295 / 0.2)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" stroke="oklch(0.72 0.04 295)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="feature"
          stroke="oklch(0.72 0.04 295)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.65 0.26 310 / 0.1)" }} />
        <Bar dataKey="value" fill="url(#fiGrad)" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CohortPieChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie
          data={cohortBreakdown}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          stroke="oklch(0.12 0.04 295)"
        >
          {cohortBreakdown.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function BiomarkerRadarChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={biomarkerRadar} outerRadius={100}>
        <PolarGrid stroke="oklch(0.3 0.06 295 / 0.4)" />
        <PolarAngleAxis
          dataKey="biomarker"
          stroke="oklch(0.72 0.04 295)"
          fontSize={11}
        />
        <Radar
          name="Baseline"
          dataKey="baseline"
          stroke="var(--chart-2)"
          fill="var(--chart-2)"
          fillOpacity={0.25}
        />
        <Radar
          name="Trial twin"
          dataKey="twin"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.35}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function AdverseEventsChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={adverseEvents} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="oklch(0.3 0.06 295 / 0.25)" strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke="oklch(0.72 0.04 295)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.72 0.04 295)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.65 0.26 310 / 0.08)" }} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
        <Bar dataKey="mild" stackId="a" fill="var(--chart-3)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="moderate" stackId="a" fill="var(--chart-4)" />
        <Bar dataKey="severe" stackId="a" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
