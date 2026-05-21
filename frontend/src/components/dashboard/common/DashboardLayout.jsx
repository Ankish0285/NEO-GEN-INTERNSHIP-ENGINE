import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardNavbar from './DashboardNavbar';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';

const DashboardLayout = ({ children, role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const currentRole = role || user?.role || 'student';

  return (
    <div className="neo-dashboard admin-dashboard min-h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          role={currentRole}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardNavbar onMenuClick={() => setIsSidebarOpen(true)} user={user} />

          <main className="neo-main flex-1 overflow-y-auto scroll-smooth">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
