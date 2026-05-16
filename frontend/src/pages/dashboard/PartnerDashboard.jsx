import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/common/DashboardLayout';
import ProtectedRoute from '../../components/dashboard/common/ProtectedRoute';

const PartnerDashboard = () => {
  return (
    <ProtectedRoute allowedRoles={['partner']}>
      <DashboardLayout role="partner">
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default PartnerDashboard;
