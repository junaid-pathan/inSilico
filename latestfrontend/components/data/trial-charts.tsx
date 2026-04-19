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

function getSignedDomain(data: Array<{ value: number }>) {
  const maxAbs = data.reduce((currentMax, item) => Math.max(currentMax, Math.abs(item.value ?? 0)), 0)
  const padded = Math.max(maxAbs * 1.15, 0.01)
  return [-padded, padded] as const
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

export function LocalShapChart({ data }: { data: any[] }) {
  const chartData = [...data]
    .map((item) => ({
      ...item,
      value: Number(item.shap_delta ?? 0),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  const maxAbs = chartData.reduce((currentMax, item) => Math.max(currentMax, Math.abs(item.value)), 0) || 1

  const formatShift = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(4)}`

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[120px_minmax(0,1fr)_72px] items-center px-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Feature</span>
        <span className="text-center">SHAP delta</span>
        <span className="text-right">Shift</span>
      </div>

      <div className="space-y-3">
        {chartData.map((item) => {
          const value = item.value
          const magnitude = Math.abs(value) / maxAbs
          const stemWidth = `${Math.max(magnitude * 50, 1.5)}%`
          const isLoweringRisk = value < 0
          const color = isLoweringRisk ? twinColor : baselineColor
          const sideStyle = isLoweringRisk
            ? { right: "50%", width: stemWidth }
            : { left: "50%", width: stemWidth }

          return (
            <div
              key={item.feature}
              className="grid grid-cols-[120px_minmax(0,1fr)_72px] items-center gap-3"
              title={`${item.feature}: ${formatShift(value)} | ${item.baseline_value.toFixed(2)} -> ${item.trial_twin_value.toFixed(2)}`}
            >
              <div className="truncate text-sm text-foreground">{item.feature}</div>

              <div className="relative h-8">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/60" />
                <div className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />

                <div
                  className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                  style={{
                    ...sideStyle,
                    background: color,
                    boxShadow: `0 0 18px ${color}`,
                  }}
                />

                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white/70"
                  style={{
                    ...(isLoweringRisk
                      ? { right: `calc(50% + ${stemWidth} - 0.4375rem)` }
                      : { left: `calc(50% + ${stemWidth} - 0.4375rem)` }),
                    background: color,
                    boxShadow: `0 0 22px ${color}`,
                  }}
                />
              </div>

              <div className="text-right font-mono text-xs text-muted-foreground">
                <span className={isLoweringRisk ? "text-[oklch(0.78_0.16_190)]" : "text-[oklch(0.72_0.2_25)]"}>
                  {formatShift(value)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
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
