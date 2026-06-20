import React, { useState, useEffect } from 'react';
import Acceso from './components/Acceso';
import PanelPrincipal from './components/PanelPrincipal';
import { authService, onAutoLogout } from './services/api';

function App() {
  // Inicializar el estado de usuario leyendo de localStorage si existe
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    try {
      return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    } catch (e) {
      console.error('Error al parsear el usuario guardado:', e);
      return null;
    }
  });

  // Registrar callback para cierre de sesión automático desde el cliente API
  useEffect(() => {
    onAutoLogout(() => {
      setUsuario(null);
    });
  }, []);

  const manejarIngreso = (datosAutenticacion) => {
    const datosUsuario = {
      username: datosAutenticacion.username,
      email: datosAutenticacion.email,
      roles: datosAutenticacion.roles,
    };
    
    // Guardar tokens y usuario en localStorage
    localStorage.setItem('accessToken', datosAutenticacion.accessToken);
    localStorage.setItem('refreshToken', datosAutenticacion.refreshToken);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    
    setUsuario(datosUsuario);
  };

  const manejarCierreSesion = async () => {
    await authService.logout();
    setUsuario(null);
  };

  if (!usuario) {
    return <Acceso alIngresar={manejarIngreso} />;
  }

  return (
    <PanelPrincipal usuario={usuario} alCerrarSesion={manejarCierreSesion} />
  );
}

export default App;



