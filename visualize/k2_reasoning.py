import json
import os
import requests

class K2ReasoningEngine:
    """
    The K2 Think V2 (70B) Reasoning Pipeline.
    Responsible for 'Comparative Conflict Analysis' and generating logic gates
    for the multi-agent system.
    """
    
    def __init__(self, api_key=None, endpoint="https://api.mbzuai.example/k2/v2/chat"):
        # Placeholder for actual K2 MBZUAI endpoint
        self.api_key = api_key or os.getenv("K2_API_KEY", "mock_key_for_hackathon")
        self.endpoint = endpoint
        
    def generate_conflict_analysis_prompt(self, protocol_snippet, patient_lifestyle, risk_attributions):
        """
        Creates the specialized prompt for K2 to perform comparative conflict analysis.
        """
        prompt = f"""
        [ROLE]
        You are a Medical Interpretability AI Agent (K2 Think V2). Your goal is to translate 
        dense clinical trial protocols into patient-friendly, actionable advice, ensuring 
        strict safety and compliance.

        [TASK: Comparative Conflict Analysis]
        Compare the provided clinical trial protocol constraints against the patient's reported lifestyle.
        Identify ANY conflicts. Then, explain the risk using the provided 'high-weight' attribution tokens 
        so the patient understands exactly WHERE in the document this warning comes from.

        [INPUTS]
        - Trial Protocol Snippet: "{protocol_snippet}"
        - Patient's Planned Activity/Lifestyle: "{patient_lifestyle}"
        - Saliency/Attribution Tokens Triggering Warning: {json.dumps(risk_attributions)}

        [OUTPUT FORMAT REQUIRED (JSON)]
        {{
            "conflict_detected": boolean,
            "conflict_summary": "Short explanation of the clash",
            "protocol_reference": "Specific phrase or section from protocol",
            "patient_message": "Friendly, empathetic message explaining the conflict, referencing the specific risk terms in plain English.",
            "action_signals": ["LOGIC_GATE_1", "LOGIC_GATE_2"] // e.g., SCHEDULE_BLOCK, BIO_VISUAL_TRIGGER
        }}
        """
        return prompt

    def run_analysis(self, protocol_snippet, patient_lifestyle, risk_attributions):
        """
        Executes the reasoning call to K2.
        """
        prompt = self.generate_conflict_analysis_prompt(protocol_snippet, patient_lifestyle, risk_attributions)
        
        print("Sending Comparative Conflict Analysis prompt to K2 (70B)...")
        # --- MOCK API CALL for Hackathon logic ---
        # In production:
        # response = requests.post(self.endpoint, headers={"Authorization": f"Bearer {self.api_key}"}, json={"prompt": prompt})
        # return response.json()
        
        # Simulating K2's intelligent response based on the inputs
        simulated_k2_response = {
            "conflict_detected": True,
            "conflict_summary": "Intense exercise may exacerbate fluid retention and swelling associated with the subcutaneous injection.",
            "protocol_reference": "experience localized swelling, fluid retention, and subsequent peripheral edema",
            "patient_message": "Hi there! I noticed you're planning a heavy gym session tomorrow. Because your recent Regeneron injection can cause 'peripheral edema' (which is medical jargon for fluid retention and swelling in your legs), hitting the gym hard right now might make that swelling worse, specifically in your calf muscles. Let's stick to a light walk instead to be safe!",
            "action_signals": ["TRIGGER_BIODIGITAL_SEARCH", "UPDATE_CALENDAR_REST_DAY"],
            "target_anatomy": "gastrocnemius" # AI dynamically identifies the exact muscle/organ
        }
        
        return simulated_k2_response

if __name__ == "__main__":
    engine = K2ReasoningEngine()
    
    # 1. We get these from our AttributionEngine
    high_weight_tokens = [
        {"token": "subcutaneous", "weight": 0.85},
        {"token": "edema", "weight": 0.72},
        {"token": "swelling", "weight": 0.68}
    ]
    
    # 2. Context from Regeneron PDF
    protocol = "Patients receiving the subcutaneous injection may experience localized swelling, fluid retention, and subsequent peripheral edema in the lower extremities. Strenuous physical activity should be avoided for 48 hours post-injection."
    
    # 3. Context from User's Google Calendar or chat (via Open Claw/Privacy Agent)
    lifestyle = "I am going to do heavy squats and a 5k run at the gym tomorrow."
    
    print("\n--- K2 Think V2 Reasoning Engine ---")
    print(f"Patient Intent: {lifestyle}")
    
    result = engine.run_analysis(protocol, lifestyle, high_weight_tokens)
    
    print("\n--- K2 Output (Logic Gates & Patient Comms) ---")
    print(json.dumps(result, indent=2))
