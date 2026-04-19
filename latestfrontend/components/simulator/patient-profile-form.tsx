"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type PatientProfile = {
  HighBP: number
  HighChol: number
  BMI: number
  Smoker: number
  PhysActivity: number
  Fruits: number
  Veggies: number
  DiffWalk: number
  GenHlth: number
  PhysHlth: number
  MentHlth: number
  Age: number
}

type PresetKey = "highRisk" | "moderateRisk"

type FieldName = keyof PatientProfile

type FieldConfig = {
  name: FieldName
  label: string
  kind: "binary" | "number"
  min?: number
  max?: number
  step?: number
  help: string
}

export const patientPresets: Record<PresetKey, PatientProfile> = {
  highRisk: {
    HighBP: 1,
    HighChol: 1,
    BMI: 35,
    Smoker: 0,
    PhysActivity: 0,
    Fruits: 0,
    Veggies: 1,
    DiffWalk: 1,
    GenHlth: 4,
    PhysHlth: 12,
    MentHlth: 7,
    Age: 9,
  },
  moderateRisk: {
    HighBP: 0,
    HighChol: 1,
    BMI: 29,
    Smoker: 0,
    PhysActivity: 1,
    Fruits: 1,
    Veggies: 1,
    DiffWalk: 0,
    GenHlth: 3,
    PhysHlth: 4,
    MentHlth: 2,
    Age: 7,
  },
}

const fieldConfigs: FieldConfig[] = [
  { name: "HighBP", label: "High blood pressure", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "HighChol", label: "High cholesterol", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "BMI", label: "BMI", kind: "number", min: 16, max: 55, step: 0.1, help: "Body mass index" },
  { name: "Smoker", label: "Smoker", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "PhysActivity", label: "Physical activity", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "Fruits", label: "Fruit intake", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "Veggies", label: "Vegetable intake", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "DiffWalk", label: "Difficulty walking", kind: "binary", help: "0 = No, 1 = Yes" },
  { name: "GenHlth", label: "General health", kind: "number", min: 1, max: 5, step: 1, help: "BRFSS scale 1-5" },
  { name: "PhysHlth", label: "Poor physical health days", kind: "number", min: 0, max: 30, step: 1, help: "Days in last month" },
  { name: "MentHlth", label: "Poor mental health days", kind: "number", min: 0, max: 30, step: 1, help: "Days in last month" },
  { name: "Age", label: "Age bucket", kind: "number", min: 1, max: 13, step: 1, help: "BRFSS age bucket 1-13" },
]

type PatientProfileFormProps = {
  patient: PatientProfile
  onChange: (field: FieldName, value: number) => void
  onLoadPreset: (preset: PresetKey) => void
}

export function PatientProfileForm({
  patient,
  onChange,
  onLoadPreset,
}: PatientProfileFormProps) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onLoadPreset("highRisk")}
        >
          Load high-risk preset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onLoadPreset("moderateRisk")}
        >
          Load moderate-risk preset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fieldConfigs.map((field) => (
          <label
            key={field.name}
            className="space-y-2 rounded-2xl border border-border/60 bg-background/20 p-4"
          >
            <div className="space-y-1">
              <span className="block text-sm font-medium text-foreground">
                {field.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {field.help}
              </span>
            </div>

            {field.kind === "binary" ? (
              <Select
                value={String(patient[field.name])}
                onValueChange={(value) => onChange(field.name, Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={patient[field.name]}
                onChange={(event) => onChange(field.name, Number(event.target.value))}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

type PatientProfileWizardProps = PatientProfileFormProps & {
  onScoreBaseline: () => void
  baselineScore?: {
    risk_score?: number
    mode?: string
  } | null
  isLoading?: boolean
  error?: string
  onReviewStepChange?: (isReviewStep: boolean) => void
}

export function PatientProfileWizard({
  patient,
  onChange,
  onLoadPreset,
  onScoreBaseline,
  baselineScore,
  isLoading = false,
  error = "",
  onReviewStepChange,
}: PatientProfileWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const isReviewStep = stepIndex >= fieldConfigs.length
  const currentField = fieldConfigs[Math.min(stepIndex, fieldConfigs.length - 1)]
  const progress = isReviewStep ? 100 : Math.round(((stepIndex + 1) / (fieldConfigs.length + 1)) * 100)

  const summaryItems = useMemo(
    () =>
      fieldConfigs.map((field) => ({
        ...field,
        value: patient[field.name],
      })),
    [patient],
  )

  const goNext = () => {
    setStepIndex((current) => Math.min(current + 1, fieldConfigs.length))
  }

  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  const applyPreset = (preset: PresetKey) => {
    onLoadPreset(preset)
    setStepIndex(0)
  }

  useEffect(() => {
    onReviewStepChange?.(isReviewStep)
  }, [isReviewStep, onReviewStepChange])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyPreset("highRisk")}
        >
          Load high-risk preset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyPreset("moderateRisk")}
        >
          Load moderate-risk preset
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <span>{isReviewStep ? "Review" : `Step ${stepIndex + 1} of ${fieldConfigs.length}`}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.78_0.16_190),oklch(0.72_0.2_25))] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isReviewStep ? (
        <div className="space-y-5 rounded-3xl border border-white/12 bg-[oklch(0.14_0.03_295/0.88)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-7">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
              / Review
            </p>
            <h3 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-foreground">
              Patient summary
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Confirm the profile, optionally score the baseline risk, then upload the MoA document.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {summaryItems.map((field) => (
              <div
                key={field.name}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/90">
                  {field.label}
                </div>
                <div className="mt-2 text-base font-medium text-foreground">
                  {field.kind === "binary" ? (field.value ? "Yes" : "No") : field.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onScoreBaseline} disabled={isLoading}>
              {isLoading ? "Scoring..." : "Score baseline"}
            </Button>
            {baselineScore?.risk_score !== undefined ? (
              <p className="rounded-full border border-border/60 bg-background/20 px-4 py-2 text-sm text-muted-foreground">
                Baseline risk:{" "}
                <span className="font-semibold text-foreground">
                  {(baselineScore.risk_score * 100).toFixed(1)}%
                </span>{" "}
                ({baselineScore.mode || "unknown"} mode)
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-[oklch(0.72_0.2_25)]">{error}</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/12 bg-[oklch(0.14_0.03_295/0.9)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8">
          <p className="font-mono text-[12px] uppercase tracking-[0.35em] text-primary">
            / Question
          </p>
          <h3 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
            {currentField.label}
          </h3>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {currentField.help}
          </p>

          <div className="mt-8">
            {currentField.kind === "binary" ? (
              <Select
                value={String(patient[currentField.name])}
                onValueChange={(value) => onChange(currentField.name, Number(value))}
              >
                <SelectTrigger className="h-16 w-full rounded-2xl border-white/12 bg-black/25 px-5 text-lg text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                min={currentField.min}
                max={currentField.max}
                step={currentField.step}
                value={patient[currentField.name]}
                onChange={(event) => onChange(currentField.name, Number(event.target.value))}
                className="h-16 rounded-2xl border-white/12 bg-black/25 px-5 text-lg text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
              />
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={stepIndex === 0}
        >
          Back
        </Button>

        <Button type="button" onClick={goNext} disabled={isReviewStep}>
          {stepIndex === fieldConfigs.length - 1 ? "Review answers" : "Next question"}
        </Button>
      </div>
    </div>
  )
}
