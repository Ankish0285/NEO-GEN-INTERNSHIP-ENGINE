"""AI internship recommendation — vector search + ranking + selection tiers."""

from __future__ import annotations

from typing import Any

from engines.ats_engine import analyze_ats
from engines.embeddings import rank_by_similarity, semantic_similarity
from engines.profile_engine import build_student_profile
from engines.selection_engine import predict_selection
from engines.skills_db import COURSE_SUGGESTIONS
from engines.vector_store import semantic_search


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
    ats_result: dict | None = None,
    profile: dict | None = None,
) -> dict[str, Any]:
    profile = profile or build_student_profile(resume_text, user_data, applications)
    student_skills = profile['skill_profile']
    student_blob = resume_text + ' ' + ' '.join(student_skills)
    ats_base = ats_result or (analyze_ats(resume_text, '') if resume_text else {'ats_score': 50})

    docs = [_internship_doc(j) for j in internships]
    vector_ranks = semantic_search(student_blob, docs, top_k=len(internships)) if docs else []
    if not vector_ranks:
        vector_ranks = [
            {'index': i, 'score': s}
            for i, s in rank_by_similarity(student_blob, docs, top_k=len(internships))
        ]
    vector_map = {r['index']: r['score'] for r in vector_ranks}

    recommendations = []
    for idx, job in enumerate(internships):
        job_skills = job.get('skills', job.get('requiredSkills', [])) or []
        matched, missing, skill_pct = _skill_overlap(student_skills, job_skills)
        job_doc = docs[idx] if idx < len(docs) else ''
        semantic = semantic_similarity(student_blob, job_doc)
        vector_score = vector_map.get(idx, semantic)

        ats_for_job = analyze_ats(resume_text, job_doc) if resume_text else ats_base
        ats_score = ats_for_job.get('ats_score', ats_base.get('ats_score', 50))

        apps_on_job = sum(
            1 for a in (applications or [])
            if str(a.get('internshipId', '')) == str(job.get('_id', job.get('id', '')))
        )
        sel = predict_selection(
            match_percentage=0,
            ats_score=ats_score,
            skill_match_pct=skill_pct,
            resume_quality=ats_score,
            competition_count=apps_on_job,
            experience_years=profile.get('experience_years', 0),
            employability=profile.get('employability_score', 50),
        )

        ai_compatibility = round(
            skill_pct * 0.30 + semantic * 0.25 + vector_score * 0.25 + ats_score * 0.20, 2
        )
        match_percentage = round(
            (ai_compatibility + sel['selection_probability']) / 2, 2
        )
        sel['selection_probability'] = round(
            min(95, match_percentage * 0.7 + sel['selection_probability'] * 0.3), 2
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
            'ai_compatibility_score': ai_compatibility,
            'selection_probability': sel['selection_probability'],
            'interview_probability': sel['interview_probability'],
            'hiring_confidence': sel['hiring_confidence'],
            'selection_tier': sel['selection_tier'],
            'ats_score': ats_score,
            'semantic_similarity': semantic,
            'vector_similarity': vector_score,
            'recommended_improvements': (ats_for_job.get('improvement_tips') or [])[:3]
                + [f'Add skill: {s}' for s in missing[:2]],
            'ai_explanation': (
                f'{match_percentage}% match · {len(matched)} skills align · '
                f'{sel["selection_tier"]} selection chance ({sel["selection_probability"]}%). '
                f'Interview est. {sel["interview_probability"]}%.'
            ),
            'ai_confidence_score': ats_for_job.get('ai_confidence_score', 75),
            'skill_gap_courses': [
                {'skill': s, 'course': COURSE_SUGGESTIONS.get(s.lower(), f'Learn {s}')}
                for s in missing[:3]
            ],
            'category_tags': [],
        })

    recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)
    for r in recommendations:
        tags = []
        if r['match_percentage'] >= 75:
            tags.append('best_match')
        if r['selection_probability'] >= 65:
            tags.append('high_selection')
        if r['selection_tier'] == 'low' and r['match_percentage'] >= 50:
            tags.append('easier_entry')
        if len(r['matched_skills']) >= 3:
            tags.append('skill_based')
        r['category_tags'] = tags

    top = recommendations[:top_k]
    groups = {
        'best_match': sorted(recommendations, key=lambda x: x['match_percentage'], reverse=True)[:5],
        'highest_match': sorted(recommendations, key=lambda x: x['ai_compatibility_score'], reverse=True)[:5],
        'easiest_selection': sorted(recommendations, key=lambda x: x['selection_probability'], reverse=True)[:5],
        'skill_based': [r for r in recommendations if 'skill_based' in r.get('category_tags', [])][:5],
    }

    return {
        'recommendations': top,
        'groups': groups,
        'student_profile': profile,
        'count': len(top),
    }
