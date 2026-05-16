// Storage utilities for managing Resume and Profile data

export const saveResumeToStorage = (resumeData, fileName = null) => {
    try {
        const resumeStorage = {
            ...resumeData,
            uploadedAt: new Date().toISOString(),
            fileName: fileName || resumeData.fileName || 'resume',
            fileSize: resumeData.fileSize || 0,
            resumeUploaded: true,
            atsScore: resumeData.score || resumeData.atsScore || resumeData.overallScore || 0
        };
        localStorage.setItem('userResume', JSON.stringify(resumeStorage));
        localStorage.setItem('resumeUploaded', 'true');
        
        // Also save just the ATS score for quick access
        if (resumeData.score !== undefined || resumeData.atsScore !== undefined) {
            localStorage.setItem('resumeAtsScore', JSON.stringify({
                score: resumeData.score || resumeData.atsScore || resumeData.overallScore || 0,
                breakdown: resumeData.breakdown || {},
                uploadedAt: new Date().toISOString()
            }));
        }
        return true;
    } catch (error) {
        console.error('Failed to save resume to localStorage:', error);
        return false;
    }
};

export const getResumeFromStorage = () => {
    try {
        const resumeData = localStorage.getItem('userResume');
        return resumeData ? JSON.parse(resumeData) : null;
    } catch (error) {
        console.error('Failed to get resume from localStorage:', error);
        return null;
    }
};

export const getAtsScoreFromStorage = () => {
    try {
        const scoreData = localStorage.getItem('resumeAtsScore');
        return scoreData ? JSON.parse(scoreData) : null;
    } catch (error) {
        console.error('Failed to get ATS score from localStorage:', error);
        return null;
    }
};

export const clearResumeStorage = () => {
    try {
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
