import React, { useState, useEffect, useCallback } from 'react';
import { X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { roleConfig } from '../../../utils/roleConfig';
import DashboardBrand from './DashboardBrand';
import SupportTicketService from '../../../services/supportTicketService';

const Sidebar = ({ isOpen, onClose, role = 'student' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [supportUnread, setSupportUnread] = useState(0);

  const fetchSupportUnread = useCallback(async () => {
    try {
      const res = await SupportTicketService.getUnreadCount();
      setSupportUnread(res.count || 0);
    } catch {
      setSupportUnread(0);
    }
  }, []);

  useEffect(() => {
    fetchSupportUnread();
    const handler = () => fetchSupportUnread();
    window.addEventListener('refreshSupportUnread', handler);
    return () => window.removeEventListener('refreshSupportUnread', handler);
  }, [fetchSupportUnread, role]);

  const config = roleConfig[role] || roleConfig.student;
  const menuItems = config.menuItems;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarInner = (
    <div className="neo-sidebar flex flex-col h-full">
      <div className="neo-sidebar__brand">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <DashboardBrand variant="sidebar" showSubtitle />
            <span className="neo-topbar__badge w-fit">{config.panelBadge}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#4B5563] hover:bg-black/5 md:hidden shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
          {config.panelTitle}
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx('neo-dash-nav-link', isActive && 'neo-dash-nav-link--active')
              }
            >
              <Icon size={20} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.supportMenu && supportUnread > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF9933] text-white text-[10px] font-bold flex items-center justify-center">
                  {supportUnread > 99 ? '99+' : supportUnread}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-black/5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 neo-overlay transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 transform md:relative md:translate-x-0 md:inset-auto md:z-auto shadow-xl md:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarInner}
      </div>
    </>
  );
};

export default Sidebar;
