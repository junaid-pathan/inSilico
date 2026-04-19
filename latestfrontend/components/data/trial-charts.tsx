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

const baselineColor = "oklch(0.72 0.2 25)"
const baselineFill = "oklch(0.72 0.2 25 / 0.18)"
const twinColor = "oklch(0.78 0.16 190)"
const twinFill = "oklch(0.78 0.16 190 / 0.22)"
const mildColor = "oklch(0.76 0.14 190)"
const moderateColor = "oklch(0.78 0.16 95)"
const severeColor = "oklch(0.68 0.22 25)"

const tooltipStyle = {
  backgroundColor: "oklch(0.17 0.05 295 / 0.95)",
  border: "1px solid oklch(0.65 0.26 310 / 0.4)",
  borderRadius: 12,
  color: "oklch(0.98 0.005 300)",
  fontSize: 12,
  fontFamily: "var(--font-geist-mono)",
}

function roundDomainValue(value: number, direction: "down" | "up") {
  const rounded = direction === "down" ? Math.floor(value) : Math.ceil(value)
  return Math.max(0, Math.min(100, rounded))
}

function getTrajectoryDomain(data: Array<{ baseline: number; twin: number }>) {
  const values = data.flatMap((point) => [point.baseline, point.twin]).filter((value) => Number.isFinite(value))
  if (values.length === 0) {
    return [0, 100] as const
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const spread = maxValue - minValue
  const minRange = 6
  const padding = Math.max(spread * 0.35, 1)
  const center = (minValue + maxValue) / 2
  const halfRange = Math.max((spread / 2) + padding, minRange / 2)

  return [
    roundDomainValue(center - halfRange, "down"),
    roundDomainValue(center + halfRange, "up"),
  ] as const
}

export function BaselineVsTwinChart({ data }: { data: any[] }) {
  const [domainMin, domainMax] = getTrajectoryDomain(data)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="twinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={twinFill} stopOpacity={0.95} />
            <stop offset="100%" stopColor={twinFill} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={baselineFill} stopOpacity={0.9} />
            <stop offset="100%" stopColor={baselineFill} stopOpacity={0} />
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
          domain={[domainMin, domainMax]}
          tickCount={6}
          allowDataOverflow
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: twinColor, strokeOpacity: 0.28 }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
        />
        <Area
          type="monotone"
          dataKey="baseline"
          stroke={baselineColor}
          strokeWidth={2}
          fill="url(#baseGrad)"
          name="Baseline"
          dot={{ r: 3, fill: baselineColor, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: baselineColor, stroke: "white", strokeWidth: 1.5 }}
        />
        <Area
          type="monotone"
          dataKey="twin"
          stroke={twinColor}
          strokeWidth={2.75}
          fill="url(#twinGrad)"
          name="Trial twin"
          dot={{ r: 3, fill: twinColor, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: twinColor, stroke: "white", strokeWidth: 1.5 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FeatureImportanceChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
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

export function CohortPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          stroke="oklch(0.12 0.04 295)"
        >
          {data.map((entry: any) => (
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

export function BiomarkerRadarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius={100}>
        <PolarGrid stroke="oklch(0.3 0.06 295 / 0.4)" />
        <PolarAngleAxis
          dataKey="biomarker"
          stroke="oklch(0.72 0.04 295)"
          fontSize={11}
        />
        <Radar
          name="Baseline"
          dataKey="baseline"
          stroke={baselineColor}
          fill={baselineColor}
          fillOpacity={0.18}
        />
        <Radar
          name="Trial twin"
          dataKey="twin"
          stroke={twinColor}
          fill={twinColor}
          fillOpacity={0.28}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function AdverseEventsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="oklch(0.3 0.06 295 / 0.25)" strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke="oklch(0.72 0.04 295)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.72 0.04 295)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.65 0.26 310 / 0.08)" }} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono)" }} />
        <Bar dataKey="mild" stackId="a" fill={mildColor} radius={[0, 0, 0, 0]} />
        <Bar dataKey="moderate" stackId="a" fill={moderateColor} />
        <Bar dataKey="severe" stackId="a" fill={severeColor} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
