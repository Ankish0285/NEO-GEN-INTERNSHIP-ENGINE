import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import FindInternship from '../pages/FindInternship';
import ResumeTemplates from '../pages/ResumeTemplates';
import ResumeBuilder from '../pages/ResumeBuilder';
import SuccessStoriesPublic from '../pages/SuccessStoriesPublic';

// SEO pages — internship detail + category pages
import InternshipRouter from '../pages/InternshipRouter';

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
import PartnerInternships from '../components/dashboard/partner/Internships';
import PartnerPostInternship from '../components/dashboard/partner/PostInternship';
import PartnerApplications from '../components/dashboard/partner/Applications';
import PartnerAnalytics from '../components/dashboard/partner/Analytics';
import PartnerSettings from '../components/dashboard/partner/Settings';
import StudentSupport from '../components/dashboard/support/StudentSupport';
import SupportInbox from '../components/dashboard/support/SupportInbox';

// Student Career Intelligence Components
import SkillEvidenceHub from '../components/dashboard/student/SkillEvidenceHub';
import SkillGapPriority from '../components/dashboard/student/SkillGapPriority';
import CareerActionPlan from '../components/dashboard/student/CareerActionPlan';
import InternshipReadiness from '../components/dashboard/student/InternshipReadiness';
import DigitalTwin from '../components/dashboard/student/DigitalTwin';
import CareerPathSimulator from '../components/dashboard/student/CareerPathSimulator';
import DigitalPassport from '../components/dashboard/student/DigitalPassport';
import ApplicationOutcomes from '../components/dashboard/student/ApplicationOutcomes';
import CompanyFeedback from '../components/dashboard/student/CompanyFeedback';

// Partner Career Intelligence Components
import CompletionWorkflow from '../components/dashboard/partner/CompletionWorkflow';
import CertificateWorkflow from '../components/dashboard/partner/CertificateWorkflow';

// Admin Career Intelligence Components
import CertificateManagement from '../components/dashboard/admin/CertificateManagement';
import CareerIntelligenceInsights from '../components/dashboard/admin/CareerIntelligenceInsights';

// Public Pages
import CertificateVerification from '../pages/CertificateVerification';

// Learning Resources
import LearningResourcesPublic from '../pages/LearningResourcesPublic';
import AdminLearningResources from '../components/dashboard/admin/LearningResources';
import StudentLearningResources from '../components/dashboard/student/LearningResources';
import PartnerLearningResources from '../components/dashboard/partner/LearningResources';

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
      <Route path="/resume-builder/:templateId" element={<ResumeBuilder />} />
      <Route path="/success-stories" element={<SuccessStoriesPublic />} />
      <Route path="/learning-resources" element={<LearningResourcesPublic />} />

      {/* SEO: /internships/:slug → category page OR internship detail page */}
      <Route path="/internships/:slug" element={<InternshipRouter />} />

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
        <Route path="skills/evidence" element={<SkillEvidenceHub />} />
        <Route path="skills/gaps" element={<SkillGapPriority />} />
        <Route path="career/action-plan" element={<CareerActionPlan />} />
        <Route path="career/readiness" element={<InternshipReadiness />} />
        <Route path="career/digital-twin" element={<DigitalTwin />} />
        <Route path="career/paths" element={<CareerPathSimulator />} />
        <Route path="passport" element={<DigitalPassport />} />
        <Route path="applications/outcomes" element={<ApplicationOutcomes />} />
        <Route path="feedback" element={<CompanyFeedback />} />
        <Route path="learning-resources" element={<StudentLearningResources />} />
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
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="career-insights" element={<CareerIntelligenceInsights />} />
        <Route path="learning-resources" element={<AdminLearningResources />} />
      </Route>

      {/* Partner Routes */}
      <Route path="/partner/dashboard" element={<PartnerDashboard />}>
        <Route index element={<PartnerOverview />} />
        <Route path="profile" element={<PartnerProfile />} />
        <Route path="internships" element={<PartnerInternships />} />
        <Route path="post-internship" element={<PartnerPostInternship />} />
        <Route path="applications" element={<PartnerApplications />} />
        <Route path="analytics" element={<PartnerAnalytics />} />
        <Route path="settings" element={<PartnerSettings />} />
        <Route path="support-inbox" element={<SupportInbox mode="partner" />} />
        <Route path="completion" element={<CompletionWorkflow />} />
        <Route path="certificates" element={<CertificateWorkflow />} />
        <Route path="learning-resources" element={<PartnerLearningResources />} />
      </Route>

      {/* Certificate Verification */}
      <Route path="/certificate/verify/:certificateId" element={<CertificateVerification />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
