"""Advanced resume intelligence — sections, grammar, projects, certifications."""

from __future__ import annotations

import re
from typing import Any


def _grammar_score(text: str) -> tuple[float, list[str]]:
    issues = []
    if not text:
        return 0, ['No text to analyze']
    sentences = re.split(r'[.!?]+', text)
    long_sents = [s for s in sentences if len(s.split()) > 35]
    if long_sents:
        issues.append('Some sentences are too long — break them for readability.')
    words = text.lower().split()
    if len(words) > 10:
        repeats = {w for w in set(words) if words.count(w) > 8 and len(w) > 4}
        if repeats:
            issues.append(f'Reduce repetition of words: {", ".join(list(repeats)[:3])}')
    if not re.search(r'[\.\!\?]', text):
        issues.append('Add proper punctuation for professional formatting.')
    score = max(35, 100 - len(issues) * 18 - len(long_sents) * 5)
    return round(score, 2), issues


def _project_quality(text: str, projects_detected: int) -> tuple[float, str]:
    proj_keywords = len(re.findall(r'\b(built|developed|implemented|designed|created|deployed)\b', text, re.I))
    if projects_detected >= 2 or proj_keywords >= 3:
        return 85, 'Strong project signals with action verbs.'
    if projects_detected >= 1 or proj_keywords >= 1:
        return 65, 'Add metrics and tech stack to each project.'
    return 40, 'Include 2–3 projects with outcomes and technologies used.'


def _certification_score(text: str, certs: list) -> tuple[float, str]:
    if certs or re.search(r'\b(certified|certification|certificate|aws|azure|google cloud)\b', text, re.I):
        return 88, 'Certifications strengthen your profile.'
    return 50, 'Add relevant certifications (AWS, Google, Coursera, etc.).'


def _achievement_score(text: str) -> tuple[float, list[str]]:
    metrics = re.findall(r'\b\d+%|\b\d+\+?\s*(users|projects|clients|students)|increased|reduced|improved', text, re.I)
    tips = []
    score = 55
    if len(metrics) >= 2:
        score = 90
    elif len(metrics) >= 1:
        score = 72
    else:
        tips.append('Quantify achievements (%, numbers, impact) for stronger ATS impact.')
    return score, tips


def _communication_score(soft_skills: list, text: str) -> float:
    comm_words = ['communication', 'presentation', 'teamwork', 'leadership', 'collaboration']
    hits = sum(1 for w in comm_words if w in text.lower() or any(w in s for s in soft_skills))
    return min(100, 50 + hits * 15)


def enrich_ats_analysis(base: dict[str, Any], resume_text: str) -> dict[str, Any]:
    """Add advanced layer on top of base ATS result."""
    parsed = base.get('resume_analysis') or {}
    sections = base.get('breakdown') or {}
    grammar_score, grammar_issues = _grammar_score(resume_text)
    proj_score, proj_note = _project_quality(resume_text, parsed.get('projects_detected', 0))
    cert_score, cert_note = _certification_score(resume_text, parsed.get('certifications', []))
    ach_score, ach_tips = _achievement_score(resume_text)
    comm_score = _communication_score(parsed.get('soft_skills', []), resume_text)

    section_detail = {
        'technical': {'score': sections.get('technical', 0), 'label': 'Technical Skills'},
        'experience': {'score': sections.get('experience', 0), 'label': 'Experience'},
        'education': {'score': sections.get('education', 0), 'label': 'Education'},
        'projects': {'score': proj_score, 'label': 'Projects', 'note': proj_note},
        'certifications': {'score': cert_score, 'label': 'Certifications', 'note': cert_note},
        'grammar': {'score': grammar_score, 'label': 'Grammar & Clarity', 'issues': grammar_issues},
        'achievements': {'score': ach_score, 'label': 'Achievements'},
        'communication': {'score': comm_score, 'label': 'Communication'},
        'formatting': {'score': sections.get('formatting', 0), 'label': 'Formatting'},
        'completeness': {'score': sections.get('completeness', 0), 'label': 'Completeness'},
    }

    weak = [k for k, v in section_detail.items() if v['score'] < 55]
    why_low = []
    if base.get('ats_score', 0) < 60:
        why_low.append(f'Overall ATS is {base.get("ats_score")}% — below competitive range (60%+).')
    for w in weak[:4]:
        why_low.append(f'Weak {section_detail[w]["label"]} section ({section_detail[w]["score"]}%).')
    if base.get('missing_skills'):
        why_low.append(f'Missing keywords: {", ".join(base["missing_skills"][:5])}.')

    tips = list(base.get('improvement_tips') or [])
    tips.extend(grammar_issues[:2])
    tips.extend(ach_tips[:2])
    tips.append(proj_note)
    if cert_score < 70:
        tips.append(cert_note)

    keyword_opt = round(
        (base.get('keyword_match_percentage', 0) + base.get('semantic_similarity', 0)) / 2, 2
    )

    return {
        **base,
        'section_wise_scores': section_detail,
        'grammar_score': grammar_score,
        'project_quality_score': proj_score,
        'certification_score': cert_score,
        'achievement_score': ach_score,
        'communication_score': comm_score,
        'keyword_optimization_score': keyword_opt,
        'why_score_is_low': why_low if base.get('ats_score', 0) < 70 else ['Score is competitive — fine-tune weak sections.'],
        'improvement_tips': list(dict.fromkeys(tips))[:10],
        'weak_sections': weak,
    }
