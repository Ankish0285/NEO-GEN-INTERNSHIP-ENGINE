import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import '../styles/atsScore.css';

const ATSScoreCard = ({ scoreData, isLoading = false }) => {
    // Safe default function to handle NaN and undefined values
    const getSafeValue = (value, fallback = 0) => {
        const num = Number(value);
        return isFinite(num) && num >= 0 && num <= 100 ? Math.round(num) : fallback;
    };

    if (!scoreData) {
        return (
            <div className="ats-score-container">
                <div className="empty-state">
                    <Zap size={48} />
                    <h3>No Resume Analyzed</h3>
                    <p>Upload your resume to see ATS score and analysis</p>
                </div>
            </div>
        );
    }

    // Extract data with safe defaults
    const score = getSafeValue(scoreData.score, 0);
    const breakdown = scoreData.breakdown || {};
    const suggestions = scoreData.suggestions || [];
    const matchedKeywords = scoreData.matchedKeywords || [];
    const missingKeywords = scoreData.missingKeywords || [];
    const sections = scoreData.sections || {};
    const extractedSkills = scoreData.extractedSkills || [];

    // Ensure breakdown values are safe numbers (0-100)
    const safeBreakdown = {
        technical: getSafeValue(breakdown.technical, 0),
        softSkills: getSafeValue(breakdown.softSkills, 0),
        experience: getSafeValue(breakdown.experience, 0),
        education: getSafeValue(breakdown.education, 0),
        completeness: getSafeValue(breakdown.completeness, 0),
        formatting: getSafeValue(breakdown.formatting, 0),
        contact: breakdown.contact ? Math.max(0, Math.min(3, Number(breakdown.contact))) : 0
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    const ScoreCircle = ({ value, label, size = 'large' }) => {
        const radius = size === 'large' ? 45 : 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;
        const color = getScoreColor(value);

        return (
            <div className={`score-circle ${size}`}>
                <svg width={size === 'large' ? 120 : 100} height={size === 'large' ? 120 : 100}>
                    <circle cx={size === 'large' ? 60 : 50} cy={size === 'large' ? 60 : 50} r={radius} className="circle-bg" />
                    <circle
                        cx={size === 'large' ? 60 : 50}
                        cy={size === 'large' ? 60 : 50}
                        r={radius}
                        className={`circle-progress ${color}`}
                        style={{ strokeDashoffset: offset }}
                    />
                </svg>
                <div className="score-text">
                    <span className="score-value">{value}</span>
                    <span className="score-label">{label}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="ats-score-container">
            {/* Main Score Section */}
            <div className="score-main">
                <div className="score-header">
                    <h2>ATS Resume Analysis</h2>
                    <div className="score-status">
                        <ScoreCircle value={score} label={getScoreLabel(score)} size="large" />
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="breakdown-grid">
                    <div className="breakdown-item">
                        <ScoreCircle value={safeBreakdown.technical} label="Technical" size="small" />
                        <p>Technical Skills</p>
                    </div>
                    <div className="breakdown-item">
                        <ScoreCircle value={safeBreakdown.softSkills} label="Soft Skills" size="small" />
                        <p>Soft Skills</p>
                    </div>
                    <div className="breakdown-item">
                        <ScoreCircle value={safeBreakdown.experience} label="Experience" size="small" />
                        <p>Experience</p>
                    </div>
                    <div className="breakdown-item">
                        <ScoreCircle value={safeBreakdown.education} label="Education" size="small" />
                        <p>Education</p>
                    </div>
                    <div className="breakdown-item">
                        <ScoreCircle value={safeBreakdown.completeness} label="Completeness" size="small" />
                        <p>Completeness</p>
                    </div>
                    <div className="breakdown-item">
                        <ScoreCircle value={breakdown.formatting} label="Formatting" size="small" />
                        <p>Formatting</p>
                    </div>
                </div>
            </div>

            {/* Sections Present */}
            <div className="sections-check">
                <h3>Resume Sections</h3>
                <div className="sections-grid">
                    {Object.entries(sections).map(([key, present]) => {
                        const labels = {
                            hasSummary: 'Summary/Objective',
                            hasExperience: 'Experience',
                            hasEducation: 'Education',
                            hasSkills: 'Skills Section',
                            hasProjects: 'Projects/Portfolio',
                            hasContact: 'Contact Info'
                        };
                        return (
                            <div key={key} className={`section-item ${present ? 'present' : 'missing'}`}>
                                {present ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span>{labels[key]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Improvement Suggestions */}
            {suggestions && suggestions.length > 0 && (
                <div className="suggestions-section">
                    <h3>
                        <Zap size={20} />
                        Improvement Suggestions
                    </h3>
                    <ul className="suggestions-list">
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>
                                <span className="suggestion-icon">•</span>
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Keywords Analysis */}
            <div className="keywords-section">
                <div className="keywords-column">
                    <h3>✓ Matched Keywords ({matchedKeywords.length})</h3>
                    <div className="keywords-list">
                        {matchedKeywords.slice(0, 12).map((keyword, index) => (
                            <span key={index} className="keyword matched">
                                {keyword}
                            </span>
                        ))}
                    </div>
                    {matchedKeywords.length > 12 && (
                        <p className="more-keywords">+{matchedKeywords.length - 12} more</p>
                    )}
                </div>

                <div className="keywords-column">
                    <h3>✗ Missing Keywords ({missingKeywords.length})</h3>
                    <div className="keywords-list">
                        {missingKeywords.slice(0, 12).map((keyword, index) => (
                            <span key={index} className="keyword missing">
                                {keyword}
                            </span>
                        ))}
                    </div>
                    {missingKeywords.length > 12 && (
                        <p className="more-keywords">+{missingKeywords.length - 12} more</p>
                    )}
                </div>
            </div>

            {/* Extracted Skills */}
            {extractedSkills && extractedSkills.length > 0 && (
                <div className="extracted-skills">
                    <h3>Extracted Skills</h3>
                    <div className="skills-cloud">
                        {extractedSkills.slice(0, 15).map((skill, index) => (
                            <span key={index} className="skill-tag">
                                {skill}
                            </span>
                        ))}
                    </div>
                    {extractedSkills.length > 15 && (
                        <p className="more-skills">+{extractedSkills.length - 15} more skills found</p>
                    )}
                </div>
            )}

            {/* Score Guide */}
            <div className="score-guide">
                <h3>ATS Score Guide</h3>
                <div className="guide-items">
                    <div className="guide-item excellent">
                        <strong>80-100:</strong> Excellent - Highly likely to pass ATS screening
                    </div>
                    <div className="guide-item good">
                        <strong>60-79:</strong> Good - Likely to pass ATS screening
                    </div>
                    <div className="guide-item fair">
                        <strong>40-59:</strong> Fair - May pass ATS, consider improvements
                    </div>
                    <div className="guide-item poor">
                        <strong>0-39:</strong> Needs Improvement - Review suggestions above
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ATSScoreCard;
