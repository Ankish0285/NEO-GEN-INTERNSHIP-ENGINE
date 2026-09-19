import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import GlobalAIChat from './components/ai/GlobalAIChat';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <AppRoutes />
          {/* Single global AI chatbot — only renders for authenticated students */}
          <GlobalAIChat />
        </SocketProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
