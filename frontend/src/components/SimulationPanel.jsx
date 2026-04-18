function MetricCard({ label, value, tone = "default" }) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FeatureDeltaTable({ deltas }) {
  return (
    <div className="delta-table">
      {deltas.map((delta) => (
        <div key={delta.feature} className="delta-row">
          <div>
            <strong>{delta.feature}</strong>
            <span>
              {delta.baseline.toFixed(2)} to {delta.trial_twin.toFixed(2)}
            </span>
          </div>
          <span className={delta.delta <= 0 ? "delta-good" : "delta-bad"}>
            {delta.delta > 0 ? "+" : ""}
            {delta.delta.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ExplainabilityBars({ importances }) {
  return (
    <div className="bar-list">
      {Object.entries(importances).map(([feature, importance]) => (
        <div key={feature} className="bar-row">
          <span>{feature}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${importance * 100}%` }} />
          </div>
          <strong>{importance.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function SimulationPanel({ result }) {
  if (!result) {
    return (
      <div className="empty-state">
        <h3>Run a simulation</h3>
        <p>TrialForge will compare the baseline patient to a gamma-adjusted trial twin once you submit the form.</p>
      </div>
    );
  }

  const improvement = result.predicted_improvement;

  return (
    <div className="result-stack">
      <div className="metric-grid">
        <MetricCard label="Mode" value={result.mode} />
        <MetricCard label="Baseline risk" value={`${(result.baseline_score * 100).toFixed(1)}%`} />
        <MetricCard label="Trial twin risk" value={`${(result.trial_score * 100).toFixed(1)}%`} tone="good" />
        <MetricCard
          label="Predicted improvement"
          value={`${(improvement * 100).toFixed(1)} pts`}
          tone={improvement >= 0 ? "good" : "warn"}
        />
        <MetricCard label="Gamma" value={result.gamma.toFixed(2)} />
      </div>

      <div className="chart-card">
        <div className="chart-bar">
          <span>Baseline</span>
          <div className="chart-track">
            <div className="chart-fill chart-fill--baseline" style={{ width: `${result.baseline_score * 100}%` }} />
          </div>
          <strong>{(result.baseline_score * 100).toFixed(1)}%</strong>
        </div>
        <div className="chart-bar">
          <span>Trial twin</span>
          <div className="chart-track">
            <div className="chart-fill chart-fill--trial" style={{ width: `${result.trial_score * 100}%` }} />
          </div>
          <strong>{(result.trial_score * 100).toFixed(1)}%</strong>
        </div>
      </div>

      <div className="two-column">
        <div className="sub-card">
          <h3>Changed features</h3>
          <FeatureDeltaTable deltas={result.feature_deltas} />
        </div>

        <div className="sub-card">
          <h3>Explainability</h3>
          <p>{result.explanation_summary}</p>
          <ExplainabilityBars importances={result.feature_importances} />
        </div>
      </div>
    </div>
  );
}
