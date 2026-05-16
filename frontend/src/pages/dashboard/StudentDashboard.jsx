import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Dashboard Components
import DashboardLayout from '../../components/dashboard/common/DashboardLayout';
import ProtectedRoute from '../../components/dashboard/common/ProtectedRoute';
import { StudentDashboardProvider } from '../../context/StudentDashboardContext';

const StudentDashboard = () => {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardProvider>
                <DashboardLayout role="student">
                    <Toaster position="top-right" />
                    <Outlet />
                </DashboardLayout>
            </StudentDashboardProvider>
        </ProtectedRoute>
    );
};

export default StudentDashboard;
