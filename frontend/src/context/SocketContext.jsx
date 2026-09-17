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
    // Connect to backend Socket.IO server
    const socketUrl =
      import.meta.env.VITE_API_ORIGIN || window.location.origin;

    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log(
        '[Socket] New global notification received:',
        notification
      );

      toast.success(notification.title, {
        description: notification.message,
        duration: 6000,
      });

      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    };

    const handleTicketUpdated = () => {
      window.dispatchEvent(new CustomEvent('refreshSupportUnread'));
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    };

    socket.on('newNotification', handleNewNotification);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      socket.off('newNotification', handleNewNotification);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [socket, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
