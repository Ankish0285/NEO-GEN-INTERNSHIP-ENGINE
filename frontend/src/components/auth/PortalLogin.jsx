import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Building2 } from 'lucide-react';

const portalMeta = {
  admin: {
    title: 'Super Admin Portal',
    subtitle: 'Platform management — users, internships, and system settings',
    icon: Shield,
    gradient: 'from-indigo-600 to-violet-700',
    ring: 'focus:ring-indigo-500',
    button: 'bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 focus:ring-indigo-500',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 bg-gradient-to-br ${meta.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{meta.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{meta.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${meta.ring}`}
              placeholder="you@organization.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
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
                className={`block w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${meta.ring} pr-10`}
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
