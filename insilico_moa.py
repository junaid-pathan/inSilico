from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, Optional


@dataclass
class DrugMoAInput:
    """Structured trial input shared by the notebook, backend, and frontend."""

    drug_name: str
    moa_summary: str
    expected_biomarker_effect: str = ""
    gamma: Optional[float] = None
    reasoning_brief: str = ""
    source_type: str = "manual"
    target_condition: str = "diabetes"

    def resolved_gamma(self, default_gamma: float = 0.30) -> float:
        """Return a bounded impact score for the intervention."""
        if self.gamma is not None:
            return max(0.0, min(1.0, float(self.gamma)))
        return estimate_demo_gamma(self, default_gamma=default_gamma)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "DrugMoAInput":
        return cls(
            drug_name=str(payload.get("drug_name", "Demo Drug")),
            moa_summary=str(payload.get("moa_summary", "Mock intervention summary.")),
            expected_biomarker_effect=str(payload.get("expected_biomarker_effect", "")),
            gamma=payload.get("gamma"),
            reasoning_brief=str(payload.get("reasoning_brief", "")),
            source_type=str(payload.get("source_type", "manual")),
            target_condition=str(payload.get("target_condition", "diabetes")),
        )


def estimate_demo_gamma(moa_info: DrugMoAInput, default_gamma: float = 0.30) -> float:
    """
    Heuristic impact-score estimator for the prototype.

    This keeps the interface stable until a PDF parser / retrieval / reasoning
    pipeline can produce a structured gamma value.
    """
    text = " ".join(
        [
            moa_info.drug_name,
            moa_info.moa_summary,
            moa_info.expected_biomarker_effect,
            moa_info.reasoning_brief,
        ]
    ).lower()

    gamma = default_gamma

    keyword_weights = {
        "weight loss": 0.12,
        "glucose": 0.10,
        "a1c": 0.10,
        "insulin sensitivity": 0.10,
        "anti-inflammatory": 0.06,
        "exercise mimetic": 0.08,
        "appetite": 0.05,
        "blood pressure": 0.03,
        "cardiometabolic": 0.07,
        "renal protection": 0.04,
    }

    for keyword, delta in keyword_weights.items():
        if keyword in text:
            gamma += delta

    return max(0.05, min(0.85, gamma))


DEMO_MOA_LIBRARY = [
    DrugMoAInput(
        drug_name="GLP-1 Demo",
        moa_summary="Improves glucose control and supports weight loss through appetite regulation.",
        expected_biomarker_effect="Lower fasting glucose, modest BMI reduction, reduced cardiometabolic burden.",
        gamma=0.42,
        reasoning_brief="Strongest effect comes from glycemic control plus weight reduction.",
        source_type="demo",
    ),
    DrugMoAInput(
        drug_name="Lifestyle Intensification Demo",
        moa_summary="Combines diet adherence and activity improvement to reduce diabetes risk.",
        expected_biomarker_effect="Better activity profile, lower weight burden, improved general health markers.",
        gamma=0.28,
        reasoning_brief="Moderate but broad effect across multiple lifestyle-linked features.",
        source_type="demo",
    ),
]
