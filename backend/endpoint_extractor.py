from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, Optional

import google.generativeai as genai


EXTRACTION_MODEL = "gemini-2.0-flash"

EXTRACTION_PROMPT = """You are a clinical-trial analyst. Given the excerpts below from a trial document, extract measurable endpoints as a JSON object.

Return ONLY this JSON shape, no prose:

{
  "drug_name": "short name",
  "moa_summary": "2-3 sentence mechanism of action grounded in the excerpts",
  "expected_biomarker_effect": "2-3 sentence description of the measured biomarker changes with numbers",
  "target_condition": "diabetes, obesity, cardiovascular, etc.",
  "endpoints": {
    "delta_hba1c_percent": <number or null>,
    "delta_weight_kg": <number or null>,
    "delta_weight_percent": <number or null>,
    "delta_sbp_mmhg": <number or null>,
    "relative_risk_reduction": <number 0-1 or null>,
    "trial_duration_weeks": <number or null>
  },
  "evidence_quotes": ["short verbatim quote 1", "short verbatim quote 2"]
}

Rules:
- All deltas use the convention: NEGATIVE = improvement (e.g., HbA1c drop of 1.5 percentage points -> -1.5).
- relative_risk_reduction is a FRACTION (0-1): 28% RRR -> 0.28.
- If a value is not reported, return null. Do not guess.
- evidence_quotes: 2-4 short verbatim snippets (< 25 words each) from the excerpts that support the numbers.
- If the document is not about diabetes, still fill target_condition and extract any cardiometabolic deltas present.

Excerpts:
<<<
{context}
>>>
"""


class ExtractionError(RuntimeError):
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
            raise ExtractionError(f"Model did not return JSON: {text[:200]}")
        return json.loads(match.group(0))


def _coerce_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def extract_endpoints(context_block: str) -> Dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ExtractionError("GEMINI_API_KEY is not set.")
    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        EXTRACTION_MODEL,
        generation_config={"response_mime_type": "application/json"},
    )

    prompt = EXTRACTION_PROMPT.replace("{context}", context_block[:120_000])
    response = model.generate_content(prompt)

    if not getattr(response, "text", None):
        raise ExtractionError("Gemini returned an empty response.")

    data = _parse_json(response.text)

    endpoints_raw = data.get("endpoints") or {}
    endpoints = {
        "delta_hba1c_percent": _coerce_number(endpoints_raw.get("delta_hba1c_percent")),
        "delta_weight_kg": _coerce_number(endpoints_raw.get("delta_weight_kg")),
        "delta_weight_percent": _coerce_number(endpoints_raw.get("delta_weight_percent")),
        "delta_sbp_mmhg": _coerce_number(endpoints_raw.get("delta_sbp_mmhg")),
        "relative_risk_reduction": _coerce_number(endpoints_raw.get("relative_risk_reduction")),
        "trial_duration_weeks": _coerce_number(endpoints_raw.get("trial_duration_weeks")),
    }

    quotes = data.get("evidence_quotes") or []
    if not isinstance(quotes, list):
        quotes = []
    quotes = [str(q).strip() for q in quotes if str(q).strip()][:4]

    return {
        "drug_name": str(data.get("drug_name", "Unknown drug")).strip() or "Unknown drug",
        "moa_summary": str(data.get("moa_summary", "")).strip(),
        "expected_biomarker_effect": str(data.get("expected_biomarker_effect", "")).strip(),
        "target_condition": str(data.get("target_condition", "diabetes")).strip() or "diabetes",
        "endpoints": endpoints,
        "evidence_quotes": quotes,
    }
