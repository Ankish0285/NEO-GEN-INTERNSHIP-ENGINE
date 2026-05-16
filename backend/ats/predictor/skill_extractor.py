import re

# Comprehensive keyword database (ported from Node.js backend for consistency)
KEYWORDS_DATABASE = {
    'technical': [
        # Languages
        'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'c++', 'cpp', 'c#', 'csharp', 'golang', 'go', 'rust', 'ruby', 'php',
        'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
        # Web Frontend
        'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js', 'svelte', 'nextjs', 'next.js', 'nuxt', 'gatsby', 'html', 'html5', 'css', 'css3', 'sass',
        'less', 'tailwind', 'tailwindcss', 'bootstrap', 'webpack', 'babel', 'vite', 'redux', 'mobx', 'context api',
        # Web Backend
        'node', 'nodejs', 'node.js', 'express', 'expressjs', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'springboot', 'spring boot', 'laravel', 'symfony',
        'rails', 'ruby on rails', 'sinatra', 'gin', 'echo', 'fiber', 'asp.net', '.net',
        # Databases
        'mongodb', 'mongo', 'mysql', 'postgresql', 'postgres', 'oracle', 'mssql', 'sql server', 'redis', 'cassandra', 'dynamodb',
        'elasticsearch', 'firestore', 'firebase', 'realm', 'sqlite', 'mariadb',
        # Cloud & DevOps
        'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'circleci', 'gitlab', 'github actions',
        'terraform', 'ansible', 'chef', 'puppet', 'ci/cd', 'devops', 'heroku', 'vercel', 'netlify', 'digitalocean', 'linode',
        # APIs & Protocols
        'rest', 'restful', 'graphql', 'api', 'oauth', 'jwt', 'websocket', 'grpc', 'soap', 'xml', 'json', 'protobuf',
        # Other Technical
        'git', 'github', 'gitlab', 'bitbucket', 'linux', 'unix', 'ubuntu', 'centos', 'windows', 'macos', 'sql', 'nosql', 'machine learning', 'ml', 'ai', 'artificial intelligence',
        'tensorflow', 'pytorch', 'scikit-learn', 'sklearn', 'keras', 'nlp', 'computer vision', 'opencv', 'data science', 'pandas', 'numpy',
        'android', 'ios', 'flutter', 'react native', 'ionic', 'xamarin', 'blockchain', 'web3',
        'solidity', 'ethereum', 'smart contracts', 'iot', 'mqtt', 'embedded', 'assembly', 'arduino', 'raspberry pi'
    ],
    'softSkills': [
        'communication', 'teamwork', 'team player', 'collaboration', 'collaborative', 'leadership',
        'problem solving', 'problem-solving', 'analytical', 'critical thinking', 'critical-thinking',
        'time management', 'time-management', 'project management', 'project-management', 'adaptability',
        'adaptable', 'creativity', 'creative', 'innovative', 'organization', 'organizational', 'presentation',
        'presenting', 'public speaking', 'interpersonal', 'mentoring', 'mentorship', 'coaching',
        'negotiation', 'conflict resolution', 'decision making', 'decision-making', 'strategic thinking',
        'independent', 'self-motivated', 'motivated', 'proactive', 'responsible', 'accountability',
        'attentive', 'detail-oriented', 'attention to detail', 'emotional intelligence', 'empathy', 'work ethic'
    ],
    'frameworks': [
        'agile', 'scrum', 'kanban', 'jira', 'confluence', 'slack', 'asana', 'trello', 'monday',
        'figma', 'photoshop', 'illustrator', 'adobe', 'sketch', 'zeplin', 'xd', 'invision',
        'postman', 'insomnia', 'swagger', 'openapi', 'junit', 'pytest', 'mocha', 'jest', 'chai',
        'selenium', 'cypress', 'testng', 'cucumber', 'rspec', 'puppeteer', 'playwright'
    ]
}

def extract_skills(text):
    """
    Extracts skills from text based on the KEYWORDS_DATABASE.
    Returns a set of unique found skills (normalized to lowercase).
    """
    if not text:
        return set()
    
    text_lower = text.lower()
    found_skills = set()
    
    # Iterate through all categories
    for category, keywords in KEYWORDS_DATABASE.items():
        for keyword in keywords:
            # Simple keyword matching
            # We add spaces around to avoid partial matches (e.g. "go" in "google")
            # But we also need to handle punctuation.
            # A regex is safer: \bkeyword\b
            
            # Escape keyword for regex special chars (like c++, .net)
            escaped_keyword = re.escape(keyword)
            pattern = r'\b' + escaped_keyword + r'\b'
            
            if re.search(pattern, text_lower):
                found_skills.add(keyword)
                
    return found_skills

def analyze_match(resume_text, job_description):
    """
    Compares resume skills with job description skills.
    """
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(job_description)
    
    matched_skills = list(resume_skills.intersection(jd_skills))
    missing_skills = list(jd_skills - resume_skills)
    
    # Calculate a simple match percentage based on skills
    skill_match_score = 0
    if jd_skills:
        skill_match_score = (len(matched_skills) / len(jd_skills)) * 100
    
    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "skill_match_score": skill_match_score,
        "resume_skills": list(resume_skills),
        "jd_skills": list(jd_skills)
    }

def generate_improvement_tips(missing_skills, skill_match_score):
    tips = []
    
    if missing_skills:
        top_missing = missing_skills[:5]
        tips.append(f"Consider adding these missing skills found in the job description: {', '.join(top_missing)}.")
        
    if skill_match_score < 50:
        tips.append("Your resume has a low keyword match with the job description. Try to tailor your resume to include more relevant technical terms from the JD.")
    elif skill_match_score < 80:
        tips.append("Good match, but there is room for improvement. Review the missing skills.")
        
    if not tips:
        tips.append("Great job! Your resume matches the job description well.")
        
    return tips
