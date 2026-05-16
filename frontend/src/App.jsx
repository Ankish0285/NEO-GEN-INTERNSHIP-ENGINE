import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import FloatingChatbot from './components/ui/FloatingChatbot';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <AppRoutes />
          <FloatingChatbot />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
