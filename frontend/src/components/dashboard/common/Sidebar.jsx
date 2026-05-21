import React from 'react';
import { X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { roleConfig } from '../../../utils/roleConfig';

const Sidebar = ({ isOpen, onClose, role = 'student' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const config = roleConfig[role] || roleConfig.student;
  const menuItems = config.menuItems;
  const isAdmin = role === 'admin';

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/');
  };

  const sidebarInner = (
    <div className="neo-sidebar flex flex-col h-full">
      <div className="neo-sidebar__brand">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="neo-sidebar__logo">N</div>
              <span className="text-xl font-extrabold tracking-tight text-[#111827]">
                Neo<span className="neo-brand-saffron">G</span>
                <span className="neo-brand-green">en</span>
              </span>
            </div>
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
              {item.label}
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
