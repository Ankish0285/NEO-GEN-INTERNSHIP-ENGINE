"""Internship recommendation — content-based + vector ranking."""

from __future__ import annotations

from typing import Any

from app.ats_engine import analyze_ats
from app.embeddings import rank_by_similarity, semantic_similarity
from app.profile_engine import build_student_profile
from app.skills_db import COURSE_SUGGESTIONS


def _internship_doc(job: dict) -> str:
    parts = [
        job.get('title', ''),
        job.get('description', ''),
        job.get('organization', job.get('company', '')),
        job.get('department', ''),
        job.get('eligibility', ''),
        ' '.join(job.get('skills', job.get('requiredSkills', [])) or []),
        job.get('location', ''),
    ]
    return ' '.join(str(p) for p in parts if p)


def _skill_overlap(student_skills: list[str], job_skills: list[str]) -> tuple[list[str], list[str], float]:
    if not job_skills:
        return [], [], 50.0
    s_lower = [x.lower() for x in student_skills]
    matched, missing = [], []
    for js in job_skills:
        jl = js.lower()
        if any(jl in s or s in jl for s in s_lower):
            matched.append(js)
        else:
            missing.append(js)
    pct = len(matched) / len(job_skills) * 100
    return matched, missing, round(pct, 2)


def recommend_internships(
    resume_text: str,
    internships: list[dict],
    user_data: dict | None = None,
    applications: list | None = None,
    top_k: int = 12,
) -> dict[str, Any]:
    profile = build_student_profile(resume_text, user_data, applications)
    student_skills = profile['skill_profile']
    student_blob = resume_text + ' ' + ' '.join(student_skills)

    docs = [_internship_doc(j) for j in internships]
    vector_ranks = rank_by_similarity(student_blob, docs, top_k=len(internships)) if docs else []
    vector_map = {idx: score for idx, score in vector_ranks}

    recommendations = []
    for idx, job in enumerate(internships):
        job_skills = job.get('skills', job.get('requiredSkills', [])) or []
        matched, missing, skill_pct = _skill_overlap(student_skills, job_skills)
        job_doc = docs[idx] if idx < len(docs) else ''
        semantic = semantic_similarity(student_blob, job_doc)
        vector_score = vector_map.get(idx, semantic)

        ats_for_job = analyze_ats(resume_text, job_doc) if resume_text else {'ats_score': 50}
        ats_score = ats_for_job['ats_score']

        apps_on_job = sum(1 for a in (applications or []) if str(a.get('internshipId', '')) == str(job.get('_id', job.get('id', ''))))
        competition_factor = max(0.7, 1 - min(apps_on_job, 50) * 0.01)

        match_percentage = round(
            skill_pct * 0.35 + semantic * 0.25 + vector_score * 0.20 + ats_score * 0.20,
            2,
        )
        selection_probability = round(
            min(95, match_percentage * 0.85 * competition_factor + profile['employability_score'] * 0.1),
            2,
        )

        improvements = []
        for sk in missing[:4]:
            improvements.append(f'Learn or highlight: {sk}')
        improvements.extend(ats_for_job.get('improvement_tips', [])[:2])

        explanation = (
            f'{match_percentage}% match — {len(matched)} skills align with {job.get("title", "role")}. '
            f'Semantic fit {semantic}%. Estimated selection chance {selection_probability}%.'
        )

        recommendations.append({
            'internship_id': str(job.get('_id', job.get('id', idx))),
            'title': job.get('title', ''),
            'company': job.get('organization', job.get('company', '')),
            'location': job.get('location', ''),
            'stipend': job.get('stipend', ''),
            'duration': job.get('duration', ''),
            'description': (job.get('description', '') or '')[:300],
            'skills': job_skills,
            'matched_skills': matched,
            'missing_skills': missing,
            'match_percentage': match_percentage,
            'selection_probability': selection_probability,
            'ats_score': ats_score,
            'semantic_similarity': semantic,
            'recommended_improvements': improvements[:5],
            'ai_explanation': explanation,
            'ai_confidence_score': ats_for_job.get('ai_confidence_score', 75),
            'skill_gap_courses': [
                {'skill': s, 'course': COURSE_SUGGESTIONS.get(s.lower(), f'Course for {s}')}
                for s in missing[:3]
            ],
        })

    recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
    return {
        'recommendations': recommendations[:top_k],
        'student_profile': profile,
        'count': min(top_k, len(recommendations)),
    }
