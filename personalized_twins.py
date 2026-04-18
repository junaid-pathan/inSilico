"""Personalized Digital Twin generator for TrialForge.

Given a trained SDV ``TVAESynthesizer`` and a single patient's features, this
module maps the patient into the TVAE latent space and generates N twin
variations by perturbing their latent coordinates with Gaussian noise.

The twins preserve the patient's identity (age, sex, history) while varying
the uncertain biological reactions, producing a personal probability map of
outcomes that can power the visualize/ UI.
"""
from __future__ import annotations

from typing import Union

import numpy as np
import pandas as pd
import torch
from torch.nn import functional as F


class PersonalizedTwinGenerator:
    """Generates personalized digital twins via TVAE latent perturbation."""

    def __init__(self, synthesizer):
        self.synthesizer = synthesizer
        self._tvae = synthesizer._model
        self._transformer = self._tvae.transformer
        self._encoder = self._tvae.encoder
        self._decoder = self._tvae.decoder
        self._data_processor = synthesizer._data_processor
        self._device = next(self._encoder.parameters()).device
        self._encoder.eval()
        self._decoder.eval()

    def _preprocess(self, patient_df: pd.DataFrame) -> np.ndarray:
        processed = self._data_processor.transform(patient_df)
        arr = self._transformer.transform(processed)
        return arr.astype(np.float32)

    def encode(self, patient_df: pd.DataFrame):
        """Map patient features to latent coordinates ``(mu, std)``."""
        arr = self._preprocess(patient_df)
        x = torch.from_numpy(arr).to(self._device)
        with torch.no_grad():
            mu, std, _ = self._encoder(x)
        return mu.cpu().numpy(), std.cpu().numpy()

    def _apply_activations(self, rec: torch.Tensor) -> torch.Tensor:
        activated = []
        cursor = 0
        for col_info in self._transformer.output_info_list:
            for span in col_info:
                end = cursor + span.dim
                chunk = rec[:, cursor:end]
                if span.activation_fn == "tanh":
                    activated.append(torch.tanh(chunk))
                elif span.activation_fn == "softmax":
                    activated.append(F.softmax(chunk, dim=-1))
                else:
                    activated.append(chunk)
                cursor = end
        return torch.cat(activated, dim=1)

    def generate_twins(
        self,
        patient: Union[dict, pd.DataFrame],
        n_twins: int = 100,
        noise_scale: float = 0.1,
        seed: Union[int, None] = None,
    ) -> pd.DataFrame:
        """Generate ``n_twins`` variations of the given patient.

        noise_scale controls how tightly the twins cluster around the patient:
        ~0.05 for "very similar" twins, ~0.3 for broader what-if exploration.
        """
        patient_df = pd.DataFrame([patient]) if isinstance(patient, dict) else patient.copy()

        mu, std = self.encode(patient_df)
        rng = np.random.default_rng(seed)
        noise = rng.standard_normal((n_twins, mu.shape[1])).astype(np.float32)
        z = mu + noise_scale * noise * std

        z_tensor = torch.from_numpy(z).to(self._device)
        with torch.no_grad():
            rec, _sigma = self._decoder(z_tensor)
            rec = self._apply_activations(rec)

        inversed = self._transformer.inverse_transform(rec.cpu().numpy(), sigmas=None)
        return self._data_processor.reverse_transform(inversed)


def risk_probability_map(
    twins_df: pd.DataFrame,
    classifier,
    target_col: str = "target",
) -> dict:
    """Run twins through a fitted classifier and summarise the risk distribution."""
    features = twins_df.drop(columns=[target_col], errors="ignore")
    proba = classifier.predict_proba(features)[:, 1]
    return {
        "n_twins": int(len(proba)),
        "mean_risk": float(proba.mean()),
        "median_risk": float(np.median(proba)),
        "pct_at_risk": float((proba > 0.5).mean() * 100),
        "p10": float(np.percentile(proba, 10)),
        "p90": float(np.percentile(proba, 90)),
        "risk_scores": proba.tolist(),
    }
