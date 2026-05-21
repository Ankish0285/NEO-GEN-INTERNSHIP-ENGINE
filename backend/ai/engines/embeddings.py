"""Semantic similarity — TF-IDF + optional sentence-transformers."""

from __future__ import annotations

import os
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_transformer_model = None
_use_st = os.getenv('USE_SENTENCE_TRANSFORMERS', '').lower() in ('1', 'true', 'yes')


def _load_sentence_transformer():
    global _transformer_model
    if _transformer_model is not None:
        return _transformer_model
    if not _use_st:
        return None
    try:
        from sentence_transformers import SentenceTransformer
        _transformer_model = SentenceTransformer('all-MiniLM-L6-v2')
        return _transformer_model
    except Exception:
        return None


def semantic_similarity(text_a: str, text_b: str) -> float:
    """Return 0-100 semantic match score."""
    if not text_a or not text_b:
        return 0.0
    model = _load_sentence_transformer()
    if model:
        emb = model.encode([text_a, text_b])
        sim = float(cosine_similarity([emb[0]], [emb[1]])[0][0])
        return round(max(0, min(sim, 1)) * 100, 2)

    vec = TfidfVectorizer(stop_words='english', max_features=4000, ngram_range=(1, 2))
    matrix = vec.fit_transform([text_a, text_b])
    sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    return round(max(0, min(sim, 1)) * 100, 2)


def rank_by_similarity(query: str, documents: list[str], top_k: int = 10) -> list[tuple[int, float]]:
    """Vector search — returns [(index, score_percent), ...]."""
    if not query or not documents:
        return []
    model = _load_sentence_transformer()
    if model:
        q_emb = model.encode([query])
        d_emb = model.encode(documents)
        sims = cosine_similarity(q_emb, d_emb)[0]
        ranked = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)[:top_k]
        return [(i, round(float(s) * 100, 2)) for i, s in ranked]

    vec = TfidfVectorizer(stop_words='english', max_features=4000, ngram_range=(1, 2))
    matrix = vec.fit_transform([query] + documents)
    sims = cosine_similarity(matrix[0:1], matrix[1:])[0]
    ranked = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)[:top_k]
    return [(i, round(float(s) * 100, 2)) for i, s in ranked]
