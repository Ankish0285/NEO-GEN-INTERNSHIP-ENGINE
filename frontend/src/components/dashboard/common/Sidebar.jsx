import React from 'react';
import { 
  X,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { roleConfig } from '../../../utils/roleConfig';

const Sidebar = ({ isOpen, onClose, role = 'student' }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = roleConfig[role]?.menuItems || roleConfig.student.menuItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full glass-card rounded-none rounded-r-[24px] border-r border-navy/10 shadow-lg">
      <div className="h-20 flex items-center px-8 border-b border-navy/5">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 bg-gradient-to-br from-saffron to-[#ffad5c] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md rotate-3">
            N
          </div>
          <span className="text-2xl font-black text-navy tracking-tight">Neo<span className="text-saffron">Gen</span></span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 py-6 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `
                group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-saffron/10 to-transparent text-navy border-l-4 border-saffron-hover shadow-sm font-bold' 
                  : 'text-sub hover:bg-black/5 hover:text-navy'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`
                      mr-3 flex-shrink-0 h-5 w-5 transition-transform duration-300 group-hover:scale-110
                      ${isActive ? 'text-saffron-hover' : 'text-navy/50 group-hover:text-navy'}
                    `} 
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut size={18} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[280px] glass-card rounded-none rounded-r-[24px] border-r border-navy/10 shadow-xl transition-transform duration-300 transform md:relative md:translate-x-0 md:inset-auto md:shadow-none md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
