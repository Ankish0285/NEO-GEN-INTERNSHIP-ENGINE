"""AI student profile — career prediction, readiness, growth, memory."""

from __future__ import annotations

from typing import Any

from engines.ats_engine import analyze_ats
from engines.resume_parser import parse_resume
from engines.skills_db import CAREER_DOMAINS, COURSE_SUGGESTIONS

DOMAIN_TECH = {
    'web_development': ['React', 'Node.js', 'HTML/CSS', 'JavaScript', 'Next.js'],
    'ai_ml': ['Python', 'TensorFlow', 'ML pipelines', 'NLP', 'scikit-learn'],
    'data_science': ['SQL', 'Pandas', 'Visualization', 'Statistics', 'ETL'],
    'cybersecurity': ['Network security', 'Ethical hacking', 'SIEM', 'OWASP'],
    'cloud_computing': ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform'],
    'ui_ux': ['Figma', 'Wireframing', 'Prototyping', 'User research'],
    'devops': ['CI/CD', 'Docker', 'Linux', 'Monitoring', 'IaC'],
}


def predict_career_domain(skills: list[str]) -> dict[str, Any]:
    if not skills:
        return {'domain': 'general_technology', 'confidence': 40, 'scores': {}, 'label': 'Technology'}
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
    interests = interests or user_data.get('interests', [])

    parsed = parse_resume(resume_text or '')
    profile_skills = list(dict.fromkeys((user_data.get('skills') or []) + parsed['skills']))[:40]

    ats = analyze_ats(resume_text, 'internship software technology skills') if resume_text else {
        'ats_score': user_data.get('atsScore', 0),
        'breakdown': {},
        'missing_skills': [],
    }

    career = predict_career_domain(profile_skills)
    future_tech = DOMAIN_TECH.get(career['domain'], ['JavaScript', 'Cloud', 'Git'])[:5]

    strengths, weaknesses = [], []
    if len(profile_skills) >= 8:
        strengths.append('Broad technical skill coverage')
    if parsed.get('sections', {}).get('has_projects'):
        strengths.append('Documented project experience')
    if ats.get('ats_score', 0) >= 70:
        strengths.append('Strong ATS-ready resume')

    if len(profile_skills) < 5:
        weaknesses.append('Expand technical keywords on resume')
    if not parsed.get('sections', {}).get('has_experience'):
        weaknesses.append('Add structured experience section')
    if ats.get('ats_score', 0) < 55:
        weaknesses.append('ATS score needs improvement')

    employability = round(
        ats.get('ats_score', 50) * 0.35
        + min(100, len(profile_skills) * 5) * 0.25
        + career['confidence'] * 0.2
        + min(100, len(applications) * 4) * 0.2,
        2,
    )

    readiness = round(
        employability * 0.5
        + ats.get('ats_score', 0) * 0.35
        + min(100, len(profile_skills) * 4) * 0.15,
        2,
    )

    ats_history = user_data.get('ats_history', [])
    growth = 'stable'
    if len(ats_history) >= 2:
        if ats_history[-1] > ats_history[0]:
            growth = 'improving'
        elif ats_history[-1] < ats_history[0]:
            growth = 'declining'

    roadmap = [
        {'skill': s, 'priority': 'high', 'course': COURSE_SUGGESTIONS.get(s, f'Learn {s}')}
        for s in (ats.get('missing_skills') or [])[:6]
    ]

    summary = (
        f'{career["label"]} track candidate with {len(profile_skills)} skills, '
        f'ATS {ats.get("ats_score", 0)}%, employability {employability}%, '
        f'readiness {readiness}%. '
        + (f'Growth trend: {growth}.' if ats_history else '')
    )

    return {
        'skill_profile': profile_skills,
        'strongest_skills': profile_skills[:8],
        'weakest_areas': weaknesses,
        'soft_skills': parsed.get('soft_skills', []),
        'career_domain': career,
        'future_technologies': future_tech,
        'strengths': strengths[:6],
        'weaknesses': weaknesses[:6],
        'employability_score': employability,
        'internship_readiness_score': readiness,
        'profile_summary': summary,
        'growth_analysis': {
            'trend': growth,
            'applications_count': len(applications),
            'ats_history': ats_history[-5:] if ats_history else [ats.get('ats_score', 0)],
        },
        'recommended_career_path': [
            f'Focus on {career["label"]}',
            f'Learn: {", ".join(future_tech[:3])}',
            'Apply to AI-recommended internships',
            'Improve weak resume sections from ATS report',
        ],
        'ats_history_summary': {
            'latest_score': ats.get('ats_score', 0),
            'applications_count': len(applications),
        },
        'interests': interests,
        'learning_roadmap': roadmap,
        'education_signals': parsed.get('education', []),
        'education': parsed.get('education', []),
        'projects': parsed.get('projects', []),
        'achievements': parsed.get('achievements', []),
        'experience': parsed.get('experience', []),
        'course': user_data.get('course'),
        'university': user_data.get('university'),
        'preferredLocation': user_data.get('preferredLocation'),
        'academic_year': user_data.get('academic_year') or user_data.get('year'),
        'experience_years': parsed.get('experience_years', 0),
        'certifications': parsed.get('certifications', []),
        'projects_detected': parsed.get('projects_detected', 0),
    }
