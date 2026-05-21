"""Selection probability & interview prediction engine."""

from __future__ import annotations

from typing import Any


def predict_selection(
    match_percentage: float,
    ats_score: float,
    skill_match_pct: float,
    resume_quality: float,
    competition_count: int = 0,
    experience_years: float = 0,
    employability: float = 50,
) -> dict[str, Any]:
    competition_penalty = min(25, competition_count * 0.8)
    base = (
        match_percentage * 0.30
        + ats_score * 0.25
        + skill_match_pct * 0.20
        + resume_quality * 0.15
        + min(100, employability) * 0.10
    )
    experience_boost = min(12, experience_years * 4)
    selection_probability = max(5, min(95, base - competition_penalty + experience_boost))
    interview_probability = round(min(92, selection_probability * 0.92 + ats_score * 0.05), 2)
    hiring_confidence = round(
        (selection_probability * 0.6 + interview_probability * 0.4) * (1 - competition_penalty / 200),
        2,
    )
    tier = 'high' if selection_probability >= 70 else 'medium' if selection_probability >= 45 else 'low'
    return {
        'selection_probability': round(selection_probability, 2),
        'interview_probability': interview_probability,
        'hiring_confidence': round(max(0, min(100, hiring_confidence)), 2),
        'competition_impact': round(competition_penalty, 2),
        'selection_tier': tier,
    }
