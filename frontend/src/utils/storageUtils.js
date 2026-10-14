// Storage utilities for managing Resume and Profile data

/** Normalize ATS payload from upload API or GET /resume/score */
export const normalizeAtsPayload = (raw) => {
    const data = raw?.data || raw || {};
    const breakdown = data.breakdown || {};
    return {
        score: data.atsScore ?? data.overallScore ?? data.score ?? null,
        breakdown: {
            technical: breakdown.technical ?? data.technical ?? 0,
            softSkills: breakdown.softSkills ?? data.softSkills ?? 0,
            experience: breakdown.experience ?? data.experience ?? 0,
            education: breakdown.education ?? data.education ?? 0,
            completeness: breakdown.completeness ?? data.completeness ?? 0,
            formatting: breakdown.formatting ?? data.formatting ?? 0,
            contact: breakdown.contact ?? data.contact ?? 0,
        },
        suggestions: data.suggestions || [],
        matchedKeywords: data.matchedKeywords || [],
        missingKeywords: data.missingKeywords || [],
        resumeUploaded: data.resumeUploaded !== false,
        fileName: data.fileName,
        uploadedAt: data.uploadedAt,
    };
};

const resumeKey = (userId) => (userId ? `userResume:${userId}` : null);
const atsKey = (userId) => (userId ? `resumeAtsScore:${userId}` : null);

export const saveResumeToStorage = (resumeData, fileName = null, userId = null) => {
    try {
        const score = resumeData.score ?? resumeData.atsScore ?? resumeData.overallScore ?? null;
        const resumeStorage = {
            ...resumeData,
            uploadedAt: new Date().toISOString(),
            fileName: fileName || resumeData.fileName || 'resume',
            fileSize: resumeData.fileSize || 0,
            resumeUploaded: true,
            atsScore: score,
            ownerId: userId || null,
        };
        const key = resumeKey(userId);
        if (key) localStorage.setItem(key, JSON.stringify(resumeStorage));
        localStorage.setItem('resumeUploaded', 'true');

        if (score !== undefined && atsKey(userId)) {
            localStorage.setItem(atsKey(userId), JSON.stringify({
                score,
                breakdown: resumeData.breakdown || {},
                uploadedAt: new Date().toISOString(),
                ownerId: userId || null,
            }));
        }
        return true;
    } catch (error) {
        console.error('Failed to save resume to localStorage:', error);
        return false;
    }
};

export const getResumeFromStorage = (userId = null) => {
    try {
        const key = resumeKey(userId);
        if (!key) return null;
        const resumeData = localStorage.getItem(key);
        return resumeData ? JSON.parse(resumeData) : null;
    } catch (error) {
        console.error('Failed to get resume from localStorage:', error);
        return null;
    }
};

export const getAtsScoreFromStorage = (userId = null) => {
    try {
        const key = atsKey(userId);
        if (!key) return null;
        const scoreData = localStorage.getItem(key);
        return scoreData ? JSON.parse(scoreData) : null;
    } catch (error) {
        console.error('Failed to get ATS score from localStorage:', error);
        return null;
    }
};

export const clearResumeStorage = (userId = null) => {
    try {
        const key = resumeKey(userId);
        const scoreKey = atsKey(userId);
        if (key) localStorage.removeItem(key);
        if (scoreKey) localStorage.removeItem(scoreKey);
        localStorage.removeItem('userResume');
        localStorage.removeItem('resumeUploaded');
        localStorage.removeItem('resumeAtsScore');
        return true;
    } catch (error) {
        console.error('Failed to clear resume storage:', error);
        return false;
    }
};

export const isResumeUploaded = () => {
    return localStorage.getItem('resumeUploaded') === 'true';
};

export const isProfileComplete = (profileData) => {
    // Check if profile has essential information
    const hasBasicInfo = profileData?.name && profileData?.email;
    const hasResume = isResumeUploaded();
    
    return hasBasicInfo && hasResume;
};

export const getProfileCompletionStatus = (profileData) => {
    const checks = {
        name: !!profileData?.name,
        email: !!profileData?.email,
        phone: !!profileData?.phone,
        university: !!profileData?.university,
        course: !!profileData?.course,
        skills: (profileData?.skills || []).length > 0,
        resume: isResumeUploaded(),
        profilePicture: !!profileData?.profilePicture
    };

    const completedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    const completionPercentage = Math.round((completedChecks / totalChecks) * 100);

    return {
        isComplete: checks.name && checks.email && checks.resume,
        percentage: completionPercentage,
        checks,
        completedChecks,
        totalChecks
    };
};
