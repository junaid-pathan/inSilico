import { useRef, useState } from "react";

import { api } from "../api";

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

const MOA_KEYS = [
  "drug_name",
  "moa_summary",
  "expected_biomarker_effect",
  "gamma",
  "reasoning_brief",
];

function pickMoaFields(parsed) {
  return {
    drug_name: parsed.drug_name ?? "",
    moa_summary: parsed.moa_summary ?? "",
    expected_biomarker_effect: parsed.expected_biomarker_effect ?? "",
    gamma: typeof parsed.gamma === "number" ? parsed.gamma : 0.3,
    reasoning_brief: parsed.reasoning_brief ?? "",
  };
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(digits);
}

function EvidencePanel({ parsed }) {
  if (!parsed) return null;

  const evidence = parsed.evidence;
  const isFormula = parsed.mode === "pdf_formula";

  return (
    <div className="evidence-panel">
      <div className="evidence-header">
        <strong>Extraction mode:</strong>{" "}
        <span className={isFormula ? "mode-pill mode-pill--ok" : "mode-pill mode-pill--warn"}>
          {isFormula ? "calibrated formula" : "LLM guess"}
        </span>
        {parsed.fallback_reason ? (
          <span className="mode-reason"> ({parsed.fallback_reason})</span>
        ) : null}
      </div>

      {evidence?.endpoints_extracted ? (
        <div className="evidence-section">
          <strong>Extracted endpoints</strong>
          <ul className="evidence-list">
            <li>ΔHbA1c (%): {formatNumber(evidence.endpoints_extracted.delta_hba1c_percent)}</li>
            <li>ΔWeight (kg): {formatNumber(evidence.endpoints_extracted.delta_weight_kg, 1)}</li>
            <li>ΔWeight (%): {formatNumber(evidence.endpoints_extracted.delta_weight_percent, 1)}</li>
            <li>ΔSBP (mmHg): {formatNumber(evidence.endpoints_extracted.delta_sbp_mmhg, 1)}</li>
            <li>
              Relative risk reduction:{" "}
              {formatNumber(evidence.endpoints_extracted.relative_risk_reduction, 2)}
            </li>
            <li>
              Trial duration (weeks):{" "}
              {formatNumber(evidence.endpoints_extracted.trial_duration_weeks, 0)}
            </li>
          </ul>
        </div>
      ) : null}

      {evidence?.contributions ? (
        <div className="evidence-section">
          <strong>Gamma contributions (weighted)</strong>
          <ul className="evidence-list">
            {Object.entries(evidence.contributions).map(([key, value]) => (
              <li key={key}>
                {key}: {formatNumber(value, 3)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {evidence?.evidence_quotes?.length ? (
        <div className="evidence-section">
          <strong>Supporting quotes</strong>
          <ul className="evidence-list evidence-list--quotes">
            {evidence.evidence_quotes.map((quote, idx) => (
              <li key={idx}>“{quote}”</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evidence?.retrieved_chunks?.length ? (
        <details className="evidence-section">
          <summary>
            <strong>Retrieved chunks ({evidence.retrieved_chunks.length})</strong>
          </summary>
          <ul className="evidence-list evidence-list--chunks">
            {evidence.retrieved_chunks.map((chunk, idx) => (
              <li key={idx}>
                <em>{chunk.label}</em>: {chunk.preview}
                {chunk.preview && chunk.preview.length >= 240 ? "…" : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export default function DrugComposer({ moa, onChange, onLoadDemo }) {
  const fileInputRef = useRef(null);
  const [pdfStatus, setPdfStatus] = useState({ state: "idle", message: "" });
  const [lastParsed, setLastParsed] = useState(null);

  async function handlePdfUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfStatus({ state: "loading", message: `Parsing ${file.name}...` });
    setLastParsed(null);

    try {
      const parsed = await api.parseTrialPdf(file);
      if (parsed?.error) {
        setPdfStatus({ state: "error", message: parsed.detail ?? "Backend error" });
        console.error("Backend error detail:", parsed);
        return;
      }
      onLoadDemo(pickMoaFields(parsed));
      setLastParsed(parsed);
      const modeLabel = parsed.mode === "pdf_formula" ? "formula" : "LLM guess";
      setPdfStatus({
        state: "ok",
        message: `Extracted "${parsed.drug_name}" — gamma ${Number(parsed.gamma ?? 0).toFixed(2)} (${modeLabel})`,
      });
    } catch (err) {
      setPdfStatus({ state: "error", message: err.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="form-grid">
      <div className="preset-row">
        <button
          type="button"
          className="primary-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pdfStatus.state === "loading"}
        >
          {pdfStatus.state === "loading" ? "Parsing PDF..." : "Upload trial PDF"}
        </button>
        <button type="button" className="secondary-button" onClick={() => onLoadDemo(demoDrugOptions.glp1)}>
          Load GLP-1 demo
        </button>
        <button type="button" className="secondary-button" onClick={() => onLoadDemo(demoDrugOptions.lifestyle)}>
          Load lifestyle demo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={handlePdfUpload}
        />
      </div>

      {pdfStatus.message ? (
        <p className={`pdf-status pdf-status--${pdfStatus.state}`}>{pdfStatus.message}</p>
      ) : null}

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

      <EvidencePanel parsed={lastParsed} />
    </div>
  );
}

export { MOA_KEYS };
