import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import FindInternship from '../pages/FindInternship';
import ResumeTemplates from '../pages/ResumeTemplates';
import SuccessStoriesPublic from '../pages/SuccessStoriesPublic';

// Dashboard Wrappers
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import PartnerDashboard from '../pages/dashboard/PartnerDashboard';

// Student Components
import StudentOverview from '../components/dashboard/student/Overview';
import StudentProfile from '../components/dashboard/student/Profile';
import ATSResume from '../components/dashboard/student/ATSResume';
import StudentApplications from '../components/dashboard/student/Applications';
import StudentRecommendations from '../components/dashboard/student/Recommendations';
import AIIntelligenceHub from '../components/ai/AIIntelligenceHub';
import StudentAnalytics from '../components/dashboard/student/Analytics';
import StudentSettings from '../components/dashboard/student/Settings';
import SuccessStories from '../components/dashboard/student/SuccessStories';

// Admin Components
import AdminOverview from '../components/dashboard/admin/Overview';
import AdminProfile from '../components/dashboard/admin/Profile';
import AdminUsers from '../components/dashboard/admin/Users';
import AdminInternships from '../components/dashboard/admin/Internships';
import AdminApplications from '../components/dashboard/admin/Applications';
import AdminAnalytics from '../components/dashboard/admin/Analytics';
import AdminSettings from '../components/dashboard/admin/Settings';
import AdminSuccessStories from '../components/dashboard/admin/SuccessStories';
import WebsiteCMS from '../components/dashboard/admin/WebsiteCMS';
import SubscriptionManagement from '../components/dashboard/admin/SubscriptionManagement';

// Partner Components
import PartnerOverview from '../components/dashboard/partner/Overview';
import PartnerProfile from '../components/dashboard/partner/Profile';
import PartnerPostInternship from '../components/dashboard/partner/PostInternship';
import PartnerApplications from '../components/dashboard/partner/Applications';
import PartnerAnalytics from '../components/dashboard/partner/Analytics';
import PartnerSettings from '../components/dashboard/partner/Settings';
import StudentSupport from '../components/dashboard/support/StudentSupport';
import SupportInbox from '../components/dashboard/support/SupportInbox';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/partner/login" element={<Navigate to="/login" replace />} />
      <Route path="/find-internship" element={<FindInternship />} />
      <Route path="/resources/resume-templates" element={<ResumeTemplates />} />
      <Route path="/success-stories" element={<SuccessStoriesPublic />} />

      {/* Student Routes */}
      <Route path="/dashboard" element={<StudentDashboard />}>
        <Route index element={<StudentOverview />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="ats-resume" element={<ATSResume />} />
        <Route path="ai-intelligence" element={<AIIntelligenceHub />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="recommendations" element={<StudentRecommendations />} />
        <Route path="analytics" element={<StudentAnalytics />} />
        <Route path="settings" element={<StudentSettings />} />
        <Route path="success-stories" element={<SuccessStories />} />
        <Route path="support" element={<StudentSupport />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />}>
        <Route index element={<AdminOverview />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="website" element={<WebsiteCMS />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="internships" element={<AdminInternships />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="success-stories" element={<AdminSuccessStories />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="support-inbox" element={<SupportInbox mode="admin" />} />
      </Route>

      {/* Partner Routes */}
      <Route path="/partner/dashboard" element={<PartnerDashboard />}>
        <Route index element={<PartnerOverview />} />
        <Route path="profile" element={<PartnerProfile />} />
        <Route path="post-internship" element={<PartnerPostInternship />} />
        <Route path="applications" element={<PartnerApplications />} />
        <Route path="analytics" element={<PartnerAnalytics />} />
        <Route path="settings" element={<PartnerSettings />} />
        <Route path="support-inbox" element={<SupportInbox mode="partner" />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
