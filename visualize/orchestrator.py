import json
import time
from synthetic_twin_engine import SyntheticTwinEngine

class PrivacyAgent:
    """
    (Dedalus/Eragon Container 1)
    Handles ONLY PII (Personally Identifiable Information).
    Has access to Google Calendar, Emails, Names.
    NEVER sees clinical data or trial protocol details.
    """
    def __init__(self):
        # Mock Google Calendar / PII Database
        self.user_data = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "calendar": [
                {"date": "2026-04-19", "activity": "Heavy Squats & 5k Run at Gym"},
                {"date": "2026-04-20", "activity": "Regeneron Trial Visit 3"}
            ]
        }
    
    def get_upcoming_activities(self):
        return [item["activity"] for item in self.user_data["calendar"]]
        
    def execute_action(self, action_signal, payload):
        print(f"[Privacy Agent] Received Signal: {action_signal}")
        if action_signal == "UPDATE_CALENDAR_REST_DAY":
            print(f"[Privacy Agent] Updating calendar for {self.user_data['name']}...")
            print(f"[Privacy Agent] Action Taken: Added 'Rest Day' block before Trial Visit.")
            return True
        return False

class MedicalAgent:
    """
    (Dedalus/Eragon Container 2)
    Handles ONLY PHI (Protected Health Information).
    Has access to Clinical PDFs, Symptom Logs, and K2 Reasoning.
    NEVER sees patient name, email, or exact calendar details.
    """
    def __init__(self):
        # Mock Clinical Database
        self.patient_id = "PATIENT_84729"
        self.protocol_snippet = "Patients receiving the subcutaneous injection may experience localized swelling, fluid retention, and subsequent peripheral edema in the lower extremities. Strenuous physical activity should be avoided for 48 hours post-injection."
        
    def process_lifestyle_check(self, anonymized_lifestyle_string, twin_profile, k2_engine, attribution_engine):
        print(f"[Medical Agent] Analyzing anonymized lifestyle data for {self.patient_id}...")
        print(f"[Medical Agent] Integrated Digital Twin Profile Risks: {twin_profile['predicted_adverse_events']}")
        
        # 1. Get Attributions
        saliency_data = attribution_engine.generate_saliency_map(self.protocol_snippet)
        top_tokens = saliency_data["top_attributions"]
        
        # 2. Run K2 Conflict Analysis
        k2_results = k2_engine.run_analysis(
            self.protocol_snippet, 
            anonymized_lifestyle_string, 
            top_tokens,
            twin_profile
        )
        
        return k2_results

class DedalusOrchestrator:
    """
    The Firewall / Middleware.
    Routes data securely between the Privacy and Medical agents.
    Ensures HIPAA compliance by stripping identifiers before passing to the Medical Agent,
    and stripping clinical data before passing to the Privacy Agent.
    """
    def __init__(self, privacy_agent, medical_agent):
        self.privacy_agent = privacy_agent
        self.medical_agent = medical_agent
        self.twin_engine = SyntheticTwinEngine()
        
    def run_daily_sync(self, k2_engine, attribution_engine):
        print("\n=== STARTING DAILY DEDALUS SYNC ===")
        
        # STEP 1: Privacy Agent gets lifestyle data
        activities = self.privacy_agent.get_upcoming_activities()
        # Anonymize: Just pass the activity string, no dates/names
        anonymized_activity = ", ".join(activities) 
        
        print(f"[Orchestrator] Stripped PII. Passing lifestyle data to Medical Agent.")
        
        # STEP 2: Orchestrator Generates Digital Twin
        print(f"[Orchestrator] Generating Predictive Digital Twin from Artificial Control Group...")
        # Assume privacy_agent provides basic demographic data stripped of direct identifiers
        patient_demographics = {"age": 68, "sex": "F"} 
        twin_profile = self.twin_engine.generate_patient_twin_profile(patient_demographics)
        
        # STEP 3: Medical Agent analyzes it using AI stack
        analysis_result = self.medical_agent.process_lifestyle_check(
            anonymized_activity, 
            twin_profile,
            k2_engine, 
            attribution_engine
        )
        
        if analysis_result["conflict_detected"]:
            print(f"\n[Orchestrator] Conflict detected! Routing action signals...")
            
            # STEP 3: Route actions appropriately
            for signal in analysis_result["action_signals"]:
                if "CALENDAR" in signal:
                    # Pass back to Privacy Agent (No PHI, just a command)
                    self.privacy_agent.execute_action(signal, payload={"type": "calendar_block"})
                elif "BIODIGITAL" in signal:
                    print(f"[Orchestrator] Triggering BioDigital API on UI layer: {signal}")
                    
        print("=== SYNC COMPLETE ===\n")

if __name__ == "__main__":
    from attribution_engine import AttributionEngine
    from k2_reasoning import K2ReasoningEngine
    
    # Initialize our AI models (simulated)
    attr_engine = AttributionEngine()
    k2_engine = K2ReasoningEngine()
    
    # Initialize our isolated agents
    privacy_container = PrivacyAgent()
    medical_container = MedicalAgent()
    
    # Initialize the Orchestrator Firewall
    firewall = DedalusOrchestrator(privacy_container, medical_container)
    
    # Run the automated sync
    firewall.run_daily_sync(k2_engine, attr_engine)
