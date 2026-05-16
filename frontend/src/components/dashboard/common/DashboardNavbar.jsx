import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';

const DashboardNavbar = ({ onMenuClick, user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;
  const rawPic = typeof user?.profilePicture === 'string' ? user.profilePicture.trim() : '';
  const avatarSrc =
    !rawPic || rawPic.startsWith('blob:')
      ? fallbackAvatar
      : (resolveStoryImageUrl(rawPic) || fallbackAvatar);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getSectionTitle = () => {
      const path = location.pathname;
      if (path.endsWith('/dashboard') || path.endsWith('/dashboard/')) return 'Dashboard';
      if (path.includes('profile')) return 'My Profile';
      if (path.includes('ats-resume')) return 'ATS Resume Scanner';
      if (path.includes('applications')) return 'My Applications';
      if (path.includes('recommendations')) return 'Recommended Jobs';
      if (path.includes('analytics')) return 'Analytics & Insights';
      if (path.includes('settings')) return 'Settings';
      return 'Dashboard';
  }

  return (
    <header className="glass-card rounded-none border-b border-navy/10 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 h-16 rounded-b-[20px] shadow-sm mb-4">
        <div className="flex justify-between items-center h-full max-w-7xl mx-auto w-full">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={onMenuClick}
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:flex flex-col">
                <h1 className="text-xl font-bold text-navy">{getSectionTitle()}</h1>
            </div>
            
            <span className="md:hidden font-bold text-lg text-navy">NeoGen</span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Search Bar (Optional) */}
            <div className="hidden lg:flex items-center relative mr-2">
                <Search size={18} className="absolute left-3 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="pl-10 pr-4 py-2 bg-white/50 border border-navy/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 focus:border-saffron transition-all w-64"
                />
            </div>

            <div className="relative">
              <button 
                className={`p-2 rounded-lg transition-all relative ${isNotificationsOpen ? 'text-saffron bg-saffron/10' : 'text-gray-500 hover:text-saffron hover:bg-saffron/10'}`}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-saffron ring-2 ring-white" />
              </button>

              <NotificationDropdown 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>

            <div className="relative">
              <button 
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-white/50 transition-colors border border-transparent hover:border-navy/10"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <img 
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-navy/5" 
                  src={avatarSrc}
                  alt={user?.name || 'User'} 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackAvatar;
                  }}
                />
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-navy leading-none">{user?.name?.split(' ')[0]}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                    <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-20 mt-3 w-56 origin-top-right glass-card py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                    >
                        <div className="px-4 py-3 border-b border-navy/5">
                            <p className="text-sm font-semibold text-navy">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                            <Link 
                                to={user?.role === 'admin' ? '/admin/dashboard/profile' : user?.role === 'partner' ? '/partner/dashboard/profile' : '/dashboard/profile'}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
                            >
                                <User size={16} className="mr-3" /> Profile
                            </Link>
                            <Link 
                                to={user?.role === 'admin' ? '/admin/dashboard/settings' : user?.role === 'partner' ? '/partner/dashboard/settings' : '/dashboard/settings'}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
                            >
                                <Settings size={16} className="mr-3" /> Settings
                            </Link>
                        </div>
                        <div className="py-1 border-t border-gray-50">
                            <button 
                                onClick={handleLogout}
                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={16} className="mr-3" /> Sign out
                            </button>
                        </div>
                    </motion.div>
                    </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
    </header>
  );
};

export default DashboardNavbar;
