from __future__ import annotations

import json
import os
import re
from typing import Any, Dict

import google.generativeai as genai

from backend.endpoint_extractor import ExtractionError, extract_endpoints
from backend.gamma_formula import compute_gamma, have_enough_signal
from backend.rag_pipeline import RagError, RetrievedEvidence, run_rag_over_pdf


FALLBACK_MODEL = "gemini-2.0-flash"

FALLBACK_PROMPT = """You are a clinical-trial analyst. The attached PDF is a trial document.

Return ONLY this JSON (no markdown fences, no prose):

{
  "drug_name": "...",
  "moa_summary": "...",
  "expected_biomarker_effect": "...",
  "gamma": <float 0.0-1.0>,
  "reasoning_brief": "...",
  "target_condition": "..."
}

Gamma rubric:
- 0.05-0.15 weak/indirect
- 0.20-0.35 moderate (e.g., metformin, DPP lifestyle)
- 0.35-0.55 strong combined effect (e.g., GLP-1 agonists)
- 0.55-0.75 very strong multi-pathway (e.g., tirzepatide, bariatric)
- 0.75-0.90 near-curative
"""


class PdfParseError(RuntimeError):
    pass


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text


def _parse_json(text: str) -> Dict[str, Any]:
    text = _strip_fences(text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise PdfParseError(f"Model did not return JSON: {text[:200]}")
        return json.loads(match.group(0))


def _build_reasoning_brief(gamma_info: Dict[str, Any]) -> str:
    deltas = ", ".join(gamma_info.get("reported_deltas") or []) or "no measurable deltas"
    top = sorted(gamma_info["contributions"].items(), key=lambda kv: kv[1], reverse=True)
    top_driver = top[0][0] if top and top[0][1] > 0 else "mixed factors"
    return (
        f"Gamma {gamma_info['gamma']:.2f} computed from measured endpoints: {deltas}. "
        f"Largest contribution: {top_driver}. "
        f"Formula version {gamma_info.get('coefficients_version', 'n/a')}."
    )


def _llm_guess_fallback(pdf_bytes: bytes, reason: str) -> Dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise PdfParseError("GEMINI_API_KEY is not set.")
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        FALLBACK_MODEL,
        generation_config={"response_mime_type": "application/json"},
    )
    response = model.generate_content(
        [
            {"mime_type": "application/pdf", "data": pdf_bytes},
            FALLBACK_PROMPT,
        ]
    )
    if not getattr(response, "text", None):
        raise PdfParseError("Gemini fallback returned an empty response.")

    data = _parse_json(response.text)

    gamma = data.get("gamma")
    try:
        gamma_value = float(gamma) if gamma is not None else None
    except (TypeError, ValueError):
        gamma_value = None
    if gamma_value is not None:
        gamma_value = max(0.05, min(0.85, gamma_value))

    return {
        "drug_name": str(data.get("drug_name", "Unknown drug")).strip() or "Unknown drug",
        "moa_summary": str(data.get("moa_summary", "")).strip(),
        "expected_biomarker_effect": str(data.get("expected_biomarker_effect", "")).strip(),
        "gamma": gamma_value,
        "reasoning_brief": str(data.get("reasoning_brief", "")).strip(),
        "source_type": "pdf_parse",
        "target_condition": str(data.get("target_condition", "diabetes")).strip() or "diabetes",
        "mode": "llm_guess",
        "fallback_reason": reason,
        "evidence": None,
    }


def parse_trial_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    RAG + quantitative pipeline:
      1) Chunk PDF, embed with Gemini, retrieve targeted chunks via ChromaDB.
      2) Ask Gemini to extract measured endpoints from the retrieved context.
      3) Apply calibrated formula to compute gamma.
      4) Fall back to LLM-guess gamma if extraction signal is insufficient.
    """
    try:
        evidence: RetrievedEvidence = run_rag_over_pdf(pdf_bytes)
    except RagError as exc:
        return _llm_guess_fallback(pdf_bytes, reason=f"rag_failed: {exc}")

    try:
        extracted = extract_endpoints(evidence.as_context_block())
    except ExtractionError as exc:
        return _llm_guess_fallback(pdf_bytes, reason=f"extraction_failed: {exc}")

    endpoints = extracted.get("endpoints") or {}

    if not have_enough_signal(endpoints):
        fallback = _llm_guess_fallback(pdf_bytes, reason="insufficient_endpoint_signal")
        fallback["evidence"] = {
            "retrieved_chunks": [
                {"label": c.get("label"), "page": c.get("page"), "preview": c.get("text", "")[:240]}
                for c in evidence.chunks
            ],
            "endpoints_extracted": endpoints,
            "evidence_quotes": extracted.get("evidence_quotes") or [],
        }
        return fallback

    gamma_info = compute_gamma(endpoints)

    reasoning = _build_reasoning_brief(gamma_info)

    return {
        "drug_name": extracted.get("drug_name") or "Unknown drug",
        "moa_summary": extracted.get("moa_summary", ""),
        "expected_biomarker_effect": extracted.get("expected_biomarker_effect", ""),
        "gamma": gamma_info["gamma"],
        "reasoning_brief": reasoning,
        "source_type": "pdf_parse",
        "target_condition": extracted.get("target_condition", "diabetes"),
        "mode": "pdf_formula",
        "fallback_reason": None,
        "evidence": {
            "retrieved_chunks": [
                {"label": c.get("label"), "page": c.get("page"), "preview": c.get("text", "")[:240]}
                for c in evidence.chunks
            ],
            "query_hits": evidence.query_hits,
            "endpoints_extracted": endpoints,
            "evidence_quotes": extracted.get("evidence_quotes") or [],
            "contributions": gamma_info["contributions"],
            "normalized": gamma_info["normalized"],
            "coefficients_version": gamma_info["coefficients_version"],
        },
    }
