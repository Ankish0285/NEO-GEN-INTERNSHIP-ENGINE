/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Connect to socket server
    const newSocket = io();
    setSocket(newSocket);

    // Cleanup on unmount
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for global notifications
    socket.on('newNotification', (notification) => {
      console.log('[Socket] New global notification received:', notification);
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000,
      });
      // Optionally trigger a notification refresh in the UI
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    });

    // Listen for personal notifications if authenticated
    if (isAuthenticated && user?._id) {
      socket.emit('joinUser', user._id);

      socket.on('ai:analysis:complete', (payload) => {
        toast.success(`AI analysis complete — ATS ${payload?.atsScore ?? ''}%`);
        window.dispatchEvent(new CustomEvent('ai:refresh'));
      });
      socket.on('ai:recommendations:updated', () => {
        window.dispatchEvent(new CustomEvent('ai:refresh'));
      });

      const personalEvent = `newNotification:${user._id}`;
      socket.on(personalEvent, (notification) => {
        console.log('[Socket] New personal notification received:', notification);
        toast.success(notification.title, {
          description: notification.message,
          duration: 6000,
        });
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      });

      return () => {
        socket.off('ai:analysis:complete');
        socket.off('ai:recommendations:updated');
        socket.off(personalEvent);
      };
    }

    return () => {
      socket.off('newNotification');
    };
  }, [socket, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
