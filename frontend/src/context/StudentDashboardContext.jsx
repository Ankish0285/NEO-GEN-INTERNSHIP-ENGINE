/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import ApplicationService from '../services/applicationService';
import { unwrapData } from '../utils/apiData';
import {
    normalizeAtsPayload,
    saveResumeToStorage,
} from '../utils/storageUtils';

const StudentDashboardContext = createContext();

export const useStudentDashboard = () => {
    return useContext(StudentDashboardContext);
};

const dispatchMetricsRefresh = () => {
    window.dispatchEvent(new CustomEvent('ai:refresh'));
};

export const StudentDashboardProvider = ({ children }) => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const userId = user?._id || user?.id;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    const [dashboardData, setDashboardData] = useState({
        totalApplications: 0,
        pendingReviews: 0,
        accepted: 0,
        atsScore: null,
        recommendedInternships: []
    });

    const [applications, setApplications] = useState([]);

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

    const [atsScoreData, setAtsScoreData] = useState(null);
    const [loadingAtsScore, setLoadingAtsScore] = useState(false);

    const loadMetrics = useCallback(async () => {
        if (!isAuthenticated) return null;
        setLoadingMetrics(true);
        try {
            const res = await api.get('/metrics/student');
            const data = unwrapData(res);
            setMetrics(data);
            if (data?.atsScore != null) {
                setDashboardData((prev) => ({ ...prev, atsScore: data.atsScore }));
            }
            return data;
        } catch (err) {
            console.error('Error fetching student metrics', err);
            return null;
        } finally {
            setLoadingMetrics(false);
        }
    }, [isAuthenticated]);

    const loadAtsScore = useCallback(async () => {
        try {
            setLoadingAtsScore(true);

            let scoreData = null;
            try {
                scoreData = await api.get('/resume/score');
            } catch {
                /* no resume on server yet */
            }

            // Server is the canonical source. Do NOT fall back to stale localStorage
            // when the server reports no resume — that would fabricate a score.
            if (!scoreData || scoreData.resumeUploaded === false) {
                setAtsScoreData(null);
                return;
            }

            const canonical = await loadMetrics();
            const normalized = normalizeAtsPayload(scoreData);
            if (canonical?.atsScore != null) {
                normalized.score = canonical.atsScore;
            }
            setAtsScoreData(normalized);
        } catch {
            console.log('No resume score available yet');
            setAtsScoreData(null);
        } finally {
            setLoadingAtsScore(false);
        }
    }, [loadMetrics]);

    const loadDashboardData = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            setError('');

            try {
                const summary = await api.get('/dashboard/summary');
                setDashboardData(summary);
            } catch (err) {
                console.error('Error fetching summary', err);
            }

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
            } catch {
                console.log('Profile data not available, using user context');
            }

            try {
                const applicationsData = await ApplicationService.getMyApplications();
                setApplications(applicationsData);
            } catch (err) {
                console.error('Error fetching applications', err);
            }

            await loadAtsScore();
            await loadMetrics();
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, loadAtsScore, loadMetrics]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        }
    }, [isAuthenticated, loadDashboardData]);

    const handleResumeUploadSuccess = (data) => {
        if (!data) return;

        const raw = data?.data || data;
        const safeScoreData = normalizeAtsPayload(raw);
        saveResumeToStorage({ ...raw, ...safeScoreData }, raw?.fileName, userId);

        setAtsScoreData(safeScoreData);
        if (safeScoreData.score != null) {
            setDashboardData((prev) => ({ ...prev, atsScore: safeScoreData.score }));
        }

        api.get('/dashboard/summary')
            .then((summary) => setDashboardData(summary))
            .catch((err) => console.error('Error updating summary:', err));

        loadMetrics().then(() => dispatchMetricsRefresh());
    };

    const refreshAfterAnalysis = async () => {
        await loadMetrics();
        await loadAtsScore();
        try {
            const summary = await api.get('/dashboard/summary');
            setDashboardData(summary);
        } catch (err) {
            console.error('Error updating summary:', err);
        }
        dispatchMetricsRefresh();
    };

    const value = {
        dashboardData,
        profileData,
        setProfileData,
        atsScoreData,
        metrics,
        loadingMetrics,
        applications,
        loading,
        loadingAtsScore,
        onResumeUploadSuccess: handleResumeUploadSuccess,
        refreshDashboard: loadDashboardData,
        refreshAtsScore: loadAtsScore,
        refreshMetrics: loadMetrics,
        refreshAfterAnalysis,
    };

    return (
        <StudentDashboardContext.Provider value={value}>
            {children}
        </StudentDashboardContext.Provider>
    );
};
