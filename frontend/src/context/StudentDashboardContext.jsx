/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import ApplicationService from '../services/applicationService';

const StudentDashboardContext = createContext();

export const useStudentDashboard = () => {
    return useContext(StudentDashboardContext);
};

export const StudentDashboardProvider = ({ children }) => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Dashboard Data
    const [dashboardData, setDashboardData] = useState({
        totalApplications: 0,
        pendingReviews: 0,
        accepted: 0,
        atsScore: 0,
        recommendedInternships: []
    });

    const [applications, setApplications] = useState([]);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        profilePicture: user?.profilePicture || '',
        university: user?.university || '',
        course: user?.course || '',
        skills: user?.skills || [],
        profileCompletionPercentage: user?.profileCompletionPercentage || 0
    });

    // ATS State
    const [atsScoreData, setAtsScoreData] = useState(null);
    const [loadingAtsScore, setLoadingAtsScore] = useState(false);

    // Demo ATS data
    const demoAtsData = {
        score: 0,
        breakdown: {
            technical: 0, softSkills: 0, experience: 0, education: 0, completeness: 0, formatting: 0, contact: 0
        },
        suggestions: [
            'Upload your resume to get detailed ATS analysis',
            'Our analyzer checks technical skills, experience, education, and soft skills'
        ],
        isDemoData: true
    };

    const loadDashboardData = async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            setError('');
            
            // 1. Fetch dashboard summary
            try {
                const summary = await api.get('/dashboard/summary');
                setDashboardData(summary);
            } catch (err) {
                console.error("Error fetching summary", err);
            }
            
            // 2. Fetch complete profile data
            try {
                const profileDataResponse = await api.get('/profile/me');
                setProfileData({
                    name: profileDataResponse.name || '',
                    email: profileDataResponse.email || '',
                    phone: profileDataResponse.phone || '',
                    profilePicture: profileDataResponse.profilePicture || '',
                    university: profileDataResponse.university || '',
                    course: profileDataResponse.course || '',
                    skills: profileDataResponse.skills || [],
                    profileCompletionPercentage: profileDataResponse.profileCompletionPercentage || 0
                });
                updateUser({
                    name: profileDataResponse.name,
                    phone: profileDataResponse.phone || '',
                    profilePicture: profileDataResponse.profilePicture || '',
                    university: profileDataResponse.university || '',
                    course: profileDataResponse.course || '',
                    profileCompletionPercentage: profileDataResponse.profileCompletionPercentage ?? 0,
                });
            } catch (err) {
                console.log('Profile data not available, using user context');
            }
            
            // 3. Fetch applications
            try {
                const applicationsData = await ApplicationService.getMyApplications();
                setApplications(applicationsData);
            } catch (err) {
                console.error("Error fetching applications", err);
            }

            // 4. Fetch ATS score
            await loadAtsScore();

        } catch (err) {
            console.error('Dashboard load error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadAtsScore = async () => {
        try {
            setLoadingAtsScore(true);
            
            // Check local storage first
            const storedResume = localStorage.getItem('resumeData');
            let scoreData;

            if (storedResume) {
                try {
                    scoreData = JSON.parse(storedResume);
                } catch (e) {
                    console.error("Error parsing stored resume", e);
                }
            }

            // If not in local storage, try API
            if (!scoreData) {
                 try {
                    scoreData = await api.get('/resume/score');
                 } catch (e) {
                     // Ignore
                 }
            }
            
            if (!scoreData || (!scoreData.resumeUploaded && scoreData.score === 0)) {
                 setAtsScoreData(demoAtsData);
                 return;
            }
            
            // Normalize data
            const safeScoreData = {
                ...scoreData,
                score: scoreData.score ?? scoreData.overallScore ?? 0,
                breakdown: {
                    technical: scoreData.breakdown?.technical ?? scoreData.technical ?? 0,
                    softSkills: scoreData.breakdown?.softSkills ?? scoreData.softSkills ?? 0,
                    experience: scoreData.breakdown?.experience ?? scoreData.experience ?? 0,
                    education: scoreData.breakdown?.education ?? scoreData.education ?? 0,
                    completeness: scoreData.breakdown?.completeness ?? scoreData.completeness ?? 0,
                    formatting: scoreData.breakdown?.formatting ?? scoreData.formatting ?? 0,
                    contact: scoreData.breakdown?.contact ?? scoreData.contact ?? 0
                },
                suggestions: scoreData.suggestions || [],
                matchedKeywords: scoreData.matchedKeywords || [],
                missingKeywords: scoreData.missingKeywords || [],
                isDemoData: false
            };
            
            setAtsScoreData(safeScoreData);
            
        } catch (error) {
            console.log('No resume score available yet, showing demo');
            setAtsScoreData(demoAtsData);
        } finally {
            setLoadingAtsScore(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated]);

    const handleResumeUploadSuccess = (data) => {
        console.log('Upload success data:', data);
        
        // Handle potential nested data structure from API response
        const responseData = data?.data || data;
        console.log('Processed response data:', responseData);
        
        // Update atsScoreData directly from upload response to avoid delay
        const safeScoreData = {
            score: responseData?.atsScore || responseData?.overallScore || responseData?.score || 0,
            breakdown: responseData?.breakdown || {
                technical: responseData?.technical || 0,
                softSkills: responseData?.softSkills || 0,
                experience: responseData?.experience || 0,
                education: responseData?.education || 0,
                formatting: responseData?.formatting || 0,
                contact: responseData?.contact || 0,
                completeness: responseData?.completeness || 0
            },
            suggestions: responseData?.suggestions || [],
            matchedKeywords: responseData?.matchedKeywords || [],
            missingKeywords: responseData?.missingKeywords || [],
            isDemoData: false
        };
        
        console.log('Setting atsScoreData:', safeScoreData);
        setAtsScoreData(safeScoreData);
        
        // Also update dashboard summary if needed
        api.get('/dashboard/summary').then(summary => {
            console.log('Updated dashboard summary:', summary);
            setDashboardData(summary);
        }).catch(err => console.error('Error updating summary:', err));
    };

    const value = {
        dashboardData,
        profileData,
        setProfileData,
        atsScoreData,
        applications,
        loading,
        loadingAtsScore,
        onResumeUploadSuccess: handleResumeUploadSuccess,
        refreshDashboard: loadDashboardData
    };

    return (
        <StudentDashboardContext.Provider value={value}>
            {children}
        </StudentDashboardContext.Provider>
    );
};
