import axios from 'axios';

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

// Permite a la aplicación React suscribirse a los eventos de cierre de sesión automático
export const onAutoLogout = (callback) => {
  logoutCallback = callback;
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
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
};

// Interceptor de Response: Maneja errores, especialmente el refresco del token en error 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Si el error es 401 (No autorizado) y no es una petición de refresco/login en sí misma
    if (response && response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Encolar la petición hasta que termine el refresco
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        limpiarSesion();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Llamada para refrescar el token
        const res = await apiAuth.post('/auth/refresh', { refreshToken });
        
        if (res.status === 200 && res.data.accessToken) {
          const { accessToken, refreshToken: nuevoRefreshToken } = res.data;
          
          localStorage.setItem('accessToken', accessToken);
          if (nuevoRefreshToken) {
            localStorage.setItem('refreshToken', nuevoRefreshToken);
          }

          // Continuar con las peticiones encoladas
          onRefreshed(accessToken);
          isRefreshing = false;

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresco de token, el refresh token ya no es válido, se desloguea
        limpiarSesion();
        isRefreshing = false;
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
  }
};

export default api;
