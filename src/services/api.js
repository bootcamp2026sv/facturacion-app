import axios from 'axios';
import { clasificarErrorAutorizacion } from '../utils/permisos';

// Obtener la URL base desde las variables de entorno o usar una ruta relativa (para proxy en desarrollo)
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';


// Crear una instancia de axios para las peticiones generales
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia separada para refrescar el token sin que pase por los mismos interceptores
const apiAuth = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let logoutCallback = null;
let forbiddenCallback = null;

// Permite a la aplicación React suscribirse a los eventos de cierre de sesión automático
export const onAutoLogout = (callback) => {
  logoutCallback = callback;
};

export const onForbidden = (callback) => {
  forbiddenCallback = callback;
};

// Limpia el almacenamiento de sesión local
const limpiarSesion = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('usuario');
  if (logoutCallback) {
    logoutCallback();
  }
};

// Interceptor de Request: Agrega el token de acceso a cada petición si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Controlar peticiones de refresco encoladas para evitar múltiples llamadas paralelas de refresh token
let renovacionEnCurso = null;

const renovarAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No existe un token para renovar la sesión');
  }

  const respuesta = await apiAuth.post('/auth/refresh', { refreshToken });
  const { accessToken, refreshToken: nuevoRefreshToken } = respuesta.data || {};
  if (!accessToken) {
    throw new Error('El servidor no devolvió un token de acceso');
  }

  localStorage.setItem('accessToken', accessToken);
  if (nuevoRefreshToken) {
    localStorage.setItem('refreshToken', nuevoRefreshToken);
  }
  return accessToken;
};

// Interceptor de Response: Maneja errores, especialmente el refresco del token en error 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    if (clasificarErrorAutorizacion(response?.status) === 'MOSTRAR_SIN_PERMISO') {
      forbiddenCallback?.(response.data?.message || 'No tiene permiso');
      return Promise.reject(error);
    }

    // Si el error es 401 (No autorizado) y no es una petición de refresco/login en sí misma
    if (originalRequest && clasificarErrorAutorizacion(response?.status) === 'RENOVAR_SESION' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!renovacionEnCurso) {
          renovacionEnCurso = renovarAccessToken().finally(() => {
            renovacionEnCurso = null;
          });
        }
        const accessToken = await renovacionEnCurso;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        limpiarSesion();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Endpoints de autenticación directa
export const authService = {
  login: async (usernameOrEmail, password) => {
    const response = await apiAuth.post('/auth/login', { usernameOrEmail, password });
    return response.data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiAuth.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Error al notificar logout al servidor:', error);
    } finally {
      limpiarSesion();
    }
  },
  me: async () => (await api.get('/auth/me')).data,
  cambiarContrasena: async (contrasenaActual, nuevaContrasena) =>
    (await api.patch('/auth/me/password', { contrasenaActual, nuevaContrasena })).data,
};

export default api;
