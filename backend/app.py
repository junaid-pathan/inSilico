from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

# Load .env from the project root before any module reads GEMINI_API_KEY.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.model_loader import load_backend_state, score_patient_payload, simulate_payload
from backend.pdf_parser import PdfParseError, parse_trial_pdf
from insilico_moa import DrugMoAInput


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


app = FastAPI(title="InSilico Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Checks if our backend is alive and well.
# It's useful for debugging and making sure the server didn't crash.
@app.get("/health")
def health() -> Dict[str, Any]:
    state = load_backend_state()
    return {
        "status": "ok",
        "mode": state["mode"],
        "artifact_paths": state["artifact_paths"],
        "feature_columns": state["context"].feature_columns,
    }


# Calculates the "Baseline Score" (how sick the patient is)
# by running the BRFSS patient data through our pre-trained XGBoost AI model.
@app.post("/score-patient")
def score_patient_endpoint(request: ScorePatientRequest) -> Dict[str, Any]:
    return score_patient_payload(request.patient.model_dump())


# This endpoint takes the Patient's baseline stats AND the drug's Mechanism of Action (MoA),
# combines them using our special Gamma formula, and simulates the patient's future health trajectory!
@app.post("/simulate-trial")
def simulate_trial_endpoint(request: SimulateTrialRequest) -> Dict[str, Any]:
    moa = DrugMoAInput.from_dict(request.moa.model_dump())
    return simulate_payload(request.patient.model_dump(), moa)


# This is the "brain" parser! It accepts a highly technical medical PDF,
# reads the bytes, and passes it to the Gemini RAG pipeline to extract the medicine's key properties.
@app.post("/parse-trial-pdf")
async def parse_trial_pdf_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    # Always return 200 with an error payload on failure so the browser can
    # actually read the detail (avoids CORS swallowing the response).
    if not file.filename.lower().endswith(".pdf"):
        return {"error": True, "detail": "Only PDF uploads are supported."}

    pdf_bytes = await file.read()
    if not pdf_bytes:
        return {"error": True, "detail": "Uploaded file is empty."}

    try:
        return parse_trial_pdf(pdf_bytes)
    except Exception as exc:
        import traceback
        tb = traceback.format_exc()
        print("=" * 60, flush=True)
        print("PDF PARSE EXCEPTION:", flush=True)
        print(tb, flush=True)
        print("=" * 60, flush=True)
        return {
            "error": True,
            "detail": f"{type(exc).__name__}: {exc}",
            "traceback": tb,
        }
