const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function post(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed for ${path}`);
  }

  return response.json();
}

export async function scorePatient(patient) {
  return post("/score-patient", { patient });
}

export async function simulateTrial(patient, moa) {
  return post("/simulate-trial", { patient, moa });
}

export async function parseTrialPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/parse-trial-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "PDF parse failed";
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(detail);
  }

  return response.json();
}
