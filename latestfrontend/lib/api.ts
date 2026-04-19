const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function scorePatient(patient: any) {
  const res = await fetch(`${API_BASE_URL}/score-patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient })
  });
  if (!res.ok) throw new Error("Failed to score patient");
  return res.json();
}

export async function simulateTrial(patient: any, moa: any) {
  const res = await fetch(`${API_BASE_URL}/simulate-trial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient, moa })
  });
  if (!res.ok) throw new Error("Failed to simulate trial");
  return res.json();
}

export async function parseTrialPdf(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/parse-trial-pdf`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) throw new Error("Failed to parse trial pdf");
  const data = await res.json();
  if (data.error) {
    throw new Error(data.detail || "Error parsing PDF");
  }
  return data;
}
