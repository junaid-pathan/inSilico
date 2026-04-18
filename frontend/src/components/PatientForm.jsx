const labels = {
  HighBP: "High blood pressure",
  HighChol: "High cholesterol",
  BMI: "BMI",
  Smoker: "Smoker",
  PhysActivity: "Physical activity",
  Fruits: "Fruit intake",
  Veggies: "Vegetable intake",
  DiffWalk: "Difficulty walking",
  GenHlth: "General health (1-5)",
  PhysHlth: "Poor physical health days",
  MentHlth: "Poor mental health days",
  Age: "Age bucket (1-13)",
};

const binaryFields = new Set(["HighBP", "HighChol", "Smoker", "PhysActivity", "Fruits", "Veggies", "DiffWalk"]);

const ranges = {
  BMI: { min: 16, max: 55, step: 0.1 },
  GenHlth: { min: 1, max: 5, step: 1 },
  PhysHlth: { min: 0, max: 30, step: 1 },
  MentHlth: { min: 0, max: 30, step: 1 },
  Age: { min: 1, max: 13, step: 1 },
};

export default function PatientForm({ patient, onChange, onLoadPreset }) {
  return (
    <div className="form-grid">
      <div className="preset-row">
        <button type="button" className="secondary-button" onClick={() => onLoadPreset("highRisk")}>
          Load high-risk demo patient
        </button>
        <button type="button" className="secondary-button" onClick={() => onLoadPreset("moderateRisk")}>
          Load moderate-risk patient
        </button>
      </div>

      {Object.entries(patient).map(([field, value]) => {
        if (binaryFields.has(field)) {
          return (
            <label key={field} className="field">
              <span>{labels[field]}</span>
              <select value={value} onChange={(event) => onChange(field, Number(event.target.value))}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </label>
          );
        }

        const range = ranges[field];
        return (
          <label key={field} className="field">
            <span>{labels[field]}</span>
            <input
              type="number"
              min={range.min}
              max={range.max}
              step={range.step}
              value={value}
              onChange={(event) => onChange(field, Number(event.target.value))}
            />
          </label>
        );
      })}
    </div>
  );
}
