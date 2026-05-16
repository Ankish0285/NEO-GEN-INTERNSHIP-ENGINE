import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/common/DashboardLayout';
import ProtectedRoute from '../../components/dashboard/common/ProtectedRoute';

const AdminDashboard = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout role="admin">
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
