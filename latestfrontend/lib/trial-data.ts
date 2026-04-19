// Hardcoded TrialForge demo data used across Simulator + Insights pages.
// All numbers are illustrative only.

export const baselineVsTwin = [
  { label: "Wk 0", baseline: 62.5, twin: 62.5 },
  { label: "Wk 2", baseline: 61.8, twin: 58.9 },
  { label: "Wk 4", baseline: 61.1, twin: 54.2 },
  { label: "Wk 8", baseline: 60.2, twin: 48.7 },
  { label: "Wk 12", baseline: 59.5, twin: 43.1 },
  { label: "Wk 16", baseline: 58.9, twin: 39.4 },
  { label: "Wk 20", baseline: 58.4, twin: 36.8 },
  { label: "Wk 24", baseline: 57.8, twin: 34.2 },
]

export const featureImportance = [
  { feature: "HbA1c Δ", value: 0.92 },
  { feature: "BMI", value: 0.78 },
  { feature: "HighBP", value: 0.71 },
  { feature: "Age", value: 0.64 },
  { feature: "PhysActivity", value: 0.58 },
  { feature: "HighChol", value: 0.51 },
  { feature: "Smoker", value: 0.44 },
  { feature: "DiffWalk", value: 0.37 },
]

export const cohortBreakdown = [
  { name: "Responders", value: 412, color: "var(--chart-1)" },
  { name: "Partial", value: 198, color: "var(--chart-5)" },
  { name: "No effect", value: 86, color: "var(--chart-3)" },
  { name: "Adverse", value: 24, color: "var(--chart-2)" },
]

export const biomarkerRadar = [
  { biomarker: "Glucose", baseline: 78, twin: 42 },
  { biomarker: "BMI", baseline: 72, twin: 48 },
  { biomarker: "BP", baseline: 68, twin: 40 },
  { biomarker: "Cholesterol", baseline: 64, twin: 46 },
  { biomarker: "Activity", baseline: 32, twin: 74 },
  { biomarker: "Sleep", baseline: 40, twin: 66 },
]

export const adverseEvents = [
  { day: "Mon", mild: 8, moderate: 3, severe: 0 },
  { day: "Tue", mild: 12, moderate: 2, severe: 1 },
  { day: "Wed", mild: 6, moderate: 4, severe: 0 },
  { day: "Thu", mild: 11, moderate: 1, severe: 0 },
  { day: "Fri", mild: 9, moderate: 3, severe: 1 },
  { day: "Sat", mild: 4, moderate: 2, severe: 0 },
  { day: "Sun", mild: 5, moderate: 1, severe: 0 },
]

export const featureDeltas = [
  { feature: "HighBP", baseline: 1.0, twin: 0.42, delta: -0.58 },
  { feature: "BMI", baseline: 35.0, twin: 29.8, delta: -5.2 },
  { feature: "HighChol", baseline: 1.0, twin: 0.61, delta: -0.39 },
  { feature: "PhysActivity", baseline: 0.0, twin: 0.74, delta: 0.74 },
  { feature: "GenHlth", baseline: 4.0, twin: 2.6, delta: -1.4 },
  { feature: "PhysHlth", baseline: 12.0, twin: 4.1, delta: -7.9 },
]

export const keyMetrics = [
  { label: "Baseline risk", value: "62.5%", tone: "warn" as const, delta: "baseline" },
  { label: "Trial twin risk", value: "34.2%", tone: "good" as const, delta: "−28.3 pts" },
  { label: "Predicted Δ", value: "+28.3", tone: "good" as const, delta: "pts improvement" },
  { label: "Gamma", value: "0.42", tone: "primary" as const, delta: "GLP-1 demo" },
  { label: "Cohort N", value: "720", tone: "neutral" as const, delta: "digital twins" },
  { label: "Confidence", value: "94.1%", tone: "primary" as const, delta: "5-fold CV" },
]

export const insights = [
  {
    title: "Responder phenotype",
    value: "BMI > 32 + HighBP",
    copy: "Patients with combined metabolic burden show a 2.3× larger gamma response vs. the general cohort.",
    tag: "Phenotype",
  },
  {
    title: "Dropout risk spike",
    value: "Week 4 · +18%",
    copy: "Adherence dips between visit 3 and 4. Push a Whobee reminder sequence 48h before each window.",
    tag: "Retention",
  },
  {
    title: "Wearable signal",
    value: "Step count ↑ 62%",
    copy: "Fitbit step streams predict glycemic improvement ~2 weeks before lab confirmation.",
    tag: "Signal",
  },
  {
    title: "Site variability",
    value: "σ = 0.14",
    copy: "Site 03 out-performs the mean by 1.8×. Replicate its nurse-led education protocol across sites.",
    tag: "Operations",
  },
]
