from __future__ import annotations

import io
import os
import uuid
from dataclasses import dataclass
from typing import Dict, List, Sequence

import chromadb
import google.generativeai as genai
from pypdf import PdfReader


EMBEDDING_MODEL = "models/gemini-embedding-001"

ENDPOINT_QUERIES: Dict[str, str] = {
    "hba1c": "HbA1c glycated hemoglobin reduction percentage points change from baseline primary endpoint",
    "weight": "body weight loss kilograms percent change from baseline body mass index BMI",
    "blood_pressure": "systolic diastolic blood pressure change millimeters mercury cardiovascular",
    "risk_reduction": "relative risk reduction diabetes incidence hazard ratio prevention outcome",
    "trial_meta": "trial duration weeks patient population sample size inclusion criteria indication",
    "mechanism": "mechanism of action pharmacology how the drug works target pathway",
}


@dataclass
class RetrievedEvidence:
    chunks: List[Dict[str, str]]
    query_hits: Dict[str, List[int]]

    def as_context_block(self) -> str:
        lines = []
        for idx, chunk in enumerate(self.chunks):
            label = chunk.get("label", f"chunk {idx}")
            text = chunk.get("text", "")
            lines.append(f"[{label}]\n{text}")
        return "\n\n---\n\n".join(lines)


class RagError(RuntimeError):
    pass


def _ensure_gemini_configured() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RagError("GEMINI_API_KEY is not set on the backend environment.")
    genai.configure(api_key=api_key)


def extract_pdf_pages(pdf_bytes: bytes) -> List[str]:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages: List[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        pages.append(text.strip())
    return pages


def chunk_pages(pages: Sequence[str], target_words: int = 350) -> List[Dict[str, str]]:
    """Split each page into ~target_words chunks while keeping page provenance."""
    chunks: List[Dict[str, str]] = []
    for page_idx, page_text in enumerate(pages):
        if not page_text:
            continue
        words = page_text.split()
        if len(words) <= target_words:
            chunks.append(
                {
                    "text": page_text,
                    "page": str(page_idx + 1),
                    "label": f"page {page_idx + 1}",
                }
            )
            continue
        start = 0
        part = 0
        while start < len(words):
            end = min(start + target_words, len(words))
            slice_text = " ".join(words[start:end])
            part += 1
            chunks.append(
                {
                    "text": slice_text,
                    "page": str(page_idx + 1),
                    "label": f"page {page_idx + 1} part {part}",
                }
            )
            start = end
    return chunks


def _embed_batch(texts: Sequence[str], task_type: str) -> List[List[float]]:
    embeddings: List[List[float]] = []
    for text in texts:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type=task_type,
        )
        embedding = result.get("embedding") if isinstance(result, dict) else getattr(result, "embedding", None)
        if embedding is None:
            raise RagError("Gemini embedding response missing 'embedding' field.")
        embeddings.append(list(embedding))
    return embeddings


def build_vector_store(chunks: Sequence[Dict[str, str]]) -> chromadb.api.models.Collection.Collection:
    if not chunks:
        raise RagError("No text chunks extracted from the PDF.")

    client = chromadb.EphemeralClient()
    collection = client.create_collection(name=f"trial_{uuid.uuid4().hex[:8]}")

    texts = [chunk["text"] for chunk in chunks]
    embeddings = _embed_batch(texts, task_type="retrieval_document")

    ids = [f"chunk_{idx}" for idx in range(len(chunks))]
    metadatas = [{"page": chunk["page"], "label": chunk["label"]} for chunk in chunks]

    collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    return collection


def retrieve_evidence(
    collection: chromadb.api.models.Collection.Collection,
    queries: Dict[str, str] = ENDPOINT_QUERIES,
    top_k: int = 3,
) -> RetrievedEvidence:
    query_texts = list(queries.values())
    query_keys = list(queries.keys())
    query_embeddings = _embed_batch(query_texts, task_type="retrieval_query")

    results = collection.query(
        query_embeddings=query_embeddings,
        n_results=top_k,
    )

    seen: Dict[str, Dict[str, str]] = {}
    query_hits: Dict[str, List[int]] = {key: [] for key in query_keys}

    for q_idx, key in enumerate(query_keys):
        ids = results.get("ids", [[]])[q_idx]
        documents = results.get("documents", [[]])[q_idx]
        metadatas = results.get("metadatas", [[]])[q_idx]
        for chunk_id, doc, meta in zip(ids, documents, metadatas):
            if chunk_id not in seen:
                seen[chunk_id] = {
                    "id": chunk_id,
                    "text": doc,
                    "label": meta.get("label", chunk_id),
                    "page": meta.get("page", "?"),
                }
            query_hits[key].append(list(seen.keys()).index(chunk_id))

    chunks = list(seen.values())
    return RetrievedEvidence(chunks=chunks, query_hits=query_hits)


def run_rag_over_pdf(pdf_bytes: bytes, top_k: int = 3) -> RetrievedEvidence:
    _ensure_gemini_configured()
    pages = extract_pdf_pages(pdf_bytes)
    if not any(pages):
        raise RagError("PDF appears to contain no extractable text.")
    chunks = chunk_pages(pages)
    collection = build_vector_store(chunks)
    return retrieve_evidence(collection, top_k=top_k)
