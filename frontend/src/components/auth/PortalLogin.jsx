import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Building2 } from 'lucide-react';

const portalMeta = {
  admin: {
    title: 'Super Admin Portal',
    subtitle: 'Platform management — users, internships, and system settings',
    icon: Shield,
    gradient: 'from-[#FF9933] to-[#ffb347]',
    ring: 'focus:ring-[#FF9933]',
    button: 'admin-btn-primary w-full',
    pageClass: 'admin-login-page',
    cardClass: 'neo-admin-card',
    otherPortal: { label: 'Partner Portal', path: '/partner/login' },
    homeHint: 'Student login',
    homePath: '/login',
  },
  partner: {
    title: 'Partner Portal',
    subtitle: 'Manage your organization’s internships and applications',
    icon: Building2,
    gradient: 'from-amber-500 to-orange-600',
    ring: 'focus:ring-amber-500',
    button: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:ring-amber-500',
    otherPortal: { label: 'Super Admin Portal', path: '/admin/login' },
    homeHint: 'Student login',
    homePath: '/login',
  },
};

const PortalLogin = ({ portal, onLogin, redirectPath }) => {
  const navigate = useNavigate();
  const meta = portalMeta[portal];
  const Icon = meta.icon;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await onLogin(formData.email, formData.password);
      if (result.success) {
        navigate(redirectPath, { replace: true });
      } else {
        setError(result.message || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdminPortal = portal === 'admin';

  return (
    <div className={meta.pageClass || 'neo-auth-page'}>
      <div className={`${meta.cardClass || 'neo-auth-card neo-glass max-w-md w-full space-y-8'}`}>
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 bg-gradient-to-br ${meta.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">{meta.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{meta.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className={isAdminPortal ? 'admin-label' : 'block text-sm font-medium text-slate-700 mb-1'}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={isAdminPortal ? 'admin-input' : `block w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${meta.ring}`}
              placeholder="you@organization.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={isAdminPortal ? 'admin-label' : 'block text-sm font-medium text-slate-700 mb-1'}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className={isAdminPortal ? 'admin-input pr-12' : `block w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${meta.ring} pr-10`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-lg text-white transition ${meta.button} ${
              isLoading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 space-y-2 pt-2 border-t border-slate-100">
          <p>
            <Link to={meta.otherPortal.path} className="font-medium text-slate-700 hover:underline">
              {meta.otherPortal.label}
            </Link>
          </p>
          <p>
            <Link to={meta.homePath} className="text-slate-500 hover:text-slate-700">
              ← {meta.homeHint}
            </Link>
            {' · '}
            <Link to="/" className="text-slate-500 hover:text-slate-700">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalLogin;
