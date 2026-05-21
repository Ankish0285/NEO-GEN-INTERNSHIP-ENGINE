import re
from typing import Any

from engines.skills_db import TECHNICAL_SKILLS, SOFT_SKILLS


def _find_skills(text: str, keywords: list[str]) -> list[str]:
    if not text:
        return []
    lower = text.lower()
    found = []
    for kw in keywords:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, lower):
            found.append(kw)
    return sorted(set(found))


def _has_section(text: str, headers: list[str]) -> bool:
    lower = text.lower()
    return any(h in lower for h in headers)


def parse_resume(text: str) -> dict[str, Any]:
    """NLP-style resume analysis (regex + skill ontology)."""
    if not text or len(text.strip()) < 20:
        return {
            'skills': [], 'soft_skills': [], 'education': [], 'certifications': [],
            'projects': [], 'experience_years': 0, 'sections': {}, 'word_count': 0,
        }

    skills = _find_skills(text, TECHNICAL_SKILLS)
    soft = _find_skills(text, SOFT_SKILLS)

    edu_patterns = re.findall(
        r'(b\.?\s*tech|b\.?\s*e|bachelor|master|m\.?\s*tech|phd|bca|mca|computer science|engineering|university|college)[^\n]{0,80}',
        text,
        re.I,
    )
    cert_patterns = re.findall(
        r'(certified|certification|certificate)[^\n]{0,60}',
        text,
        re.I,
    )
    project_hits = len(re.findall(r'\b(project|built|developed|implemented)\b', text, re.I))

    exp_match = re.search(r'(\d+)\+?\s*(years?|yrs)\s+(of\s+)?experience', text, re.I)
    experience_years = int(exp_match.group(1)) if exp_match else (1 if project_hits >= 3 else 0)

    sections = {
        'has_summary': _has_section(text, ['summary', 'objective', 'profile']),
        'has_experience': _has_section(text, ['experience', 'work history', 'employment']),
        'has_education': _has_section(text, ['education', 'academic', 'qualification']),
        'has_skills': _has_section(text, ['skills', 'technical skills', 'competencies']),
        'has_projects': _has_section(text, ['projects', 'portfolio']),
        'has_certifications': _has_section(text, ['certification', 'certificates']),
        'has_contact': bool(re.search(r'[\w.-]+@[\w.-]+\.\w+', text)) or bool(
            re.search(r'\+?\d[\d\s-]{8,}\d', text)
        ),
    }

    formatting_issues = []
    if len(text.split()) < 150:
        formatting_issues.append('Resume is short — add more detail to projects and experience.')
    if not sections['has_skills']:
        formatting_issues.append('Add a dedicated Skills section with role-relevant keywords.')
    if not sections['has_contact']:
        formatting_issues.append('Include email and phone in the header.')
    if text.count('\n\n') < 3:
        formatting_issues.append('Improve section spacing for ATS readability.')

    return {
        'skills': skills,
        'soft_skills': soft,
        'education': list(dict.fromkeys(edu_patterns[:5])),
        'certifications': list(dict.fromkeys(cert_patterns[:5])),
        'projects_detected': min(project_hits, 10),
        'experience_years': experience_years,
        'sections': sections,
        'formatting_issues': formatting_issues,
        'word_count': len(text.split()),
        'tools_and_technologies': [s for s in skills if s in TECHNICAL_SKILLS[:40]],
        'coding_languages': [
            s for s in skills
            if s in {'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'php'}
        ],
    }
