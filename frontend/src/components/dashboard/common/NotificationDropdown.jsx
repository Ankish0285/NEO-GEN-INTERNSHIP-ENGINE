import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationService from '../../../services/notificationService';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data.slice(0, 5)); // Show only top 5
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'urgent': return <AlertTriangle size={16} className="text-red-500" />;
      case 'new': return <Bell size={16} className="text-green-500" />;
      case 'recurring': return <Calendar size={16} className="text-blue-500" />;
      default: return <Info size={16} className="text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={onClose}
          ></div>
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-3 w-80 origin-top-right glass-card py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none bg-white rounded-xl border border-gray-100"
          >
            <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <button className="text-xs text-orange-500 hover:underline">Mark all as read</button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification._id || notification.id} 
                    className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No new notifications</p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-gray-50 text-center">
              <button className="text-xs text-gray-900 font-semibold hover:text-orange-500 transition-colors">
                View all notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
