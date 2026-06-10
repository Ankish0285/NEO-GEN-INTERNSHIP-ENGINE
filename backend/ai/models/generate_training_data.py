"""Training Dataset Generator for Internship Intelligence AI — Generates thousands of realistic samples."""
import json
import random
from typing import Any

# --- Sample Data ---
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Sai", "Ananya", "Diya", "Isha", "Aisha", "Riya",
    "John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Jennifer", "William", "Amanda"
]
LAST_NAMES = [
    "Kumar", "Sharma", "Patel", "Singh", "Gupta", "Smith", "Johnson", "Williams", "Jones", "Brown",
    "Iyer", "Reddy", "Nair", "Das", "Bose"
]
UNIVERSITIES = [
    "IIT Delhi", "IIT Bombay", "BITS Pilani", "VIT Vellore", "MIT", "Stanford", "University of Delhi",
    "NIT Trichy", "IIIT Hyderabad"
]
DEGREES = [
    "B.Tech Computer Science", "B.Tech IT", "B.Sc CS", "M.Tech AI", "MCA", "BBA", "MBA"
]

# --- Skills per domain ---
DOMAIN_SKILLS = {
    "Frontend": ["JavaScript", "React", "HTML", "CSS", "Tailwind CSS", "TypeScript", "Next.js"],
    "Backend": ["Node.js", "Python", "Java", "Express", "MongoDB", "PostgreSQL", "FastAPI"],
    "Full Stack": ["React", "Node.js", "MongoDB", "HTML", "CSS", "Python", "PostgreSQL"],
    "AI ML": ["Python", "TensorFlow", "PyTorch", "NLP", "scikit-learn", "Pandas", "Computer Vision"],
    "Data Science": ["Python", "SQL", "Pandas", "Tableau", "Statistics", "Machine Learning"],
    "Cloud": ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "Linux", "Git"],
    "Cyber Security": ["Network Security", "Ethical Hacking", "SIEM", "OWASP", "Penetration Testing"],
    "Android": ["Kotlin", "Java", "Android Studio", "Firebase", "XML"],
    "Flutter": ["Dart", "Flutter", "Firebase", "REST APIs", "State Management"],
    "DevOps": ["CI/CD", "Docker", "Kubernetes", "AWS", "Git", "Linux"],
    "UI UX": ["Figma", "Wireframing", "User Research", "Prototyping", "Adobe XD"],
    "Digital Marketing": ["SEO", "Google Ads", "Social Media", "Content Marketing", "Analytics"],
    "Business Analyst": ["SQL", "Excel", "Power BI", "Requirements Gathering", "UML"]
}

# --- Job descriptions ---
JOB_DESCRIPTIONS = [
    "Looking for a passionate frontend developer with React experience",
    "Hiring backend engineer proficient in Node.js and databases",
    "Seeking AI/ML intern with Python and ML knowledge",
    "Data science intern needed for analytics projects",
    "Cloud intern with AWS or Azure exposure required",
    "Cyber security intern to help with security assessments",
    "Flutter developer for mobile app development",
    "DevOps engineer to manage CI/CD pipelines",
    "UI/UX designer to create beautiful interfaces"
]


def generate_profile(experience_level: str = "Fresher") -> dict[str, Any]:
    """Generate a single realistic profile."""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"
    domain = random.choice(list(DOMAIN_SKILLS.keys()))
    domain_skills = DOMAIN_SKILLS[domain]
    max_skills = len(domain_skills)

    if experience_level == "Fresher":
        min_s = 2
        max_s = min(5, max_skills)
        skill_count = random.randint(min_s, max_s)
        exp_years = 0
        projects = random.randint(1,3)
    elif experience_level == "Intermediate":
        min_s = 4 if max_skills >=4 else max_skills
        max_s = min(8, max_skills)
        skill_count = random.randint(min_s, max_s)
        exp_years = random.randint(1,2)
        projects = random.randint(2,4)
    else: # Experienced
        min_s = 6 if max_skills >=6 else max_skills
        max_s = max_skills
        skill_count = random.randint(min_s, max_s)
        exp_years = random.randint(3,6)
        projects = random.randint(3,6)

    skills = random.sample(domain_skills, skill_count)
    random.shuffle(skills)
    university = random.choice(UNIVERSITIES)
    degree = random.choice(DEGREES)
    job_desc = random.choice(JOB_DESCRIPTIONS)
    # Generate resume text
    resume_text = f"""
{name}
Email: {first.lower()}.{last.lower()}@email.com
Phone: +91-9876543210

Education:
{degree} at {university}

Skills:
{', '.join(skills)}

Projects:
{projects} project(s) completed in {domain}.

Experience:
{exp_years} year(s) of experience.
    """
    # Generate ATS score
    ats_score = min(95, 40 + skill_count*5 + projects*4 + exp_years*3 + random.randint(-5,10))

    return {
        "id": random.randint(100000, 999999),
        "name": name,
        "experience_level": experience_level,
        "domain": domain,
        "resume_text": resume_text.strip(),
        "job_description": job_desc,
        "skills": skills,
        "education": [f"{degree}, {university}"],
        "projects": projects,
        "experience_years": exp_years,
        "ats_score": ats_score
    }


def generate_dataset(total_freshers: int = 10000, total_intermediate: int = 5000, total_experienced: int = 3000) -> list[dict]:
    """Generate complete training dataset."""
    dataset = []
    # Generate Freshers
    print(f"Generating {total_freshers} Freshers...")
    for _ in range(total_freshers):
        dataset.append(generate_profile("Fresher"))
    # Generate Intermediate
    print(f"Generating {total_intermediate} Intermediate...")
    for _ in range(total_intermediate):
        dataset.append(generate_profile("Intermediate"))
    # Generate Experienced
    print(f"Generating {total_experienced} Experienced...")
    for _ in range(total_experienced):
        dataset.append(generate_profile("Experienced"))

    # Shuffle dataset
    random.shuffle(dataset)
    print(f"Total dataset size: {len(dataset)} samples")
    return dataset


if __name__ == "__main__":
    # For quick test, generate small dataset first
    # To generate full 18k, uncomment: generate_dataset(10000,5000,3000)
    print("Generating sample dataset (100 samples)...")
    sample = generate_dataset(50,30,20)
    # Save to JSON
    output_file = "training_dataset.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(sample, f, indent=2, ensure_ascii=False)
    print(f"Sample dataset saved to: {output_file}")
    print("To generate full 18k dataset, edit this script!")

