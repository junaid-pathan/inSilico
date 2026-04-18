import { useState } from "react";

/* ── FAQ data organised by category ── */
const faqCategories = [
  {
    category: "Getting Started",
    icon: "🚀",
    items: [
      {
        q: "What is TrialForge?",
        a: "TrialForge is an AI-powered clinical trial simulation platform that creates digital twins of patients to predict how they might respond to investigational therapies before actual dosing begins.",
      },
      {
        q: "How do I run my first simulation?",
        a: "Head to Upload Medical Data to load or create a drug profile, then visit Patient Input to enter patient data. Click \"Simulate trial\" to generate a side-by-side baseline vs. trial-twin comparison.",
      },
    ],
  },
  {
    category: "Core Concepts",
    icon: "🧬",
    items: [
      {
        q: "What is a digital twin?",
        a: "A digital twin is a virtual replica of a patient's health profile. TrialForge clones the patient's baseline data and applies the drug's expected mechanism of action (MoA) to create a counterfactual \"trial twin\" for comparison.",
      },
      {
        q: "What is a gamma score?",
        a: "Gamma is a single 0–1 coefficient representing the expected potency of a drug intervention. A gamma of 0 means no effect; a gamma of 1 means the maximum possible therapeutic impact on the patient's biomarkers.",
      },
      {
        q: "What is a Mechanism of Action (MoA)?",
        a: "An MoA describes how a drug produces its therapeutic effect — for example, by lowering blood glucose or reducing appetite. TrialForge uses this description to determine which patient biomarkers the drug would affect.",
      },
    ],
  },
  {
    category: "Data & Privacy",
    icon: "🛡️",
    items: [
      {
        q: "What data format does the patient input use?",
        a: "TrialForge accepts BRFSS-style patient profiles including blood pressure status, cholesterol, BMI, smoking status, physical activity, fruit/vegetable intake, difficulty walking, general health rating, and age bucket.",
      },
      {
        q: "Is my patient data stored anywhere?",
        a: "No. All inference runs locally in your browser or on your own self-hosted backend. Patient data never leaves your environment — privacy is a core design principle.",
      },
      {
        q: "Can I upload my own drug profiles?",
        a: "Yes. The Upload Medical Data page lets you define custom drug names, MoA summaries, expected biomarker effects, gamma scores, and reasoning briefs.",
      },
    ],
  },
  {
    category: "Results & Accuracy",
    icon: "📊",
    items: [
      {
        q: "How accurate are the predictions?",
        a: "The underlying prognostic model achieves ~92% accuracy on baseline clinical indicator datasets. However, predictions are intended for research and screening purposes, not clinical decision-making.",
      },
      {
        q: "What does the simulation result show?",
        a: "The result displays the baseline risk score, the trial-twin risk score, predicted improvement, a gamma value, feature-level deltas, and explainability bars showing which biomarkers drove the model's prediction.",
      },
      {
        q: "What do the explainability bars mean?",
        a: "Each bar shows how strongly a particular biomarker influenced the model's risk prediction. Longer bars indicate higher feature importance — helping researchers understand which factors matter most.",
      },
    ],
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className={`faq-item${isOpen ? " faq-item--open" : ""}`}>
      <button
        type="button"
        className="faq-question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="faq-question__text">{item.q}</span>
        <span className={`faq-chevron${isOpen ? " faq-chevron--open" : ""}`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      <div className={`faq-answer-wrap${isOpen ? " faq-answer-wrap--open" : ""}`}>
        <p className="faq-answer">{item.a}</p>
      </div>
    </div>
  );
}

function FaqCategory({ category }) {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <div className="faq-category">
      <div className="faq-category__header">
        <span className="faq-category__icon">{category.icon}</span>
        <h3 className="faq-category__title">{category.category}</h3>
      </div>
      <div className="faq-category__items">
        {category.items.map((item, i) => (
          <FaqItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </div>
  );
}

export default function HelpCenter() {
  return (
    <div className="help-page">
      {/* ── header ── */}
      <section className="help-hero">
        <div className="help-hero__glow" />
        <div className="help-hero__content">
          <h1>Help Center</h1>
          <p>
            Everything you need to know about using TrialForge — from uploading drug
            data to interpreting simulation results.
          </p>
        </div>
      </section>

      {/* ── quick links ── */}
      <section className="help-grid">
        <div className="help-card">
          <div className="help-card__icon">🚀</div>
          <h3>Getting Started</h3>
          <p>
            Head to <strong>Upload Medical Data</strong> to load or create a drug profile, then
            visit <strong>Patient Input</strong> to enter a patient and run a simulation.
          </p>
        </div>
        <div className="help-card">
          <div className="help-card__icon">📋</div>
          <h3>Drug Profiles</h3>
          <p>
            Each profile needs a drug name, MoA summary, expected biomarker effects, a gamma
            impact score (0–1), and a brief reasoning statement.
          </p>
        </div>
        <div className="help-card">
          <div className="help-card__icon">🧬</div>
          <h3>Patient Fields</h3>
          <p>
            Fields follow the BRFSS survey format: binary toggles (e.g., high BP, smoker) and
            numeric ranges (BMI, general health 1–5, age bucket 1–13).
          </p>
        </div>
        <div className="help-card">
          <div className="help-card__icon">📊</div>
          <h3>Reading Results</h3>
          <p>
            Baseline vs. trial-twin risk scores show predicted improvement. Feature deltas and
            explainability bars reveal which biomarkers mattered most.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="help-faq">
        <div className="help-faq__header">
          <h2>Frequently Asked Questions</h2>
          <p className="help-faq__subtitle">
            Browse by category or click any question to expand the answer
          </p>
        </div>
        <div className="faq-categories">
          {faqCategories.map((cat, i) => (
            <FaqCategory key={i} category={cat} />
          ))}
        </div>
      </section>

      {/* ── contact ── */}
      <section className="help-contact">
        <h2>Still need help?</h2>
        <p>
          Reach out to our team — we're happy to walk you through any part of the platform.
        </p>
        <a href="mailto:support@trialforge.ai" className="cta-button" id="help-contact-btn">
          Contact Support
          <span className="cta-arrow">→</span>
        </a>
      </section>
    </div>
  );
}
