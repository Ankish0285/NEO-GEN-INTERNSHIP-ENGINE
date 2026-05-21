"""AI student profile & career prediction."""

from __future__ import annotations

from typing import Any

from engines.ats_engine import analyze_ats
from engines.resume_parser import parse_resume
from engines.skills_db import CAREER_DOMAINS, COURSE_SUGGESTIONS


def predict_career_domain(skills: list[str]) -> dict[str, Any]:
    if not skills:
        return {'domain': 'general_technology', 'confidence': 40, 'scores': {}}
    lower = [s.lower() for s in skills]
    scores = {}
    for domain, keywords in CAREER_DOMAINS.items():
        hits = sum(1 for k in keywords if any(k in s or s in k for s in lower))
        scores[domain] = hits
    best = max(scores, key=scores.get)
    total = sum(scores.values()) or 1
    confidence = round(min(95, (scores[best] / total) * 100 + 30), 2)
    label = best.replace('_', ' ').title()
    return {'domain': best, 'label': label, 'confidence': confidence, 'scores': scores}


def build_student_profile(
    resume_text: str,
    user_data: dict | None = None,
    applications: list | None = None,
    interests: list | None = None,
) -> dict[str, Any]:
    user_data = user_data or {}
    applications = applications or []
    interests = interests or []

    parsed = parse_resume(resume_text or '')
    profile_skills = list(dict.fromkeys(
        (user_data.get('skills') or []) + parsed['skills']
    ))[:40]

    ats = analyze_ats(resume_text, 'internship software technology skills') if resume_text else {
        'ats_score': user_data.get('atsScore', 0),
        'breakdown': {},
        'missing_skills': [],
    }

    career = predict_career_domain(profile_skills)
    strengths = []
    weaknesses = []

    if len(profile_skills) >= 8:
        strengths.append('Broad technical skill coverage')
    if parsed['sections'].get('has_projects'):
        strengths.append('Documented project experience')
    if ats.get('ats_score', 0) >= 70:
        strengths.append('Strong ATS-ready resume structure')

    if len(profile_skills) < 5:
        weaknesses.append('Limited skills listed — expand technical keywords')
    if not parsed['sections'].get('has_experience'):
        weaknesses.append('Missing structured experience section')
    if ats.get('ats_score', 0) < 55:
        weaknesses.append('Resume needs ATS optimization')

    employability = round(
        ats.get('ats_score', 50) * 0.4
        + min(100, len(profile_skills) * 6) * 0.25
        + career['confidence'] * 0.2
        + min(100, len(applications) * 5) * 0.15,
        2,
    )

    roadmap = []
    for skill in (ats.get('missing_skills') or [])[:5]:
        roadmap.append({
            'skill': skill,
            'priority': 'high',
            'course': COURSE_SUGGESTIONS.get(skill, f'Upskill in {skill}'),
        })

    return {
        'skill_profile': profile_skills,
        'soft_skills': parsed.get('soft_skills', []),
        'career_domain': career,
        'strengths': strengths[:6],
        'weaknesses': weaknesses[:6],
        'employability_score': employability,
        'recommended_career_path': [
            career['label'],
            'Build portfolio projects in ' + career['label'],
            'Target internships matching your top skills',
        ],
        'ats_history_summary': {
            'latest_score': ats.get('ats_score', 0),
            'applications_count': len(applications),
        },
        'interests': interests,
        'learning_roadmap': roadmap,
        'education_signals': parsed.get('education', []),
        'experience_years': parsed.get('experience_years', 0),
    }
