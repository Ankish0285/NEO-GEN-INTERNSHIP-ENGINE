import React from 'react';
import PortalLogin from '../../components/auth/PortalLogin';
import { useAuth } from '../../context/AuthContext';

const PartnerLogin = () => {
  const { loginPartner } = useAuth();

  return (
    <PortalLogin
      portal="partner"
      onLogin={loginPartner}
      redirectPath="/partner/dashboard"
    />
  );
};

export default PartnerLogin;
