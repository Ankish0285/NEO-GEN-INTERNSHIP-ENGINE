import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/style.css'
import './styles/theme.css'
import './styles/admin.css'
import './index.css'
import './styles/neo-design-system.css'
import './styles/dashboard-admin.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)