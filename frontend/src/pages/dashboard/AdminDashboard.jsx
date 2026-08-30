import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/common/DashboardLayout';
import ProtectedRoute from '../../components/dashboard/common/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const layoutRole = user?.role === 'super_admin' ? 'super_admin' : 'admin';
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <DashboardLayout role={layoutRole}>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
