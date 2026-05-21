"""Hybrid ATS scoring: semantic + keyword + section quality."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import joblib

from engines.embeddings import semantic_similarity
from engines.resume_parser import parse_resume
from engines.skills_db import COURSE_SUGGESTIONS, TECHNICAL_SKILLS

_ML_MODEL = None
_ML_VECTORIZER = None


def _load_ml():
    global _ML_MODEL, _ML_VECTORIZER
    if _ML_MODEL is not None:
        return _ML_MODEL, _ML_VECTORIZER
    base = Path(__file__).resolve().parent.parent / 'models'
    model_path = base / 'ats_model.pkl'
    vec_path = base / 'tfidf.pkl'
    if model_path.exists() and vec_path.exists():
        try:
            _ML_MODEL = joblib.load(model_path)
            _ML_VECTORIZER = joblib.load(vec_path)
        except Exception:
            pass
    return _ML_MODEL, _ML_VECTORIZER


def _keyword_analysis(resume_text: str, job_text: str) -> dict[str, Any]:
    resume_lower = resume_text.lower()
    job_lower = job_text.lower()
    jd_skills = [s for s in TECHNICAL_SKILLS if s in job_lower]
    if not jd_skills:
        jd_skills = [w for w in job_lower.split() if len(w) > 3][:30]

    matched, missing = [], []
    for s in jd_skills:
        if s in resume_lower:
            matched.append(s)
        else:
            missing.append(s)

    pct = (len(matched) / len(jd_skills) * 100) if jd_skills else 50
    return {
        'matched_skills': matched[:25],
        'missing_skills': missing[:15],
        'keyword_match_percentage': round(pct, 2),
    }


def analyze_ats(resume_text: str, job_description: str = '') -> dict[str, Any]:
    job_text = job_description or 'software engineering internship technical skills programming projects'
    parsed = parse_resume(resume_text)
    kw = _keyword_analysis(resume_text, job_text)
    semantic = semantic_similarity(resume_text, job_text)

    ml_score = None
    model, vectorizer = _load_ml()
    if model and vectorizer:
        try:
            combined = resume_text + ' ' + job_text
            vec = vectorizer.transform([combined])
            pred = float(model.predict(vec)[0])
            ml_score = pred * 100 if pred <= 1 else min(pred, 100)
        except Exception:
            ml_score = None

    sections = parsed['sections']
    section_scores = {
        'technical': min(100, len(parsed['skills']) * 8),
        'soft_skills': min(100, len(parsed['soft_skills']) * 15),
        'experience': min(100, parsed['experience_years'] * 25 + parsed['projects_detected'] * 5),
        'education': 90 if sections.get('has_education') else 40,
        'formatting': max(40, 100 - len(parsed['formatting_issues']) * 15),
        'contact': 100 if sections.get('has_contact') else 30,
        'completeness': sum([
            20 if sections.get('has_summary') else 0,
            25 if sections.get('has_experience') else 0,
            20 if sections.get('has_education') else 0,
            20 if sections.get('has_skills') else 0,
            15 if sections.get('has_projects') else 0,
        ]),
    }

    weighted = (
        semantic * 0.25
        + kw['keyword_match_percentage'] * 0.30
        + section_scores['technical'] * 0.15
        + section_scores['experience'] * 0.10
        + section_scores['completeness'] * 0.10
        + section_scores['formatting'] * 0.10
    )
    if ml_score is not None:
        ats_score = round(weighted * 0.6 + ml_score * 0.4, 2)
    else:
        ats_score = round(weighted, 2)

    tips = []
    for skill in kw['missing_skills'][:5]:
        course = COURSE_SUGGESTIONS.get(skill, f'Learn {skill} via industry courses')
        tips.append(f'Add or highlight "{skill}" — {course}')
    tips.extend(parsed['formatting_issues'][:3])
    if ats_score < 60:
        tips.append('Tailor your resume keywords to match the internship description.')
    if not tips:
        tips.append('Strong ATS alignment — keep quantifying achievements.')

    confidence = round(min(98, 70 + len(parsed['skills']) * 2 + semantic * 0.1), 2)

    return {
        'ats_score': ats_score,
        'match_percentage': round((semantic + kw['keyword_match_percentage']) / 2, 2),
        'keyword_match_percentage': kw['keyword_match_percentage'],
        'semantic_similarity': semantic,
        'ml_score': round(ml_score, 2) if ml_score else None,
        'matched_skills': kw['matched_skills'],
        'missing_skills': kw['missing_skills'],
        'breakdown': section_scores,
        'sections': sections,
        'formatting_issues': parsed['formatting_issues'],
        'weak_sections': [
            k for k, v in section_scores.items() if v < 55
        ],
        'improvement_tips': tips[:8],
        'resume_analysis': parsed,
        'ai_confidence_score': confidence,
    }
