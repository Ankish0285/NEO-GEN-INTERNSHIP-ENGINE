/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import ApplicationService from '../services/applicationService';
import {
    getResumeFromStorage,
    normalizeAtsPayload,
    saveResumeToStorage,
} from '../utils/storageUtils';

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

    // ATS State — null until a real resume is analyzed
    const [atsScoreData, setAtsScoreData] = useState(null);
    const [loadingAtsScore, setLoadingAtsScore] = useState(false);

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

            let scoreData = null;
            try {
                scoreData = await api.get('/resume/score');
            } catch {
                /* no resume on server yet */
            }

            if (!scoreData?.resumeUploaded && scoreData?.score === 0) {
                scoreData = getResumeFromStorage();
            }

            if (!scoreData || (!scoreData.resumeUploaded && (scoreData.score ?? scoreData.atsScore ?? 0) === 0)) {
                setAtsScoreData(null);
                return;
            }

            setAtsScoreData(normalizeAtsPayload(scoreData));
        } catch (error) {
            console.log('No resume score available yet');
            setAtsScoreData(null);
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
        if (!data) return;

        const raw = data?.data || data;
        const safeScoreData = normalizeAtsPayload(raw);
        saveResumeToStorage({ ...raw, ...safeScoreData }, raw?.fileName);

        setAtsScoreData(safeScoreData);
        setDashboardData((prev) => ({ ...prev, atsScore: safeScoreData.score }));

        api.get('/dashboard/summary')
            .then((summary) => setDashboardData(summary))
            .catch((err) => console.error('Error updating summary:', err));
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
        refreshDashboard: loadDashboardData,
        refreshAtsScore: loadAtsScore,
    };

    return (
        <StudentDashboardContext.Provider value={value}>
            {children}
        </StudentDashboardContext.Provider>
    );
};
