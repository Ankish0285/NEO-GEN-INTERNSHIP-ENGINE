"""Optional LLM extraction with a strict, evidence-only fallback contract."""

from __future__ import annotations

import json
import re
from typing import Any

from llm.adapter import get_llm_adapter


LIST_FIELDS = ('skills', 'projects', 'education', 'certifications', 'achievements', 'experience')


def _json_object(raw: str) -> dict[str, Any] | None:
    cleaned = (raw or '').strip()
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', cleaned, flags=re.I)
    try:
        value = json.loads(cleaned)
    except (TypeError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def extract_resume_evidence(resume_text: str, fallback: dict[str, Any]) -> dict[str, Any]:
    """Ask a configured LLM for evidence only; preserve deterministic fallback on failure."""
    adapter = get_llm_adapter()
    if adapter.provider == 'builtin' or not resume_text.strip():
        return fallback

    system = (
        'Extract only facts explicitly present in the resume. Never infer or invent. '
        'Return JSON only with skills, projects, education, certifications, achievements, '
        'and experience arrays. Use [] when a section is absent.'
    )
    user = json.dumps({'resume_text': resume_text}, ensure_ascii=True)
    try:
        extracted = _json_object(adapter.generate(system, user, {}))
    except Exception:
        return fallback
    if not extracted:
        return fallback

    merged = dict(fallback)
    for field in LIST_FIELDS:
        value = extracted.get(field)
        if isinstance(value, list):
            merged[field] = value
    merged['extraction_provider'] = adapter.provider
    merged['extraction_confidence'] = 'medium'
    return merged
