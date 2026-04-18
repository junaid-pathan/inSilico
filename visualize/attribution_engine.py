import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

class AttributionEngine:
    """
    The 'Word-to-Wound' Attribution Mapper.
    Uses a lightweight glass-box model (like DistilBERT) to identify exactly 
    which words in a clinical text trigger a specific risk warning.
    
    """
    def __init__(self, model_name="distilbert-base-uncased"):
        # For a hackathon, we load a base or clinical-specific model.
        # In a real scenario, this would be fine-tuned on clinical risks.
        print(f"Loading glass-box model: {model_name}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        # We ensure output_attentions=True to extract our 'Saliency Map'
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name, 
            output_attentions=True
        )

    def generate_saliency_map(self, text, risk_category="Peripheral Edema"):
        """
        Calculates token-level importance (saliency) to prove WHY a risk was flagged.
        """
        inputs = self.tokenizer(text, return_tensors="pt")
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # Get attention weights from the last layer to represent 'focus'
        # Shape: (batch_size, num_heads, sequence_length, sequence_length)
        attentions = outputs.attentions[-1] 
        
        # Average attention across all heads for the [CLS] token (index 0) 
        # to see what words the model focused on for the final classification.
        cls_attention = attentions[0, :, 0, :].mean(dim=0)
        
        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        
        # Map tokens to their attention weights (saliency scores)
        saliency_map = []
        for token, score in zip(tokens, cls_attention):
            # Filter out special tokens
            if token not in ['[CLS]', '[SEP]', '[PAD]']:
                saliency_map.append({
                    "token": token.replace('##', ''), # Clean subwords
                    "weight": round(score.item(), 4)
                })
                
        # Sort by highest weight to find the "smoking gun" jargon
        saliency_map = sorted(saliency_map, key=lambda x: x['weight'], reverse=True)
        
        return {
            "risk_flagged": risk_category,
            "source_text": text,
            "top_attributions": saliency_map[:5] # Top 5 highest-weight words
        }

if __name__ == "__main__":
    # Test the Attribution Engine
    engine = AttributionEngine()
    
    # Example excerpt from a Regeneron-style clinical protocol
    sample_clinical_text = "Patients receiving the subcutaneous injection may experience localized swelling, fluid retention, and subsequent peripheral edema in the lower extremities."
    
    print("\nRunning Attribution Mapping...")
    results = engine.generate_saliency_map(sample_clinical_text)
    
    print(f"\n[Risk Flagged]: {results['risk_flagged']}")
    print("Top Words Triggering this Risk (The 'Proof'):")
    for item in results['top_attributions']:
        print(f" - Word: '{item['token']}' | Importance Score: {item['weight']}")
    
    print("\nNext Step: Feed these top words into K2 Think V2 to explain them to the patient.")
