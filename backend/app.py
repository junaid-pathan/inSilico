from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.model_loader import load_backend_state, score_patient_payload, simulate_payload
from trialforge_moa import DrugMoAInput


class PatientFeatures(BaseModel):
    HighBP: float = Field(..., ge=0, le=1)
    HighChol: float = Field(..., ge=0, le=1)
    BMI: float = Field(..., ge=10, le=80)
    Smoker: float = Field(..., ge=0, le=1)
    PhysActivity: float = Field(..., ge=0, le=1)
    Fruits: float = Field(..., ge=0, le=1)
    Veggies: float = Field(..., ge=0, le=1)
    DiffWalk: float = Field(..., ge=0, le=1)
    GenHlth: float = Field(..., ge=1, le=5)
    PhysHlth: float = Field(..., ge=0, le=30)
    MentHlth: float = Field(..., ge=0, le=30)
    Age: float = Field(..., ge=1, le=13)


class MoAPayload(BaseModel):
    drug_name: str
    moa_summary: str
    expected_biomarker_effect: str = ""
    gamma: Optional[float] = Field(default=None, ge=0, le=1)
    reasoning_brief: str = ""
    source_type: str = "manual"
    target_condition: str = "diabetes"


class ScorePatientRequest(BaseModel):
    patient: PatientFeatures


class SimulateTrialRequest(BaseModel):
    patient: PatientFeatures
    moa: MoAPayload


app = FastAPI(title="TrialForge Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, Any]:
    state = load_backend_state()
    return {
        "status": "ok",
        "mode": state["mode"],
        "artifact_paths": state["artifact_paths"],
        "feature_columns": state["context"].feature_columns,
    }


@app.post("/score-patient")
def score_patient_endpoint(request: ScorePatientRequest) -> Dict[str, Any]:
    return score_patient_payload(request.patient.model_dump())


@app.post("/simulate-trial")
def simulate_trial_endpoint(request: SimulateTrialRequest) -> Dict[str, Any]:
    moa = DrugMoAInput.from_dict(request.moa.model_dump())
    return simulate_payload(request.patient.model_dump(), moa)
