import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginModal from '../../components/LoginModal';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  return (
    <div className="neo-auth-page min-h-screen flex items-center justify-center py-12 px-4">
      <LoginModal
        isOpen
        embedded
        onClose={() => navigate('/')}
        initialTab={initialTab}
      />
    </div>
  );
};

export default Login;
