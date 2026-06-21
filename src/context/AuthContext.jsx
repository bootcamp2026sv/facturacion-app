import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, onAutoLogout } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    try {
      return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    } catch (e) {
      console.error('Error al recuperar sesión del localStorage:', e);
      return null;
    }
  });

  const [cargando, setCargando] = useState(false);
  const [motivoCierreSesion, setMotivoCierreSesion] = useState(null);

  // Escuchar eventos de cierre de sesión automático desde el cliente API (Axios)
  useEffect(() => {
    onAutoLogout(() => {
      logoutLocal();
    });
  }, []);

  // Configuración del detector de inactividad (Idle Timer)
  useEffect(() => {
    if (!usuario) return;

    let timeoutId;
    
    // TIEMPO DE PRUEBA: 15 segundos para validar rápidamente.
    // Para producción: 10 * 60 * 1000 (10 minutos)
    const TIEMPO_INACTIVIDAD = 600000; 

    const reiniciarTemporizador = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logoutPorInactividad();
      }, TIEMPO_INACTIVIDAD);
    };

    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    eventos.forEach((evento) => {
      window.addEventListener(evento, reiniciarTemporizador);
    });

    // Iniciar temporizador inmediatamente al loguearse o montar
    reiniciarTemporizador();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      eventos.forEach((evento) => {
        window.removeEventListener(evento, reiniciarTemporizador);
      });
    };
  }, [usuario]);

  const login = async (username, password) => {
    setCargando(true);
    setMotivoCierreSesion(null); // Limpiar cualquier alerta previa de cierre de sesión
    try {
      const datosAutenticacion = await authService.login(username, password);
      const datosUsuario = {
        username: datosAutenticacion.username,
        email: datosAutenticacion.email,
        roles: datosAutenticacion.roles,
      };

      // Guardar en localStorage
      localStorage.setItem('accessToken', datosAutenticacion.accessToken);
      localStorage.setItem('refreshToken', datosAutenticacion.refreshToken);
      localStorage.setItem('usuario', JSON.stringify(datosUsuario));

      setUsuario(datosUsuario);
      return datosUsuario;
    } finally {
      setCargando(false);
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const logout = async () => {
    setCargando(true);
    try {
      await authService.logout();
    } catch (e) {
      console.error('Error al notificar cierre de sesión al servidor:', e);
    } finally {
      logoutLocal();
      setMotivoCierreSesion(null); // Cerrado manualmente, sin motivo de alerta
      setCargando(false);
    }
  };

  const logoutPorInactividad = () => {
    logoutLocal();
    setMotivoCierreSesion('inactividad');
  };

  const limpiarMotivoCierre = () => {
    setMotivoCierreSesion(null);
  };

  // Helper para verificar roles fácilmente
  const tieneRol = (rol) => usuario?.roles?.includes(rol) || false;

  const value = {
    usuario,
    cargando,
    login,
    logout,
    tieneRol,
    motivoCierreSesion,
    limpiarMotivoCierre
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para consumir el contexto de forma sencilla
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
