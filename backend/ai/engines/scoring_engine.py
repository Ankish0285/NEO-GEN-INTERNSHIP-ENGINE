"""Deterministic, evidence-based internship matching and scoring."""

from __future__ import annotations

import re
from typing import Any


SKILL_ALIASES = {
    'react.js': 'react',
    'reactjs': 'react',
    'machine learning': 'machine learning',
    'ml': 'machine learning',
    'predictive modeling': 'machine learning',
    'natural language processing': 'nlp',
    'scikit-learn': 'machine learning',
    'sklearn': 'machine learning',
    'tensorflow': 'deep learning',
    'pytorch': 'deep learning',
    'mysql': 'sql',
    'postgresql': 'sql',
    'postgres': 'sql',
}


def normalize_skill(skill: Any) -> str:
    value = re.sub(r'\s+', ' ', str(skill or '').strip().lower())
    return SKILL_ALIASES.get(value, value)


def _skill_match(required: str, student_skills: list[str]) -> tuple[str, float, str | None]:
    wanted = normalize_skill(required)
    candidates = [(skill, normalize_skill(skill)) for skill in student_skills]
    for original, normalized in candidates:
        if normalized == wanted:
            return 'Exact', 1.0, original
    for original, normalized in candidates:
        if wanted and (wanted in normalized or normalized in wanted):
            return 'Strong semantic', 0.85, original
    wanted_tokens = set(wanted.split())
    for original, normalized in candidates:
        overlap = wanted_tokens.intersection(normalized.split())
        if overlap:
            return 'Partial', 0.5, original
    return 'No match', 0.0, None


def match_skills(required_skills: list[str], student_skills: list[str]) -> dict[str, Any]:
    matched, partial, missing, evidence = [], [], [], []
    total = 0.0
    for required in required_skills:
        category, weight, student = _skill_match(required, student_skills)
        item = {'required': required, 'match_type': category, 'evidence': student}
        if category in {'Exact', 'Strong semantic'}:
            matched.append(required)
            evidence.append(item)
        elif category == 'Partial':
            partial.append(required)
            evidence.append(item)
        else:
            missing.append(required)
        total += weight
    percentage = round(total / len(required_skills) * 100, 2) if required_skills else 50.0
    return {
        'matched_skills': matched,
        'partial_matches': partial,
        'missing_required_skills': missing,
        'skill_evidence': evidence,
        'percentage': percentage,
    }


def _find_number(text: str, pattern: str) -> int | None:
    match = re.search(pattern, text, re.I)
    return int(match.group(1)) if match else None


def extract_internship_requirements(job: dict[str, Any]) -> dict[str, Any]:
    eligibility = ' '.join(
        str(job.get(key) or '') for key in ('eligibility', 'requirements')
    )
    degree_terms = job.get('degreeRequirements') or re.findall(r'\b(?:b\.?\s*tech|b\.?\s*e|bachelor|master|m\.?\s*tech|mca|bca|mba|degree)\b', eligibility, re.I)
    branch_terms = job.get('branchRequirements') or re.findall(r'\b(?:computer science|information technology|\bIT\b|engineering|AI/?ML|data science)\b', eligibility, re.I)
    experience_years = job.get('experienceRequirements')
    if isinstance(experience_years, str):
        experience_years = _find_number(experience_years, r'(\d+)')
    if experience_years is None:
        experience_years = _find_number(eligibility, r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience')
    year_requirements = job.get('yearRequirements') or job.get('academicYear')
    if isinstance(year_requirements, str):
        year_requirements = [year_requirements]
    required_skills = job.get('requiredSkills') or job.get('skills') or []
    preferred_skills = job.get('preferredSkills') or []
    if isinstance(required_skills, str):
        required_skills = [s.strip() for s in required_skills.split(',') if s.strip()]
    if isinstance(preferred_skills, str):
        preferred_skills = [s.strip() for s in preferred_skills.split(',') if s.strip()]
    return {
        'required_skills': required_skills,
        'preferred_skills': preferred_skills,
        'degree_requirements': list(dict.fromkeys(degree_terms)),
        'branch_requirements': list(dict.fromkeys(branch_terms)),
        'experience_years': experience_years,
        'year_requirements': year_requirements or [],
        'location': str(job.get('location') or '').strip(),
        'eligibility_text': eligibility,
    }


def check_eligibility(profile: dict[str, Any], requirements: dict[str, Any]) -> dict[str, Any]:
    user_text = ' '.join(
        str(profile.get(key) or '') for key in ('course', 'university', 'education')
    ).strip()
    reasons, unknown = [], []
    user_lower = user_text.lower()

    for degree in requirements['degree_requirements']:
        if not user_text:
            unknown.append(f'Education information is not provided for required {degree}.')
        elif degree.lower() not in user_lower and not ('bachelor' in degree.lower() and 'b.' in user_lower):
            reasons.append(f'Required education was not found: {degree}.')
    for branch in requirements['branch_requirements']:
        if not user_text:
            unknown.append(f'Branch information is not provided for required {branch}.')
        elif branch.lower() not in user_lower:
            reasons.append(f'Required branch was not found: {branch}.')

    required_experience = requirements.get('experience_years')
    if required_experience is not None:
        actual = profile.get('experience_years')
        if actual is None:
            unknown.append('Experience information is not provided.')
        elif actual < required_experience:
            reasons.append(f'Requires {required_experience}+ years of experience; profile shows {actual}.')

    required_years = requirements.get('year_requirements') or []
    if required_years:
        academic_year = profile.get('academic_year') or profile.get('year')
        if academic_year is None:
            unknown.append('Academic year information is not provided.')
        elif str(academic_year).lower() not in ' '.join(map(str, required_years)).lower():
            reasons.append('The stated academic year requirement is not satisfied.')

    required_location = requirements.get('location', '')
    if required_location and required_location.lower() not in {'remote', 'work from home', 'wfh'}:
        preferred_location = str(profile.get('preferredLocation') or profile.get('location') or '').strip()
        if not preferred_location:
            unknown.append('Location information is not provided for this location-specific internship.')
        elif required_location.lower() not in preferred_location.lower() and preferred_location.lower() not in required_location.lower():
            reasons.append(f'Required location was not found: {required_location}.')

    if reasons:
        status = 'not_eligible'
    elif unknown:
        status = 'unknown'
    else:
        status = 'eligible'
    return {'status': status, 'reasons': reasons + unknown}


def _project_score(projects: list[Any], required_skills: list[str]) -> tuple[float, list[Any]]:
    if not projects:
        return 0.0, []
    relevant = []
    normalized_requirements = [normalize_skill(skill) for skill in required_skills]
    for project in projects:
        text = project if isinstance(project, str) else ' '.join(str(project.get(k) or '') for k in ('name', 'title', 'description', 'technologies', 'skills'))
        normalized_text = text.lower()
        if any(
            skill and (
                skill in normalized_text
                or any(alias in normalized_text for alias, target in SKILL_ALIASES.items() if target == skill)
            )
            for skill in normalized_requirements
        ):
            relevant.append(project)
    return round(min(100, len(relevant) / max(1, len(projects)) * 100), 2), relevant


def calculate_score(
    profile: dict[str, Any],
    requirements: dict[str, Any],
    ats_score: float,
    parsed_resume: dict[str, Any] | None = None,
) -> dict[str, Any]:
    parsed_resume = parsed_resume or {}
    student_skills = profile.get('skill_profile') or profile.get('skills') or []
    required = match_skills(requirements['required_skills'], student_skills)
    preferred = match_skills(requirements['preferred_skills'], student_skills)
    skill_score = required['percentage'] * 0.8 + preferred['percentage'] * 0.2 if requirements['preferred_skills'] else required['percentage']

    projects = parsed_resume.get('projects') or profile.get('projects') or []
    project_score, relevant_projects = _project_score(projects, requirements['required_skills'])
    if not projects and parsed_resume.get('projects_detected', 0):
        project_score = min(100, parsed_resume['projects_detected'] * 35)

    eligibility = check_eligibility(profile, requirements)
    education_score = {'eligible': 100, 'unknown': 50, 'not_eligible': 0}[eligibility['status']]
    certs = parsed_resume.get('certifications') or profile.get('certifications') or []
    achievement_score = min(100, len(certs) * 50 + (25 if parsed_resume.get('achievements') else 0))
    breakdown = {
        'skill_match': round(skill_score * 0.40, 2),
        'project_match': round(project_score * 0.25, 2),
        'education_eligibility': round(education_score * 0.15, 2),
        'ats_quality': round(float(ats_score or 0) * 0.10, 2),
        'certifications_achievements': round(achievement_score * 0.10, 2),
        'experience_bonus': 0,
    }
    final_score = round(sum(breakdown.values()), 2)
    return {
        'eligibility': eligibility,
        'matching': {
            **required,
            'preferred_matches': preferred['matched_skills'],
            'relevant_projects': relevant_projects,
        },
        'score': {**breakdown, 'final_score': final_score},
        'skill_gap': {
            'missing_skills': required['missing_required_skills'],
            'recommended_skills': required['missing_required_skills'][:5],
        },
    }