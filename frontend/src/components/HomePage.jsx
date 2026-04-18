export default function HomePage({ onNavigate }) {
  return (
    <div className="home-page">
      {/* ── hero section ── */}
      <section className="home-hero">
        <div className="home-hero__glow" />
        <img
          src="/images/hero-medical-ai.png"
          alt="AI-powered medical visualization"
          className="home-hero__img"
        />
        <div className="home-hero__content">
          <div className="home-hero__badge">
            <span className="pulse-dot" />
            Accelerating Clinical Discovery
          </div>
          <h1 className="home-hero__title">
            Where <span className="gradient-text">AI</span> meets
            <br />
            clinical trials
          </h1>
          <p className="home-hero__subtitle">
            TrialForge uses digital twin technology and machine-learning-driven gamma scoring
            to simulate how patients respond to investigational therapies — <em>before</em> a
            single dose is administered.
          </p>
          <div className="home-hero__actions">
            <button
              type="button"
              className="cta-button"
              id="cta-get-started"
              onClick={() => onNavigate("upload")}
            >
              Get Started
              <span className="cta-arrow">→</span>
            </button>
            <button
              type="button"
              className="cta-button cta-button--outline"
              id="cta-patient-input"
              onClick={() => onNavigate("patient")}
            >
              Patient Input
            </button>
          </div>
        </div>
      </section>

      {/* ── stats ribbon ── */}
      <section className="stats-ribbon">
        <div className="stat-item">
          <strong className="stat-value gradient-text">92%</strong>
          <span className="stat-label">Prediction Accuracy</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <strong className="stat-value gradient-text">12×</strong>
          <span className="stat-label">Faster Trial Screening</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <strong className="stat-value gradient-text">$2.1M</strong>
          <span className="stat-label">Avg. Cost Savings</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <strong className="stat-value gradient-text">10K+</strong>
          <span className="stat-label">Patients Modeled</span>
        </div>
      </section>

      {/* ── how it works ── */}
      <section className="home-section">
        <h2 className="home-section__title">How It Works</h2>
        <p className="home-section__subtitle">
          Three simple steps from patient data to actionable trial insights
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">📋</div>
            <h3>Upload Medical Data</h3>
            <p>
              Input drug mechanism-of-action profiles and gamma impact scores that describe how an
              investigational therapy is expected to modify patient biomarkers.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🧬</div>
            <h3>Define Patient Profile</h3>
            <p>
              Enter BRFSS-style patient characteristics — blood pressure, BMI, activity levels, and
              more — to create a high-fidelity digital baseline twin.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">📊</div>
            <h3>Simulate &amp; Compare</h3>
            <p>
              TrialForge generates a gamma-adjusted trial twin and compares predicted outcomes
              against the untreated baseline, surfacing explainable risk deltas.
            </p>
          </div>
        </div>
      </section>

      {/* ── digital twin showcase ── */}
      <section className="twin-showcase">
        <div className="twin-showcase__text">
          <h2>Digital Twin <span className="gradient-text">Technology</span></h2>
          <p>
            Every patient profile is cloned into a counterfactual "trial twin" whose biomarkers are
            adjusted by the drug's expected mechanism of action. The model then compares both
            trajectories to surface meaningful risk deltas — giving researchers an evidence-backed
            preview of potential trial outcomes.
          </p>
          <ul className="twin-showcase__list">
            <li><span className="check-icon">✓</span> Gamma-adjusted counterfactual modeling</li>
            <li><span className="check-icon">✓</span> Feature-level explainability</li>
            <li><span className="check-icon">✓</span> Real-time risk comparison</li>
            <li><span className="check-icon">✓</span> Privacy-first local inference</li>
          </ul>
        </div>
        <div className="twin-showcase__img-wrap">
          <img
            src="/images/digital-twin.png"
            alt="Digital twin visualization showing two connected patient models"
            className="twin-showcase__img"
          />
        </div>
      </section>

      {/* ── feature highlights ── */}
      <section className="home-section">
        <h2 className="home-section__title">Why TrialForge?</h2>
        <p className="home-section__subtitle">
          Purpose-built for researchers, pharma teams, and clinician-scientists
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔬</div>
            <h3>Digital Twin Engine</h3>
            <p>
              Each patient profile is cloned into a counterfactual "trial twin" whose features are
              adjusted by the drug's expected mechanism of action.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Gamma Scoring</h3>
            <p>
              A single 0–1 impact coefficient that captures drug potency, letting you sweep
              scenarios from no-effect to maximum therapeutic response.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Explainable AI</h3>
            <p>
              Feature-importance bars and delta tables show exactly which biomarkers drove the
              model's prediction — no black-box guesswork.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Privacy-First</h3>
            <p>
              All inference runs locally in-browser or on your own backend. Patient data never
              leaves your environment.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="cta-banner">
        <div className="cta-banner__glow" />
        <h2>Ready to simulate your first trial?</h2>
        <p>Upload a drug profile and see TrialForge in action — no signup required.</p>
        <button
          type="button"
          className="cta-button"
          id="cta-bottom"
          onClick={() => onNavigate("upload")}
        >
          Launch Simulator
          <span className="cta-arrow">→</span>
        </button>
      </section>
    </div>
  );
}
