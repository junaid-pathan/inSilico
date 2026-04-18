const demoDrugOptions = {
  glp1: {
    drug_name: "GLP-1 Demo",
    moa_summary: "Improves glucose control and supports weight loss through appetite regulation.",
    expected_biomarker_effect: "Lower fasting glucose, lower BMI, improved cardiometabolic burden.",
    gamma: 0.42,
    reasoning_brief: "Strong effect due to combined glycemic control and weight reduction.",
  },
  lifestyle: {
    drug_name: "Lifestyle Intensification Demo",
    moa_summary: "Combines diet adherence and activity changes to reduce critical disease risk.",
    expected_biomarker_effect: "Better activity profile, lower weight burden, improved general health markers.",
    gamma: 0.28,
    reasoning_brief: "Moderate but broad effect across behavior-linked features.",
  },
};

export default function DrugComposer({ moa, onChange, onLoadDemo }) {
  return (
    <>
      <div className="preset-row" style={{ marginBottom: "24px" }}>
        <button type="button" className="secondary-button" onClick={() => onLoadDemo(demoDrugOptions.glp1)}>
          Load GLP-1 pattern
        </button>
        <button type="button" className="secondary-button" onClick={() => onLoadDemo(demoDrugOptions.lifestyle)}>
          Load lifestyle intervention
        </button>
      </div>

      <div className="form-grid">
        <h3 className="form-section-title">
          <span>💊</span> Identification
        </h3>
        
        <label className="field field--wide">
          <span>Investigational Drug / Therapy Name</span>
          <input 
            value={moa.drug_name} 
            onChange={(event) => onChange("drug_name", event.target.value)} 
            placeholder="e.g., Semaglutide 2.4mg"
          />
        </label>

        <h3 className="form-section-title" style={{ marginTop: "12px" }}>
          <span>🧬</span> Mechanism of Action (MoA)
        </h3>

        <label className="field field--wide">
          <span>Clinical Mechanism Summary</span>
          <textarea 
            value={moa.moa_summary} 
            onChange={(event) => onChange("moa_summary", event.target.value)} 
            placeholder="Describe the primary pathways activated or inhibited..."
          />
        </label>

        <label className="field field--wide">
          <span>Expected Biomarker Effects</span>
          <textarea
            value={moa.expected_biomarker_effect}
            onChange={(event) => onChange("expected_biomarker_effect", event.target.value)}
            placeholder="Which specific BRFSS indicators will shift? (e.g., BMI, HighBP)"
          />
        </label>

        <h3 className="form-section-title" style={{ marginTop: "12px" }}>
          <span>🧮</span> Prognostic Parameters
        </h3>

        <label className="field field--wide">
          <span>Reasoning Brief</span>
          <textarea
            value={moa.reasoning_brief}
            onChange={(event) => onChange("reasoning_brief", event.target.value)}
            placeholder="Justification for the chosen gamma impact score..."
          />
        </label>

        <label className="field">
          <span>Gamma Impact Score (0.00 – 1.00)</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={moa.gamma}
            onChange={(event) => onChange("gamma", Number(event.target.value))}
          />
        </label>
      </div>
    </>
  );
}
