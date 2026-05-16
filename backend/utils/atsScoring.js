/**
 * Comprehensive ATS Scoring Algorithm
 * Scores resumes across 6 dimensions with weighted calculation
 */

// Comprehensive keyword database
const KEYWORDS_DATABASE = {
    technical: [
        // Languages
        'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'c++', 'cpp', 'c#', 'csharp', 'golang', 'go', 'rust', 'ruby', 'php',
        'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
        // Web Frontend
        'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js', 'svelte', 'nextjs', 'next.js', 'nuxt', 'gatsby', 'html', 'html5', 'css', 'css3', 'sass',
        'less', 'tailwind', 'tailwindcss', 'bootstrap', 'webpack', 'babel', 'vite', 'redux', 'mobx', 'context api',
        // Web Backend
        'node', 'nodejs', 'node.js', 'express', 'expressjs', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'springboot', 'spring boot', 'laravel', 'symfony',
        'rails', 'ruby on rails', 'sinatra', 'gin', 'echo', 'fiber', 'asp.net', '.net',
        // Databases
        'mongodb', 'mongo', 'mysql', 'postgresql', 'postgres', 'oracle', 'mssql', 'sql server', 'redis', 'cassandra', 'dynamodb',
        'elasticsearch', 'firestore', 'firebase', 'realm', 'sqlite', 'mariadb',
        // Cloud & DevOps
        'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'circleci', 'gitlab', 'github actions',
        'terraform', 'ansible', 'chef', 'puppet', 'ci/cd', 'devops', 'heroku', 'vercel', 'netlify', 'digitalocean', 'linode',
        // APIs & Protocols
        'rest', 'restful', 'graphql', 'api', 'oauth', 'jwt', 'websocket', 'grpc', 'soap', 'xml', 'json', 'protobuf',
        // Other Technical
        'git', 'github', 'gitlab', 'bitbucket', 'linux', 'unix', 'ubuntu', 'centos', 'windows', 'macos', 'sql', 'nosql', 'machine learning', 'ml', 'ai', 'artificial intelligence',
        'tensorflow', 'pytorch', 'scikit-learn', 'sklearn', 'keras', 'nlp', 'computer vision', 'opencv', 'data science', 'pandas', 'numpy',
        'android', 'ios', 'flutter', 'react native', 'ionic', 'xamarin', 'blockchain', 'web3',
        'solidity', 'ethereum', 'smart contracts', 'iot', 'mqtt', 'embedded', 'assembly', 'arduino', 'raspberry pi'
    ],
    softSkills: [
        'communication', 'teamwork', 'team player', 'collaboration', 'collaborative', 'leadership',
        'problem solving', 'problem-solving', 'analytical', 'critical thinking', 'critical-thinking',
        'time management', 'time-management', 'project management', 'project-management', 'adaptability',
        'adaptable', 'creativity', 'creative', 'innovative', 'organization', 'organizational', 'presentation',
        'presenting', 'public speaking', 'interpersonal', 'mentoring', 'mentorship', 'coaching',
        'negotiation', 'conflict resolution', 'decision making', 'decision-making', 'strategic thinking',
        'independent', 'self-motivated', 'motivated', 'proactive', 'responsible', 'accountability',
        'attentive', 'detail-oriented', 'attention to detail', 'emotional intelligence', 'empathy', 'work ethic'
    ],
    experience: [
        'intern', 'internship', 'internship experience', 'experience', 'project', 'developed',
        'implemented', 'designed', 'built', 'created', 'managed', 'led', 'collaborated',
        'contributed', 'achieved', 'improved', 'optimized', 'deployed', 'maintained',
        'architected', 'engineered', 'launched', 'scaled', 'redesigned', 'refactored',
        'integrated', 'automated', 'streamlined', 'enhanced', 'accelerated', 'reduced costs',
        'spearheaded', 'orchestrated', 'formulated', 'conceptualized', 'initiated'
    ],
    education: [
        'bachelor', 'bachelors', 'masters', 'master\'s', 'phd', 'doctorate', 'degree', 'university', 'college', 'engineering',
        'computer science', 'information technology', 'btech', 'b.tech', 'mtech', 'm.tech',
        'bca', 'b.c.a', 'mca', 'm.c.a', 'b.e', 'be', 'b.s', 'bs', 'b.sc', 'bsc', 'm.s', 'ms', 'm.sc', 'msc', 'certification', 'certified',
        'course', 'training', 'bootcamp', 'gpa', 'cgpa', 'academic', 'graduated', 'graduation',
        'honors', 'distinction', 'dean\'s list', 'school of', 'institute of', 'diploma'
    ],
    frameworks: [
        // Popular frameworks and tools
        'agile', 'scrum', 'kanban', 'jira', 'confluence', 'slack', 'asana', 'trello', 'monday',
        'figma', 'photoshop', 'illustrator', 'adobe', 'sketch', 'zeplin', 'xd', 'invision',
        'postman', 'insomnia', 'swagger', 'openapi', 'junit', 'pytest', 'mocha', 'jest', 'chai',
        'selenium', 'cypress', 'testng', 'cucumber', 'rspec', 'puppeteer', 'playwright'
    ]
};

/**
 * Return empty score result with safe defaults
 * @returns {Object} Empty score with all values set to 0
 */
const getEmptyScoreResult = () => {
    return {
        score: 0,
        breakdown: {
            technical: 0,
            softSkills: 0,
            experience: 0,
            education: 0,
            completeness: 0,
            formatting: 0,
            contact: 0
        },
        sections: {
            hasSummary: false,
            hasExperience: false,
            hasEducation: false,
            hasSkills: false,
            hasProjects: false,
            hasContact: false
        },
        matched: [],
        missing: [],
        wordCount: 0,
        hasEmail: false,
        hasPhone: false,
        hasLinkedIn: false
    };
};

/**
 * Calculate ATS Score with detailed breakdown
 * @param {string} text - Parsed resume text
 * @param {Array<string>} jobKeywords - Optional: specific job keywords to match
 * @returns {Object} Score breakdown and analysis
 */
const calculateATSScore = (text = '', jobKeywords = []) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return getEmptyScoreResult();
    }

    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Helper to escape regex special characters
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Helper to check for whole word matches to avoid false positives (e.g. "go" in "good")
    const hasWord = (text, word) => {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        return regex.test(text);
    };

    // Count keyword matches for each category
    const technicalKeywords = [...KEYWORDS_DATABASE.technical, ...(jobKeywords || [])];
    const technicalMatched = technicalKeywords.filter(k => hasWord(lowerText, k));

    const softSkillsMatched = KEYWORDS_DATABASE.softSkills.filter(k => hasWord(lowerText, k));

    const experienceMatched = KEYWORDS_DATABASE.experience.filter(k => hasWord(lowerText, k));

    const educationMatched = KEYWORDS_DATABASE.education.filter(k => hasWord(lowerText, k));

    // Detect resume sections
    const sections = {
        hasSummary: /summary|objective|profile|about/i.test(lowerText),
        hasExperience: /experience|work\s+history|employment|internship/i.test(lowerText),
        hasEducation: /education|qualification|academic|degree/i.test(lowerText),
        hasSkills: /skills|technical\s+skills|competencies|expertise/i.test(lowerText),
        hasProjects: /projects|portfolio|case\s+studies/i.test(lowerText),
        hasContact: /@|linkedin|github|phone|\+\d|portfolio|website/i.test(lowerText)
    };

    // Calculate weighted scores (0-100 per category) - ensure all are valid numbers
    // Technical Score: Logarithmic scale to avoid needing ALL keywords for 100%
    // Expecting around 10-15 technical keywords for a good score
    const techCount = technicalMatched.length;
    const technicalScore = Math.min(100, (techCount / 12) * 100);

    // Soft Skills: Expecting around 5-8
    const softCount = softSkillsMatched.length;
    const softSkillScore = Math.min(100, (softCount / 6) * 100);

    // Experience Keywords: Expecting usage of action verbs
    const expCount = experienceMatched.length;
    const experienceScore = Math.min(100, (expCount / 8) * 100);

    // Education: Just need presence of some education terms
    const eduCount = educationMatched.length;
    const educationScore = Math.min(100, (eduCount / 2) * 100);

    // Completeness score: how many sections are present (0-100)
    const sectionsPresent = Object.values(sections).filter(Boolean).length;
    const completenessScore = Math.max(0, Math.min(100, (sectionsPresent / 6) * 100));

    // Formatting score: based on word count (ideal: 300-700 words)
    let formattingScore = 100;
    if (wordCount < 150) formattingScore = 40;
    else if (wordCount < 250) formattingScore = 60;
    else if (wordCount < 300) formattingScore = 80;
    else if (wordCount > 1000) formattingScore = 70; // Too long
    else if (wordCount > 1500) formattingScore = 50; // Way too long
    formattingScore = Math.max(0, Math.min(100, formattingScore));

    // Contact information score (0-100 scale)
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
    const hasPhone = /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/i.test(text);
    const hasLinkedIn = /linkedin\.com|linkedin|in\.com/i.test(text);
    const contactPoints = (hasEmail ? 1 : 0) + (hasPhone ? 1 : 0) + (hasLinkedIn ? 1 : 0);
    const contactScore = Math.max(0, Math.min(100, (contactPoints / 3) * 100));

    // Overall score calculation: weighted average
    // Technical (35%), Experience (25%), Completeness (20%), Education (10%), Formatting (5%), Soft Skills (5%)
    const rawScore = (technicalScore * 0.35) +
        (experienceScore * 0.25) +
        (completenessScore * 0.20) +
        (educationScore * 0.10) +
        (formattingScore * 0.05) + 
        (softSkillScore * 0.05);
    
    const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Collect all matched and missing keywords
    const allMatched = [...new Set([
        ...technicalMatched,
        ...softSkillsMatched,
        ...experienceMatched,
        ...educationMatched
    ])];

    const allKeywords = [...new Set([
        ...technicalKeywords,
        ...KEYWORDS_DATABASE.softSkills,
        ...KEYWORDS_DATABASE.experience,
        ...KEYWORDS_DATABASE.education
    ])];

    const missingKeywords = allKeywords
        .filter(k => !hasWord(lowerText, k))
        // Filter out synonyms if base term is present? (Simple version: just top missing)
        .slice(0, 15); 

    // Ensure all breakdown values are valid numbers
    const breakdown = {
        technical: Math.max(0, Math.min(100, Math.round(technicalScore))),
        softSkills: Math.max(0, Math.min(100, Math.round(softSkillScore))),
        experience: Math.max(0, Math.min(100, Math.round(experienceScore))),
        education: Math.max(0, Math.min(100, Math.round(educationScore))),
        completeness: Math.max(0, Math.min(100, Math.round(completenessScore))),
        formatting: Math.max(0, Math.min(100, Math.round(formattingScore))),
        contact: Math.max(0, Math.min(100, Math.round(contactScore)))
    };

    return {
        score: overallScore,
        breakdown,
        sections,
        matched: allMatched,
        missing: missingKeywords,
        wordCount,
        hasEmail,
        hasPhone,
        hasLinkedIn
    };
};

/**
 * Generate actionable improvement suggestions
 * @param {Object} scoreData - Result from calculateATSScore
 * @returns {Array<string>} List of suggestions
 */
const generateSuggestions = (scoreData) => {
    const suggestions = [];

    // Critical sections
    if (!scoreData.sections.hasContact) {
        suggestions.push('Add contact information: email, phone, and LinkedIn profile. ATS needs this to contact you.');
    }
    if (!scoreData.sections.hasSummary) {
        suggestions.push('Add a professional summary or objective statement at the top to give a quick overview of your profile.');
    }
    if (!scoreData.sections.hasExperience) {
        suggestions.push('Include a "Work Experience" or "Projects" section. Use standard headings.');
    }
    if (!scoreData.sections.hasSkills) {
        suggestions.push('Create a dedicated "Skills" section. List technical skills clearly.');
    }

    // Technical skills
    if (scoreData.breakdown.technical < 60) {
        suggestions.push('Boost your technical score by listing more relevant programming languages, tools, and frameworks.');
    }

    // Format & length
    if (scoreData.wordCount < 250) {
        suggestions.push(`Your resume is too short (${scoreData.wordCount} words). Aim for 300-600 words to include enough detail for ATS to parse.`);
    }
    if (scoreData.wordCount > 1000) {
        suggestions.push(`Your resume is quite long (${scoreData.wordCount} words). Try to condense it to 1-2 pages (under 800 words) for better readability.`);
    }

    // Soft skills
    if (scoreData.breakdown.softSkills < 40) {
        suggestions.push('Don\'t forget soft skills. Mention teamwork, communication, or leadership in your experience descriptions.');
    }

    // Missing keywords suggestion
    if (scoreData.missing.length > 0) {
        // Filter missing to prioritize technical
        const missingTech = scoreData.missing.filter(k => KEYWORDS_DATABASE.technical.includes(k)).slice(0, 5);
        if (missingTech.length > 0) {
             suggestions.push(`Consider adding these high-value technical keywords if you have the skills: ${missingTech.join(', ')}.`);
        }
    }

    // Education
    if (!scoreData.sections.hasEducation && scoreData.breakdown.education < 30) {
        suggestions.push('Ensure your Education section is clearly labeled and includes your degree and university.');
    }

    // Action verbs
    const actionVerbs = KEYWORDS_DATABASE.experience;
    const hasActionVerbs = actionVerbs.some(v => scoreData.matched.includes(v));
    if (!hasActionVerbs) {
        suggestions.push('Use strong action verbs (e.g., Developed, Managed, Created) to start your bullet points.');
    }

    return suggestions.slice(0, 10); // Return top 10 suggestions
};

/**
 * Extract key information from resume
 * @param {string} text - Parsed resume text
 * @returns {Object} Extracted information
 */
const extractResumeInfo = (text) => {
    const lowerText = text.toLowerCase();
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Extract skills mentioned
    const allKeywords = [
        ...KEYWORDS_DATABASE.technical,
        ...KEYWORDS_DATABASE.softSkills,
        ...KEYWORDS_DATABASE.frameworks
    ];

    // Helper to escape regex special characters
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const extractedSkills = [...new Set(
        allKeywords.filter(k => {
             if (k.length <= 3) {
                const regex = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'i');
                return regex.test(lowerText);
            }
            return lowerText.includes(k);
        })
    )];

    // Extract contact info
    const emailMatch = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    const phoneMatch = text.match(/\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/);
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+|linkedin\.com|linkedin/i);
    const githubMatch = text.match(/github\.com\/[\w-]+|github\.com|github/i);

    return {
        skills: extractedSkills,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin: linkedinMatch ? linkedinMatch[0] : null,
        github: githubMatch ? githubMatch[0] : null,
        firstLine: lines[0] || '',
        lines: lines.slice(0, 10) // First 10 lines might contain name and summary
    };
};

module.exports = {
    calculateATSScore,
    generateSuggestions,
    extractResumeInfo,
    getEmptyScoreResult,
    KEYWORDS_DATABASE
};