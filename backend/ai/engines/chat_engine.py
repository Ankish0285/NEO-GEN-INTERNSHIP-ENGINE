"""AI career assistant — integrated with ATS, profile, recommendations."""

from __future__ import annotations

from typing import Any

from llm.adapter import get_llm_adapter


def chat_response(message: str, context: dict | None = None) -> dict[str, Any]:
    context = context or {}
    msg = (message or '').lower().strip()

    llm = get_llm_adapter()
    if llm.provider != 'builtin':
        system = (
            'You are NeoGen AI career coach for Indian students. '
            'Use the student context to give actionable internship and resume advice. Be concise.'
        )
        user_prompt = f"Context: {context}\n\nStudent question: {message}"
        reply = llm.generate(system, user_prompt, context)
        return {'reply': reply, 'suggestions': _suggestions(context), 'provider': llm.provider}

    return _builtin_chat(msg, context)


def _builtin_chat(msg: str, context: dict) -> dict[str, Any]:
    ats = context.get('ats_score', 0)
    skills = context.get('skills', [])
    domain = context.get('career_domain', 'Technology')
    missing = context.get('missing_skills', [])
    readiness = context.get('internship_readiness', 0)
    employability = context.get('employability_score', 0)
    top = context.get('top_internships', [])
    best = context.get('best_match', [])
    easiest = context.get('easiest', [])
    why_low = context.get('why_low', [])
    weak = context.get('weak_sections', [])
    roadmap = context.get('learning_roadmap', [])

    if any(w in msg for w in ['why', 'low', 'weak']) and (why_low or weak):
        reply = (
            f'ATS {ats}% — reasons: {"; ".join(why_low[:3]) or "review section scores"}. '
            f'Weak areas: {", ".join(weak[:4]) or "see AI Intelligence dashboard"}. '
            'Open AI Intelligence for section-wise breakdown.'
        )
    elif any(w in msg for w in ['ats', 'score', 'resume']):
        reply = (
            f'Your ATS score is {ats}%. Readiness: {readiness}%. Employability: {employability}%. '
            + (f'Improve: {", ".join(missing[:4])}.' if missing else 'Resume is competitive — add metrics to projects.')
            + (f' Weak sections: {", ".join(weak[:3])}.' if weak else '')
        )
    elif any(w in msg for w in ['easiest', 'easy', 'chance']):
        reply = (
            f'Higher selection probability roles: {", ".join(easiest) or "check Easiest Selection tab"}. '
            f'Also consider: {", ".join(top[:3]) or "upload resume for matches"}.'
        )
    elif any(w in msg for w in ['intern', 'job', 'apply', 'recommend', 'best']):
        reply = (
            f'Top matches for {domain}: {", ".join(best) or ", ".join(top[:3]) or "none yet"}. '
            f'Skills: {", ".join(skills[:6]) if skills else "upload resume"}. '
            'See Recommendations for match % and selection probability.'
        )
    elif any(w in msg for w in ['career', 'domain', 'path']):
        reply = (
            f'Predicted domain: {domain}. '
            f'Follow the learning roadmap ({len(roadmap)} items) in AI Intelligence. '
            'Build 1–2 portfolio projects in your target domain.'
        )
    elif any(w in msg for w in ['interview', 'prepare']):
        reply = (
            'Use STAR format. Explain top 3 projects with tech stack and impact. '
            f'Review skills: {", ".join(skills[:5]) if skills else "your resume skills"}. '
            'Research the company and role description before the interview.'
        )
    elif any(w in msg for w in ['skill', 'learn', 'course', 'roadmap']):
        courses = [f'{r.get("skill", "")}: {r.get("course", "")}' for r in roadmap[:4]]
        reply = (
            'Priority learning: '
            + ('; '.join(courses) if courses else ', '.join(missing[:4]) or 'cloud, DSA, communication')
            + f'. Domain focus: {domain}.'
        )
    elif any(w in msg for w in ['profile', 'readiness', 'employability']):
        reply = (
            f'Employability {employability}%, internship readiness {readiness}%. '
            f'Domain: {domain}. Strengths in your AI Profile. '
            'Update skills and re-upload resume after changes.'
        )
    else:
        reply = (
            'I am connected to your ATS engine, recommendations, and AI profile. '
            'Ask about: ATS score, best internships, skills to learn, interview prep, or career path.'
        )

    return {'reply': reply, 'suggestions': _suggestions(context), 'provider': 'builtin'}


def _suggestions(context: dict) -> list[str]:
    return [
        'Why is my ATS score low?',
        'Which internships fit me best?',
        'Show easiest selection opportunities',
        'What skills should I learn next?',
    ]
