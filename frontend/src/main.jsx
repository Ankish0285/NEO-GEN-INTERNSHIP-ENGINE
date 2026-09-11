import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import './styles/style.css'
import './styles/theme.css'
import './styles/admin.css'
import './index.css'
import './styles/neo-design-system.css'
import './styles/dashboard-admin.css'

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const app = <App />;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {app}
      </GoogleOAuthProvider>
    ) : (
      app
    )}
  </StrictMode>,
)
