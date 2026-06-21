import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { locale, addLocale } from 'primereact/api'

// PrimeReact resources
import 'primereact/resources/themes/lara-light-blue/theme.css' // Theme (base)
import 'primereact/resources/primereact.min.css'               // Core CSS
import 'primeicons/primeicons.css'                             // Icons
import 'primeflex/primeflex.css'                               // PrimeFlex utilities

import './styles/premium.css'

import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// Configurar PrimeReact en español de forma global
addLocale('es', {
    accept: 'Sí',
    reject: 'No',
    choose: 'Elegir',
    upload: 'Subir',
    cancel: 'Cancelar',
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy',
    clear: 'Limpiar',
    weekHeader: 'Sm',
    firstDayOfWeek: 1,
    dateFormat: 'dd/mm/yy',
    weak: 'Débil',
    medium: 'Medio',
    strong: 'Fuerte',
    passwordPrompt: 'Escriba una contraseña',
    emptyFilterMessage: 'No se encontraron resultados',
    emptyMessage: 'No hay opciones disponibles'
});

locale('es');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
