/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();
  // Track consecutive errors to throttle log spam — never block rendering
  const errorCountRef = useRef(0);

  useEffect(() => {
    // Socket URL: always the backend origin (not the Vite dev server port)
    const socketUrl =
      import.meta.env.VITE_API_ORIGIN ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

    let newSocket;
    try {
      newSocket = io(socketUrl, {
        // Try WebSocket first; polling only as fallback to reduce CORS issues
        transports: ['websocket', 'polling'],
        withCredentials: true,
        // Reconnection settings — limit retries so offline backend doesn't hammer
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        // Don't auto-connect synchronously; gives React time to render first
        autoConnect: false,
        timeout: 10000,
      });
    } catch (err) {
      // io() itself failed (e.g. invalid URL) — log and bail; never crash the tree
      console.warn('[Socket] Failed to create socket instance:', err.message);
      return;
    }

    newSocket.on('connect', () => {
      errorCountRef.current = 0;
      console.log('[Socket] Connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      errorCountRef.current += 1;
      // Only log the first few errors — suppress repetitive noise
      if (errorCountRef.current <= 3) {
        console.warn(
          `[Socket] Connection error (attempt ${errorCountRef.current}):`,
          error.message
        );
      } else if (errorCountRef.current === 4) {
        console.warn('[Socket] Further connection errors suppressed. Backend may be offline.');
      }
      // Never throw — let the rest of the app render normally
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    setSocket(newSocket);
    // Defer connection so it doesn't block the initial render
    newSocket.connect();

    return () => {
      newSocket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log('[Socket] New global notification:', notification?.title);
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
