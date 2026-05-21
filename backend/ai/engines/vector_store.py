"""Semantic vector search — Sentence Transformers + FAISS with TF-IDF fallback."""

from __future__ import annotations

import os
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_st_model = None
_faiss_index = None
_faiss_docs: list[str] = []
_use_st = os.getenv('USE_SENTENCE_TRANSFORMERS', '1').lower() in ('1', 'true', 'yes')


def _load_st():
    global _st_model
    if _st_model is not None:
        return _st_model
    if not _use_st:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        _st_model = SentenceTransformer('all-MiniLM-L6-v2')
        return _st_model
    except Exception:
        return None


def _embed_texts(texts: list[str]) -> np.ndarray:
    model = _load_st()
    if model and texts:
        return np.array(model.encode(texts, show_progress_bar=False))
    vec = TfidfVectorizer(stop_words='english', max_features=4000, ngram_range=(1, 2))
    return vec.fit_transform(texts).toarray()


def build_index(documents: list[str]) -> dict[str, Any]:
    """Build FAISS index when available."""
    global _faiss_index, _faiss_docs
    _faiss_docs = [d for d in documents if d and d.strip()]
    if not _faiss_docs:
        return {'indexed': 0, 'engine': 'none'}

    embeddings = _embed_texts(_faiss_docs)
    try:
        import faiss
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1
        normalized = embeddings / norms
        index.add(normalized.astype('float32'))
        _faiss_index = index
        return {'indexed': len(_faiss_docs), 'engine': 'faiss+sentence-transformers' if _load_st() else 'faiss+tfidf'}
    except Exception:
        _faiss_index = None
        return {'indexed': len(_faiss_docs), 'engine': 'tfidf-cosine'}


def semantic_search(query: str, documents: list[str], top_k: int = 10) -> list[dict[str, Any]]:
    if not query or not documents:
        return []

    global _faiss_index, _faiss_docs
    if _faiss_index is not None and len(_faiss_docs) == len(documents):
        q_emb = _embed_texts([query])[0].astype('float32')
        norm = np.linalg.norm(q_emb) or 1
        q_emb = q_emb / norm
        scores, indices = _faiss_index.search(q_emb.reshape(1, -1), min(top_k, len(documents)))
        return [
            {'index': int(indices[0][i]), 'score': round(float(scores[0][i]) * 100, 2)}
            for i in range(len(indices[0]))
            if indices[0][i] >= 0
        ]

    vec = TfidfVectorizer(stop_words='english', max_features=4000, ngram_range=(1, 2))
    matrix = vec.fit_transform([query] + documents)
    sims = cosine_similarity(matrix[0:1], matrix[1:])[0]
    ranked = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)[:top_k]
    return [{'index': i, 'score': round(float(s) * 100, 2)} for i, s in ranked]
