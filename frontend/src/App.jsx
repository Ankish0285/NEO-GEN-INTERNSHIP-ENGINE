import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import FloatingChatbot from './components/ui/FloatingChatbot';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <AppRoutes />
          <FloatingChatbot />
        </SocketProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
