"""Full NeoGen AI intelligence orchestrator."""

from __future__ import annotations

from typing import Any

from engines.ats_engine import analyze_ats
from engines.chat_engine import chat_response
from engines.profile_engine import build_student_profile
from engines.recommendation_engine import recommend_internships
from engines.vector_store import build_index


def build_full_intelligence(
    resume_text: str,
    internships: list[dict],
    user_data: dict | None = None,
    applications: list | None = None,
    memory: dict | None = None,
    top_k: int = 15,
) -> dict[str, Any]:
    memory = memory or {}
    user_data = {**(user_data or {}), **memory.get('preferences', {})}
    if memory.get('interests'):
        user_data['interests'] = memory['interests']
    if memory.get('past_ats_scores'):
        user_data['ats_history'] = memory['past_ats_scores']

    docs = [
        ' '.join([
            str(j.get('title', '')),
            str(j.get('description', '')),
            ' '.join(j.get('skills', []) or []),
        ])
        for j in internships
    ]
    index_meta = build_index(docs) if docs else {'indexed': 0}

    ats = analyze_ats(resume_text, '') if resume_text else {}
    profile = build_student_profile(resume_text, user_data, applications, user_data.get('interests', []))
    recs = recommend_internships(
        resume_text, internships, user_data, applications, top_k,
        ats_result=ats,
        profile=profile,
    )

    return {
        'ats': ats,
        'profile': profile,
        'recommendations': recs.get('recommendations', []),
        'recommendation_groups': recs.get('groups', {}),
        'student_profile': profile,
        'vector_index': index_meta,
        'memory_applied': bool(memory),
        'ai_version': '2.0',
    }


def chat_with_intelligence(message: str, intelligence: dict[str, Any]) -> dict[str, Any]:
    return chat_response(message, _build_chat_context(intelligence))


def _build_chat_context(intelligence: dict[str, Any]) -> dict[str, Any]:
    ats = intelligence.get('ats') or {}
    profile = intelligence.get('profile') or {}
    recs = intelligence.get('recommendations') or []
    groups = intelligence.get('recommendation_groups') or {}
    return {
        'ats_score': ats.get('ats_score', 0),
        'skills': profile.get('skill_profile', []),
        'career_domain': profile.get('career_domain', {}).get('label', 'Technology'),
        'missing_skills': ats.get('missing_skills', []),
        'employability_score': profile.get('employability_score', 0),
        'internship_readiness': profile.get('internship_readiness_score', 0),
        'top_internships': [r.get('title') for r in recs[:3]],
        'best_match': [r.get('title') for r in groups.get('best_match', [])[:2]],
        'easiest': [r.get('title') for r in groups.get('easiest_selection', [])[:2]],
        'weak_sections': ats.get('weak_sections', []),
        'why_low': ats.get('why_score_is_low', []),
        'learning_roadmap': profile.get('learning_roadmap', []),
    }
