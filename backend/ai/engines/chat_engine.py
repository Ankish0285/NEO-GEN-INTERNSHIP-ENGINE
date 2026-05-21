"""Rule-based AI career assistant (no external API required)."""

from __future__ import annotations

from typing import Any


def chat_response(message: str, context: dict | None = None) -> dict[str, Any]:
    context = context or {}
    msg = (message or '').lower().strip()
    ats = context.get('ats_score', 0)
    skills = context.get('skills', [])
    domain = context.get('career_domain', 'technology')
    missing = context.get('missing_skills', [])

    if any(w in msg for w in ['ats', 'score', 'resume']):
        reply = (
            f'Your current ATS score is {ats}%. '
            + ('Focus on adding missing skills: ' + ', '.join(missing[:5]) + '.' if missing else 'Your resume aligns well — add quantified achievements.')
        )
    elif any(w in msg for w in ['intern', 'job', 'apply', 'recommend']):
        reply = (
            f'Based on your profile ({domain}), apply to roles matching: '
            + (', '.join(skills[:6]) if skills else 'upload your resume first')
            + '. Check AI Recommendations for ranked matches.'
        )
    elif any(w in msg for w in ['interview', 'prepare']):
        reply = (
            'Prepare STAR-format answers, review projects on your resume, '
            'and research the organization. Practice explaining your top 3 skills with examples.'
        )
    elif any(w in msg for w in ['skill', 'learn', 'course']):
        reply = (
            'Priority upskilling: ' + (', '.join(missing[:4]) if missing else 'cloud, system design, and communication')
            + '. Use the learning roadmap in your AI Profile.'
        )
    else:
        reply = (
            'I can help with resume ATS optimization, internship matching, interview prep, and career paths. '
            'Ask about your ATS score, recommended internships, or skills to improve.'
        )

    return {
        'reply': reply,
        'suggestions': [
            'How can I improve my ATS score?',
            'Which internships fit me best?',
            'What skills should I learn next?',
        ],
    }
