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
    moa_summary: "Combines diet adherence and activity changes to reduce diabetes risk.",
    expected_biomarker_effect: "Better activity profile, lower weight burden, improved general health markers.",
    gamma: 0.28,
    reasoning_brief: "Moderate but broad effect across behavior-linked features.",
  },
};

export default function DrugComposer({ moa, onChange, onLoadDemo }) {
  return (
    <div className="form-grid">
      <div className="preset-row">
        <button type="button" className="secondary-button" onClick={() => onLoadDemo(demoDrugOptions.glp1)}>
          Load GLP-1 demo
        </button>
        <button type="button" className="secondary-button" onClick={() => onLoadDemo(demoDrugOptions.lifestyle)}>
          Load lifestyle demo
        </button>
      </div>

      <label className="field field--wide">
        <span>Drug name</span>
        <input value={moa.drug_name} onChange={(event) => onChange("drug_name", event.target.value)} />
      </label>

      <label className="field field--wide">
        <span>Mechanism of action summary</span>
        <textarea value={moa.moa_summary} onChange={(event) => onChange("moa_summary", event.target.value)} />
      </label>

      <label className="field field--wide">
        <span>Expected biomarker effect</span>
        <textarea
          value={moa.expected_biomarker_effect}
          onChange={(event) => onChange("expected_biomarker_effect", event.target.value)}
        />
      </label>

      <label className="field">
        <span>Gamma impact score</span>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={moa.gamma}
          onChange={(event) => onChange("gamma", Number(event.target.value))}
        />
      </label>

      <label className="field field--wide">
        <span>Reasoning brief</span>
        <textarea
          value={moa.reasoning_brief}
          onChange={(event) => onChange("reasoning_brief", event.target.value)}
        />
      </label>
    </div>
  );
}
