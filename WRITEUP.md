# InSilico: Mechanistic Interpretability for AI-Driven Clinical Trial Simulation

**HackPrinceton Spring 2026 — Alignment & Mechanistic Interpretability Track**

---

## 1. Problem & Motivation

Clinical trials cost $2.6B+ per approved drug and fail 90% of the time, often because teams can't predict *which* patients will respond before spending real money on enrollment. AI models can forecast trial outcomes, but in high-stakes medical settings a black-box prediction is useless — and dangerous. The alignment question we asked is:

> **Can we build an AI trial-simulation system whose every prediction is mechanistically inspectable at the biomarker level, so that clinicians can audit *why* the model thinks a drug helps before a single patient is enrolled?**

This matters for alignment because medical AI is a domain where "the model said so" is not an acceptable answer. If we can't reverse-engineer the model's reasoning, we can't trust it — and we certainly can't deploy it.

---

## 2. Approach & Methodology

We built an end-to-end interpretable pipeline: **PDF → drug mechanism → potency score → synthetic patient simulation → per-biomarker SHAP explanation.**

**Data & models.** Trained a Random Forest diabetes-risk classifier on 250K real patients from the CDC BRFSS 2015 dataset (sampled to 10K for training), then used a TVAE (Tabular Variational Autoencoder) to generate privacy-preserving synthetic twins. Distributional fidelity was validated with KS-test and Wasserstein distance; disease prevalence matched within <1% (13.9% real vs 13.3% synthetic).

**Centroid Recovery algorithm (novel).** Instead of training a second model to predict drug response, we treat the health–disease spectrum as a vector space. We compute a *recovery vector* `r⃗ = μ_healthy − μ_diseased` in biomarker space, then apply a drug with potency γ as `patient_new = patient_old + γ · r⃗`. This is fully transparent: every simulated change in a patient's profile is a linear, inspectable transformation rather than an opaque forward pass.

**Gamma extraction via RAG.** A clinical trial PDF is chunked, embedded with Gemini, and stored in a per-request ChromaDB collection. Six targeted queries pull endpoint evidence (ΔHbA1c, weight delta, ΔSBP, RRR, trial metadata, mechanism). If ≥2 endpoints are recovered we plug them into a calibrated formula fit on 10 reference drugs (semaglutide, tirzepatide, metformin, etc.); otherwise we fall back to an LLM-guessed γ, clearly labeled `llm_guess` in the UI.

**SHAP interpretability layer.** Every simulated patient is re-scored by the Random Forest, and SHAP values decompose each risk change into per-biomarker contributions. This lets us answer "why did this patient's risk drop from 0.42 to 0.28?" with a quantitative attribution like `{BMI: −0.08, HighBP: −0.04, PhysActivity: −0.02}`.

---

## 3. Key Findings

**Finding 1 — SHAP attributions align with clinical intuition.** When we simulated weight-loss interventions, the dominant SHAP contributors were BMI, blood pressure, and physical activity — exactly the features clinicians expect to drive diabetes risk. The model's internal reasoning is not just accurate (~78% holdout accuracy) but *mechanistically sensible*. This is the central alignment result: the model's "why" matches the medical literature's "why."

**Finding 2 — Centroid Recovery produces monotonic, interpretable trajectories.** Increasing γ produces smooth, monotonic risk reductions per patient, with SHAP deltas that scale linearly with γ. There are no "jagged" or adversarial regions where a small drug-potency increase produces a counterintuitive risk spike. This is a strong interpretability property — the simulation engine doesn't hide surprises.

**Finding 3 — Synthetic twins preserve the SHAP structure of real patients.** We compared mean SHAP attributions on real BRFSS patients vs TVAE twins and found the feature-importance ranking is preserved. This means interpretability claims made on synthetic data transfer back to real-patient reasoning — a necessary condition for using synthetic cohorts in safety-critical research.

**Finding 4 (surprise / partial negative).** The RAG extractor fails gracefully but *frequently* on consent forms and protocol synopses, which use qualitative language ("rapid HbA1c reduction") with no numbers. The formula gate correctly skips them and falls back to LLM-guess γ, but this revealed that **~30% of real-world trial PDFs don't contain the quantitative endpoints our pipeline assumes.** The fallback is the right behavior, but the result is less interpretable, and we label it explicitly in the UI rather than hiding it.

**Finding 5 (dead end).** We initially tried training a second ML model to map MoA text → γ directly. It overfit badly on 10 reference drugs and produced non-monotonic outputs. We abandoned it in favor of the hand-calibrated formula, which is less flashy but auditable — a case where interpretability forced the simpler solution.

---

## 4. Problems Faced & Workarounds

- **Gemini rate limits.** Hit the free ceiling mid-testing. Workaround: backup paid key, plus a graceful-degradation path that falls back to LLM-guess γ and labels it.
- **Qualitative-only PDFs.** See Finding 4. We added explicit `formula` vs `llm_guess` provenance labels rather than silently mixing the two.
- **TVAE training instability on full 250K rows.** Sampled to 10K, re-validated distributional fidelity — no meaningful loss in KS-test or Wasserstein scores.
- **SHAP latency.** Full KernelSHAP on 720 patients was too slow for real-time demo. Switched to TreeSHAP, which is exact for Random Forest and ~100× faster (<1ms/patient).

---

## 5. Future Scope

- **Confidence intervals on γ.** Currently a point estimate. Bootstrap over RAG-extracted endpoint distributions would give calibrated uncertainty.
- **Mechanistic probing of the Random Forest.** Go beyond SHAP: identify decision-path *motifs* (recurring subtrees) that fire for responder vs non-responder patients. This would move the project from post-hoc attribution toward true circuit-level interpretability.
- **Adversarial robustness.** Test whether small, clinically implausible perturbations to a patient profile can flip a predicted responder to a non-responder. If so, the model is under-aligned with real medicine.
- **Auto-fit gamma coefficients** across a larger reference-drug library (currently hand-picked from 10).
- **Multi-arm trials, drug interactions, genomics** — all deliberately out of MVP scope.

---

## 6. Reproducibility

All code, notebooks, and model artifacts are in the GitHub repo. The core ML pipeline lives in `Hack_Princeton_final.ipynb`; the simulation engine in `insilico_simulation.py`; the RAG extractor in `backend/rag_pipeline.py`. Synthetic-patient validation plots and SHAP summary plots are reproducible end-to-end from the notebook given a `GEMINI_API_KEY`.

---

**TL;DR:** InSilico is a clinical-trial simulator where every prediction is decomposable into per-biomarker SHAP attributions, every drug effect is a linear transform in a biomarker vector space, and every fallback path is explicitly labeled. The alignment contribution is showing that a full PDF → γ → simulation → explanation pipeline can be built without any opaque step — and that the resulting explanations match clinical intuition.
