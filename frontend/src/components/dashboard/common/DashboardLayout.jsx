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
    <div className="min-h-screen bg-theme-grid flex flex-col font-sans">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          role={currentRole}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <DashboardNavbar 
                onMenuClick={() => setIsSidebarOpen(true)} 
                user={user}
            />
            
            <main className="flex-1 overflow-y-auto p-6 relative scroll-smooth">
                {/* Grid is handled by bg-theme-grid */}
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-7xl mx-auto relative z-10"
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
