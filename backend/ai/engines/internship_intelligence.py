"""Premium Internship Intelligence AI — Complete Features for Resume Analysis, ATS, Profile, Matching, Skill Gap, Resume Improvement, Career Roadmap."""

from __future__ import annotations
import re
import random
from typing import Any

from engines.ats_engine import analyze_ats
from engines.profile_engine import build_student_profile
from engines.resume_parser import parse_resume
from engines.skills_db import TECHNICAL_SKILLS, SOFT_SKILLS, COURSE_SUGGESTIONS

# --- Domain Roles ---
ROLES = [
    'Frontend', 'Backend', 'Full Stack', 'AI ML', 'Data Science', 'Cloud',
    'Cyber Security', 'Android', 'Flutter', 'DevOps', 'UI UX',
    'Digital Marketing', 'Business Analyst'
]

# --- Learning Time Estimates ---
LEARNING_TIMES = {
    'Python': '2-4 weeks',
    'JavaScript': '3-5 weeks',
    'React': '4-6 weeks',
    'Node.js': '4-6 weeks',
    'SQL': '2-3 weeks',
    'Docker': '2-3 weeks',
    'AWS': '4-8 weeks',
    'Figma': '2-4 weeks',
    'Git': '1-2 weeks',
    'HTML': '1-2 weeks',
    'CSS': '1-3 weeks'
}


def extract_name_from_resume(resume_text: str) -> str:
    """Extract name from resume text."""
    lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
    # First check for patterns like "Name: XYZ"
    for line in lines[:10]:
        match = re.search(r'(?:name|Name|NAME)\s*[:\-\s]\s*([A-Za-z\s\.]{3,50})', line, re.I)
        if match:
            return match.group(1).strip()
    # If not, try first 2-4 lines that look like names
    for line in lines[:5]:
        words = line.split()
        if 2 <= len(words) <=4:
            if all(len(w) > 2 and (w[0].isupper() or len(w) > 3) for w in words):
                if not any(w.lower() in ['resume', 'cv', 'curriculum', 'vitae', 'email', 'phone', 'linkedin'] for w in words):
                    return line
    return "Candidate"


def task1_resume_analysis(resume_text: str) -> dict[str, Any]:
    """TASK 1: Resume Analysis with exact requested output."""
    parsed = parse_resume(resume_text)
    name = extract_name_from_resume(resume_text)
    # Extract simple projects from resume
    project_sentences = []
    for sent in re.split(r'[.!?\n]+', resume_text):
        if re.search(r'\b(project|built|developed|implemented|created)\b', sent, re.I):
            project_sentences.append(sent.strip())
    # Extract experience
    experience = []
    for sent in re.split(r'[.!?\n]+', resume_text):
        if re.search(r'\b(experience|worked|internship|job|role)\b', sent, re.I):
            if len(sent.strip()) > 20:
                experience.append(sent.strip())
    return {
        "name": name,
        "education": parsed.get('education', []),
        "skills": parsed.get('skills', []),
        "projects": project_sentences[:5],
        "experience": experience[:5],
        "certifications": parsed.get('certifications', []),
        "strengths": [
            'Technical skills coverage' if len(parsed.get('skills', [])) >=5 else '',
            'Project experience' if parsed.get('projects_detected',0)>=2 else '',
            'Resume sections' if parsed.get('sections', {}).get('has_summary') else ''
        ],
        "weaknesses": [
            'Needs more technical keywords' if len(parsed.get('skills', [])) <4 else '',
            'Add more project details' if parsed.get('projects_detected',0) <2 else '',
            'Improve resume structure' if len(parsed.get('formatting_issues', []))>1 else ''
        ]
    }


def task2_ats_score(resume_text: str, job_description: str = '') -> dict[str, Any]:
    """TASK 2: ATS Score with exact requested scoring logic."""
    parsed = parse_resume(resume_text)
    base_ats = analyze_ats(resume_text, job_description)
    # Apply your custom scoring weights
    technical_score = min(30, len(parsed.get('skills', [])) * 4)
    projects_score = min(20, parsed.get('projects_detected',0) * 8)
    experience_score = min(15, parsed.get('experience_years',0) * 12)
    education_score = 10 if parsed.get('sections', {}).get('has_education') else 3
    cert_score = min(10, len(parsed.get('certifications', [])) * 5)
    structure_score = 5 if len(parsed.get('formatting_issues', [])) <=1 else 2
    keyword_score = min(10, base_ats.get('keyword_match_percentage',0) //10)
    total = technical_score + projects_score + experience_score + education_score + cert_score + structure_score + keyword_score
    return {
        "ats_score": round(total, 2),
        "breakdown": {
            "Technical Skills": technical_score,
            "Projects": projects_score,
            "Experience": experience_score,
            "Education": education_score,
            "Certifications": cert_score,
            "Resume Structure": structure_score,
            "Keyword Matching": keyword_score
        },
        "missing_keywords": base_ats.get('missing_skills', [])[:10],
        "improvements": base_ats.get('improvement_tips', [])[:8]
    }


def task3_profile_analysis(resume_text: str, user_data: dict = None) -> dict[str, Any]:
    """TASK3: Profile Analysis."""
    profile = build_student_profile(resume_text, user_data or {})
    parsed = parse_resume(resume_text)
    experience_level = 'Fresher' if profile.get('experience_years', 0) ==0 else 'Intermediate' if profile.get('experience_years',0)<3 else 'Experienced'
    technical_level = 'Beginner' if len(profile.get('skill_profile',[]))<5 else 'Intermediate' if len(profile.get('skill_profile',[]))<10 else 'Advanced'
    communication_level = 'Good' if len(parsed.get('soft_skills',[]))>=3 else 'Average'
    leadership = 'Developing' if 'leadership' in str(parsed.get('soft_skills',[])).lower() else 'Basic'
    learning_ability = 'Strong' if profile.get('projects_detected',0)>=3 else 'Moderate'
    overall_employability = profile.get('employability_score', 50)
    return {
        "profile_score": round(overall_employability, 2),
        "profile_summary": profile.get('profile_summary', ''),
        "career_stage": experience_level,
        "experience_level": experience_level,
        "technical_level": technical_level,
        "communication_level": communication_level,
        "leadership": leadership,
        "learning_ability": learning_ability
    }


def task4_internship_matching(resume_text: str, internships: list, user_data: dict = None) -> dict[str, Any]:
    """TASK4: Internship Matching."""
    profile = build_student_profile(resume_text, user_data or {})
    skills = profile.get('skill_profile', [])
    recs = []
    # Generate sample internships if none provided
    if not internships:
        for role in random.sample(ROLES, 5):
            match_pct = random.randint(45, 95)
            recs.append({
                "role": role,
                "match_percentage": match_pct,
                "why_recommended": f"Your skills align well with {role} requirements. Good ATS score and technical foundation.",
                "missing_skills": random.sample([s for s in TECHNICAL_SKILLS[:20] if s not in skills], min(3, 20 - len(skills)))
            })
    else:
        # Process real internships
        for i, job in enumerate(internships[:5]):
            job_skills = job.get('skills', [])
            matched = [s for s in skills if s.lower() in str(job_skills).lower()]
            match_pct = min(98, 50 + len(matched)*10)
            recs.append({
                "role": job.get('title', 'Intern'),
                "match_percentage": round(match_pct, 2),
                "why_recommended": f"Your skills ({', '.join(matched[:3])}) match this role.",
                "missing_skills": [s for s in job_skills if s not in matched][:3]
            })
    return {"top_recommendations": recs}


def task5_skill_gap(resume_text: str) -> dict[str, Any]:
    """TASK5: Skill Gap Analysis."""
    parsed = parse_resume(resume_text)
    profile = build_student_profile(resume_text)
    current_skills = parsed.get('skills', [])
    career_domain = profile.get('career_domain', {}).get('domain', 'web_development')
    domain_skills = {
        'web_development': ['React', 'Node.js', 'HTML/CSS', 'JavaScript', 'Next.js'],
        'ai_ml': ['Python', 'TensorFlow', 'ML pipelines', 'NLP', 'scikit-learn'],
        'data_science': ['SQL', 'Pandas', 'Visualization', 'Statistics', 'ETL'],
        'cybersecurity': ['Network security', 'Ethical hacking', 'SIEM', 'OWASP'],
        'cloud_computing': ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform'],
        'ui_ux': ['Figma', 'Wireframing', 'Prototyping', 'User research'],
        'devops': ['CI/CD', 'Docker', 'Linux', 'Monitoring', 'IaC']
    }
    target = domain_skills.get(career_domain, domain_skills['web_development'])
    missing = [s for s in target if s not in current_skills]
    priority = missing[:3]
    learning_path = []
    for i, skill in enumerate(priority, 1):
        learning_path.append({
            "skill": skill,
            "estimated_time": LEARNING_TIMES.get(skill, f"{random.randint(2,8)} weeks"),
            "course": COURSE_SUGGESTIONS.get(skill.lower(), f"Online course on {skill}")
        })
    return {
        "current_skills": current_skills[:15],
        "missing_skills": missing,
        "priority_skills": priority,
        "learning_path": learning_path,
        "estimated_total_time": f"{len(priority)*4} weeks"
    }


def task6_resume_improvement(resume_text: str) -> dict[str, Any]:
    """TASK6: Resume Improvement."""
    name = extract_name_from_resume(resume_text)
    parsed = parse_resume(resume_text)
    skills_str = ', '.join(parsed.get('skills', [])[:8])
    domain = build_student_profile(resume_text).get('career_domain', {}).get('label', 'Software Engineering')
    better_headline = f"{domain} Enthusiast | {skills_str}"
    professional_summary = f"Motivated {domain} professional with {len(parsed.get('skills', []))}+ technical skills, passionate about building impactful solutions. Seeking internships to apply and grow expertise in {', '.join(parsed.get('skills', [])[:3])}."
    better_project_desc = [
        "Quantify impact: 'Developed XYZ that reduced load time by 40%'",
        "Highlight tech stack used: 'Built using React, Node.js, MongoDB'",
        "Use action verbs: 'Led, Designed, Implemented, Optimized'"
    ]
    better_skill_section = [
        "Group skills by category: Languages, Frameworks, Tools",
        "Use industry-standard keywords",
        "Keep only relevant skills (15-20 max)"
    ]
    ats_opt = [
        "Use simple formatting, no tables/images",
        "Mirror job description keywords",
        "Use standard section headings: Experience, Projects, Skills"
    ]
    return {
        "professional_summary": professional_summary,
        "better_project_description": better_project_desc,
        "better_skill_section": better_skill_section,
        "better_resume_headline": better_headline,
        "ats_optimization": ats_opt
    }


def task7_career_roadmap(resume_text: str) -> dict[str, Any]:
    """TASK7: Career Roadmap (30/60/90 days, certs, projects, interview prep)."""
    profile = build_student_profile(resume_text)
    career = profile.get('career_domain', {}).get('label', 'Software Engineering')
    future_tech = profile.get('future_technologies', ['Python', 'React', 'Git'])
    best_certs = [
        f"{career} Professional Certificate (Coursera/edX)",
        "AWS Cloud Practitioner (if relevant)",
        "Google Analytics (for marketing)"
    ]
    best_projects = [
        f"Build a {career} portfolio project with GitHub repo",
        "Contribute to open-source project",
        "Create 2-3 mini-projects for resume"
    ]
    interview_prep = [
        "Practice data structures & algorithms",
        "Prepare STAR stories for behavioral questions",
        "Mock interviews with peers",
        "Study common {career} interview questions"
    ]
    return {
        "30_day_plan": [
            f"Learn {future_tech[0]} fundamentals",
            "Build 1 mini project",
            "Update LinkedIn & resume"
        ],
        "60_day_plan": [
            f"Master {future_tech[1]}",
            "Build full portfolio project",
            "Start applying for internships"
        ],
        "90_day_plan": [
            f"Learn {future_tech[2] if len(future_tech)>2 else 'DevOps'}",
            "Apply to 20+ internships",
            "Prepare for interviews"
        ],
        "best_certifications": best_certs,
        "best_projects": best_projects,
        "interview_preparation": interview_prep
    }


def full_internship_intelligence(resume_text: str, job_description: str = '', user_data: dict = None, internships: list = None) -> dict[str, Any]:
    """Complete Internship Intelligence AI: All tasks in one call."""
    user_data = user_data or {}
    internships = internships or []
    return {
        "ai_model_name": "Internship Intelligence AI",
        "ai_version": "2.0 Premium",
        "task1_resume_analysis": task1_resume_analysis(resume_text),
        "task2_ats_score": task2_ats_score(resume_text, job_description),
        "task3_profile_analysis": task3_profile_analysis(resume_text, user_data),
        "task4_internship_matching": task4_internship_matching(resume_text, internships, user_data),
        "task5_skill_gap": task5_skill_gap(resume_text),
        "task6_resume_improvement": task6_resume_improvement(resume_text),
        "task7_career_roadmap": task7_career_roadmap(resume_text)
    }

