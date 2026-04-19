"use client"

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
