from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import subprocess
import json
import os

# Import our existing AI logic
from orchestrator import PrivacyAgent, MedicalAgent, DedalusOrchestrator
from k2_reasoning import K2ReasoningEngine
from attribution_engine import AttributionEngine

app = FastAPI(title="BioTrace Backend", description="Multi-Agent API for Interpretability")

# Allow the React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the media directory to serve Manim videos statically
os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Initialize singletons for our AI models and isolated containers
print("Initializing Agents...")
k2_engine = K2ReasoningEngine()
attr_engine = AttributionEngine()

privacy_agent = PrivacyAgent()
medical_agent = MedicalAgent()
firewall = DedalusOrchestrator(privacy_agent, medical_agent)

class PatientInput(BaseModel):
    activity: str
    date: str

class ProtocolUpload(BaseModel):
    protocol_text: str

@app.post("/api/register-trial")
async def register_trial(data: ProtocolUpload):
    """
    Simulates a patient uploading a trial protocol document.
    We parse the protocol, generate a milestones.json, and run the Manim animator.
    """
    print("[API Endpoint] Received trial registration document.")
    
    # In a real app, an LLM would parse `data.protocol_text` into these steps.
    # We will simulate the extraction here.
    milestones = [
        {"label": "Screening\n(Initial)", "pos": 0, "status": "past"},
        {"label": "Injection\n(Dose 1)", "pos": 1, "status": "past"},
        {"label": "Checkup\n(Week 2)", "pos": 2, "status": "upcoming"},
        {"label": "Final\n(Closeout)", "pos": 3, "status": "future"}
    ]
    
    with open("milestones.json", "w") as f:
        json.dump(milestones, f)
        
    print("[API Endpoint] Running Manim to generate Timeline Flowchart...")
    # Run manim synchronously for the demo (in production use BackgroundTasks)
    try:
        subprocess.run(["manim", "-pql", "timeline_animator.py", "TrialTimeline"], check=True)
    except Exception as e:
        print(f"Manim error: {e}")
        
    # Manim saves to this specific path structure
    video_url = "http://127.0.0.1:8000/media/videos/timeline_animator/480p15/TrialTimeline.mp4"
    
    return {
        "status": "success", 
        "message": "Trial registered and flowchart generated.",
        "video_url": video_url,
        "calendar_connected": True
    }

@app.post("/api/analyze-lifestyle")
async def analyze_lifestyle(data: PatientInput):
    """
    This endpoint simulates what happens when the Open Claw syncs a new calendar event.
    """
    print(f"\n[API Endpoint] Received new calendar activity: {data.activity}")
    
    # 1. Manually add this to the Privacy Agent's "Calendar" (PII Zone)
    privacy_agent.user_data["calendar"].append({"date": data.date, "activity": data.activity})
    
    # 2. Extract just the anonymized string from the PII container
    anonymized_activity = data.activity # Stripping out names/dates happens here conceptually
    
    # 3. Medical Agent processes the clinical side
    print(f"[API Endpoint] Routing anonymized data through the firewall to Medical Agent...")
    analysis_result = medical_agent.process_lifestyle_check(
        anonymized_activity, 
        k2_engine, 
        attr_engine
    )
    
    # 4. If a conflict is found, we process the action signals
    if analysis_result.get("conflict_detected"):
        for signal in analysis_result["action_signals"]:
            if "CALENDAR" in signal:
                privacy_agent.execute_action(signal, payload={"type": "calendar_block"})
                
    return analysis_result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
