/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { authService, onAutoLogout } from '../services/api';
import { normalizarSesion, tienePermiso } from '../utils/permisos';
import { guardarMarcaComercio } from '../utils/marcaComercio';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('usuario');
      return guardado ? normalizarSesion(JSON.parse(guardado)) : null;
    } catch {
      return null;
    }
  });
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem('accessToken')));
  const [motivoCierreSesion, setMotivoCierreSesion] = useState(null);

  const guardarUsuario = useCallback((datos) => {
    const sesion = normalizarSesion(datos);
    localStorage.setItem('usuario', JSON.stringify(sesion));
    setUsuario(sesion);
    return sesion;
  }, []);

  const logoutLocal = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }, []);

  useEffect(() => {
    onAutoLogout(logoutLocal);
    return () => onAutoLogout(null);
  }, [logoutLocal]);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      return;
    }
    let activo = true;
    authService.me()
      .then((datos) => activo && guardarUsuario(datos))
      .catch(() => activo && logoutLocal())
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [guardarUsuario, logoutLocal]);

  useEffect(() => {
    if (!usuario) return undefined;
    let timeoutId;
    const reiniciar = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logoutLocal();
        setMotivoCierreSesion('inactividad');
      }, 10 * 60 * 1000);
    };
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciar));
    reiniciar();
    return () => {
      clearTimeout(timeoutId);
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciar));
    };
  }, [usuario, logoutLocal]);

  const login = async (username, password) => {
    setCargando(true);
    setMotivoCierreSesion(null);
    try {
      const respuesta = await authService.login(username, password);
      localStorage.setItem('accessToken', respuesta.accessToken);
      localStorage.setItem('refreshToken', respuesta.refreshToken);
      const sesion = guardarUsuario(respuesta.usuario);

      // El login no incluye el comercio; se consulta con el token recién creado
      // para que la próxima pantalla de acceso pueda mostrar su nombre.
      guardarMarcaComercio(null);
      try {
        const respuestaComercios = await api.get('/Comercios');
        const comercios = Array.isArray(respuestaComercios.data)
          ? respuestaComercios.data
          : respuestaComercios.data ? [respuestaComercios.data] : [];
        guardarMarcaComercio(comercios[0]);
      } catch {
        // El acceso no debe fallar si el comercio todavía no está configurado.
      }

      return sesion;
    } finally {
      setCargando(false);
    }
  };

  const logout = async () => {
    setCargando(true);
    try {
      await authService.logout();
    } finally {
      logoutLocal();
      setMotivoCierreSesion(null);
      setCargando(false);
    }
  };

  const recargarUsuario = useCallback(async () => guardarUsuario(await authService.me()), [guardarUsuario]);
  const puede = useCallback((codigo) => tienePermiso(usuario, codigo), [usuario]);
  const tieneRol = useCallback((rol) => usuario?.rol?.nombre === rol, [usuario]);
  const limpiarMotivoCierre = useCallback(() => setMotivoCierreSesion(null), []);

  const value = {
    usuario, cargando, login, logout, recargarUsuario, puede, tieneRol,
    motivoCierreSesion, limpiarMotivoCierre,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};
