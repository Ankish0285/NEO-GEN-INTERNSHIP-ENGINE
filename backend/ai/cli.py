"""CLI for Node.js — no separate ai-service folder needed."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from engines.ats_engine import analyze_ats
from engines.chat_engine import chat_response
from engines.profile_engine import build_student_profile
from engines.recommendation_engine import recommend_internships
from engines.resume_parser import parse_resume


def _read_payload():
    if not sys.stdin.isatty():
        return json.load(sys.stdin)
    if len(sys.argv) > 2:
        return json.loads(sys.argv[2])
    return {}


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'health'
    payload = _read_payload()

    if cmd == 'health':
        out = {'status': 'ok', 'service': 'neogen-ai'}
    elif cmd == 'analyze':
        out = analyze_ats(payload.get('resume_text', ''), payload.get('job_description', ''))
    elif cmd == 'parse':
        out = parse_resume(payload.get('resume_text', ''))
    elif cmd == 'profile':
        out = build_student_profile(
            payload.get('resume_text', ''),
            payload.get('user_data', {}),
            payload.get('applications', []),
            payload.get('interests', []),
        )
    elif cmd == 'recommendations':
        out = recommend_internships(
            payload.get('resume_text', ''),
            payload.get('internships', []),
            payload.get('user_data', {}),
            payload.get('applications', []),
            payload.get('top_k', 12),
        )
    elif cmd == 'match':
        job = payload.get('internship', {})
        job_doc = ' '.join([
            str(job.get('title', '')),
            str(job.get('description', '')),
            ' '.join(job.get('skills', []) or []),
        ])
        out = analyze_ats(payload.get('resume_text', ''), job_doc)
    elif cmd == 'chat':
        out = chat_response(payload.get('message', ''), payload.get('context', {}))
    elif cmd == 'pipeline':
        ats = analyze_ats(payload.get('resume_text', ''), '') if payload.get('resume_text') else {}
        profile = build_student_profile(
            payload.get('resume_text', ''),
            payload.get('user_data', {}),
            payload.get('applications', []),
        )
        recs = recommend_internships(
            payload.get('resume_text', ''),
            payload.get('internships', []),
            payload.get('user_data', {}),
            payload.get('applications', []),
            payload.get('top_k', 12),
        )
        out = {
            'ats': ats,
            'profile': profile,
            'recommendations': recs['recommendations'],
            'student_profile': recs.get('student_profile', profile),
        }
    else:
        print(json.dumps({'error': f'unknown command: {cmd}'}))
        sys.exit(1)

    print(json.dumps(out))


if __name__ == '__main__':
    main()
