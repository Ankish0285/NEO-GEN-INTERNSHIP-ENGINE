import React from 'react';
import PortalLogin from '../../components/auth/PortalLogin';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const { loginAdmin } = useAuth();

  return (
    <PortalLogin
      portal="admin"
      onLogin={loginAdmin}
      redirectPath="/admin/dashboard"
    />
  );
};

export default AdminLogin;
