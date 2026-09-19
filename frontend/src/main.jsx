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
// Only wrap with GoogleOAuthProvider when a real client ID is configured.
// Passing an empty string causes @react-oauth/google to emit errors in the console.
const app = googleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {app}
  </StrictMode>,
)
