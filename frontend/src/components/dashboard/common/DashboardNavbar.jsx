import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import { resolveStoryImageUrl } from '../../../utils/resolveStoryImageUrl';
import { roleConfig } from '../../../utils/roleConfig';

const DashboardNavbar = ({ onMenuClick, user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const panelConfig = roleConfig[user?.role] || roleConfig.student;
  const roleLabel =
    user?.role === 'admin' ? 'Administrator' : user?.role === 'partner' ? 'Partner' : 'Student';

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=FF9933&color=fff`;
  const rawPic = typeof user?.profilePicture === 'string' ? user.profilePicture.trim() : '';
  const avatarSrc =
    !rawPic || rawPic.startsWith('blob:')
      ? fallbackAvatar
      : resolveStoryImageUrl(rawPic) || fallbackAvatar;

  const handleLogout = () => {
    logout();
    navigate(panelConfig.loginPath || '/login');
  };

  const getSectionTitle = () => {
    const path = location.pathname;
    if (path.includes('website')) return 'Website Control';
    if (path.includes('users')) return 'User Management';
    if (path.includes('internships')) return 'Internships';
    if (path.includes('applications')) return 'Applications';
    if (path.includes('success-stories')) return 'Success Stories';
    if (path.includes('analytics')) return 'Analytics';
    if (path.includes('settings')) return 'Settings';
    if (path.includes('profile')) return 'Profile';
    if (path.endsWith('/dashboard') || path.endsWith('/dashboard/')) return 'Overview';
    return 'Dashboard';
  };

  const profilePath =
    user?.role === 'admin'
      ? '/admin/dashboard/profile'
      : user?.role === 'partner'
        ? '/partner/dashboard/profile'
        : '/dashboard/profile';

  const settingsPath =
    user?.role === 'admin'
      ? '/admin/dashboard/settings'
      : user?.role === 'partner'
        ? '/partner/dashboard/settings'
        : '/dashboard/settings';

  return (
    <header className="neo-topbar sticky top-0 z-30 px-4 sm:px-6 lg:px-8 h-[72px]">
      <div className="flex justify-between items-center h-full max-w-7xl mx-auto w-full pt-1">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-[#4B5563] hover:bg-[#FF9933]/10 hover:text-[#FF9933] transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden md:flex flex-col gap-1">
            <span className="neo-topbar__badge">{panelConfig.panelBadge}</span>
            <h1 className="neo-topbar__title">{getSectionTitle()}</h1>
          </div>
          <span className="md:hidden font-bold text-lg text-[#111827]">NeoGen</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input type="text" placeholder="Search..." className="neo-input !min-h-[42px] !py-2 !pl-10 w-56" />
          </div>

          <div className="relative">
            <button
              type="button"
              className={`p-2.5 rounded-xl transition-all relative ${
                isNotificationsOpen
                  ? 'bg-[#FF9933]/10 text-[#FF9933]'
                  : 'text-[#4B5563] hover:bg-[#FF9933]/10 hover:text-[#FF9933]'
              }`}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF9933] ring-2 ring-white" />
            </button>
            <NotificationDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/80 border border-transparent hover:border-black/5 transition-all"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <img
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[#FF9933]/30"
                src={avatarSrc}
                alt={user?.name || 'User'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackAvatar;
                }}
              />
              <div className="hidden md:block text-left pr-1">
                <p className="text-sm font-semibold text-[#111827] leading-tight">
                  {user?.name?.split(' ')[0]}
                </p>
                <p className="text-[10px] text-[#4B5563]">{roleLabel}</p>
              </div>
              <ChevronDown size={16} className="text-[#9CA3AF] hidden md:block" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                    aria-hidden="true"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="neo-glass absolute right-0 z-20 mt-2 w-56 py-2 !rounded-2xl"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="text-sm font-semibold text-[#111827]">{user?.name}</p>
                      <p className="text-xs text-[#4B5563] truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to={profilePath}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#e8f5e6] hover:text-[#138808]"
                      >
                        <User size={16} className="mr-3" /> Profile
                      </Link>
                      <Link
                        to={settingsPath}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#e8f5e6] hover:text-[#138808]"
                      >
                        <Settings size={16} className="mr-3" /> Settings
                      </Link>
                    </div>
                    <div className="py-1 border-t border-black/5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
