# InSilico

## What it is

You upload a clinical trial PDF. We pull the drug's expected effects out of it,
turn those into a single number (gamma, between 0 and 1), and run the drug
against 720 simulated patients. Takes about 30 seconds.

The output is a cohort response: how many of those 720 patients responded,
partially responded, didn't respond, or got worse, plus per-patient
explainability for the risk shift.

## Why

Drug trials are slow and expensive and most of them fail. People want a fast
answer to "what would this drug probably do to a cohort like ours" before they
spend real money. The two ingredients that make this possible now are LLMs that
can read trial PDFs, and synthetic data generators that preserve real
correlations. Both are cheap. We glued them together.

## Who's this for

Mostly pharma analysts doing early go/no-go decisions, and clinical researchers
who want a quick "what if" without involving a biostatistician. For the
hackathon, also judges who want to see that the system works end-to-end
instead of mocking the hard parts.

## What we're building

The pipeline has six pieces.

The PDF goes in, gets chunked, embedded with Gemini, and stored in a per-request
ChromaDB collection. We run six targeted queries against it (HbA1c, weight, BP,
RRR, trial metadata, mechanism) and pull the relevant chunks. Gemini reads
those chunks and tries to extract the actual measured numbers.

If at least two of the four key endpoints (ΔHbA1c, weight delta, ΔSBP, RRR)
came out, we plug them into a calibrated formula and compute gamma. The
coefficients were hand-picked from 10 reference drugs (semaglutide, tirzepatide,
metformin, etc.). Not auto-fit, that's post-MVP.

If fewer than two endpoints showed up, we fall back to giving Gemini the whole
PDF and asking for a gamma directly. The response gets labelled `llm_guess` so
the UI can flag it.

That gamma drives a TVAE-trained synthetic patient generator. We sample 720
twins around the input patient profile, apply gamma to each, score baseline
and post-drug risk via a RandomForest, and bucket the responses. SHAP runs on
top for per-patient explainability.

## What we're not doing

No regulatory work. No real EHR data; we're using BRFSS 2015, which is
self-reported. No multi-arm trials. No drug interactions. No genomics. No
auth or billing. All future stuff.

## Target performance

End-to-end under 35 seconds for a 50-page PDF. Backend shouldn't 5xx on a valid
upload, fallbacks are explicit, not hidden. Free Gemini tier covers
hackathon-scale use.

## Risks during the demo

Two things can go wrong. Gemini might rate-limit us, we already hit the free
ceiling once during testing. Backup paid key on standby and the system
gracefully degrades to the LLM-guess path if extraction fails.

The other one is that someone uploads a consent form or protocol synopsis,
which usually has only qualitative language ("rapid HbA1c reduction") and no
numbers. The formula gate skips them by design and falls back. That's the
right behaviour but the labels need to make it obvious that's what happened.

## Stack

FastAPI backend with Pydantic, scikit-learn, SDV (TVAE), SHAP, ChromaDB,
google-generativeai. Next.js 15 frontend. CDC BRFSS 2015 (253k patients,
sampled to 10k for training). Both `risk_model.joblib` and the simulation
bundle come out of the notebook.

## Open

Should gamma carry a confidence interval? Should HbA1c be required rather than
optional in the formula gate? Cohort size is hardcoded at 720, worth exposing
as a knob? Worth thinking about, none of it's blocking.
