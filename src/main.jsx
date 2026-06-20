import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// PrimeReact resources
import 'primereact/resources/themes/lara-light-blue/theme.css' // Theme (base)
import 'primereact/resources/primereact.min.css'               // Core CSS
import 'primeicons/primeicons.css'                             // Icons
import 'primeflex/primeflex.css'                               // PrimeFlex utilities

import './styles/premium.css'

import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
