import api from '../../../services/api';

// La caché evita repetir la carga inicial de catálogos si la vista se vuelve a abrir.
let catalogosPosCache = null;
let catalogosPosPromise = null;

// Carga todos los catálogos necesarios para comenzar una venta.
export const obtenerCatalogosPos = async () => {
  if (catalogosPosCache) return catalogosPosCache;

  if (!catalogosPosPromise) {
    catalogosPosPromise = Promise.all([
      api.get('/Productos'),
      api.get('/Clientes'),
      api.get('/Comercios'),
      api.get('/distritos'),
      api.get('/ActividadEconomicas'),
    ])
      .then(([resProductos, resClientes, resComercios, resDistritos, resActividades]) => {
        catalogosPosCache = {
          productos: resProductos.data || [],
          clientes: resClientes.data || [],
          comercios: resComercios.data || [],
          distritos: resDistritos.data || [],
          actividades: resActividades.data || [],
        };
        return catalogosPosCache;
      })
      .catch((error) => {
        catalogosPosPromise = null;
        throw error;
      });
  }

  return catalogosPosPromise;
};

// Recargas puntuales usadas por los botones de productos y clientes.
export const obtenerProductosPuntoVenta = async () => (await api.get('/Productos')).data || [];

export const obtenerClientesPuntoVenta = async () => (await api.get('/Clientes')).data || [];

export const crearClientePuntoVenta = async (datos) => (await api.post('/Clientes', datos)).data;

export const guardarVentaPuntoVenta = async (payload) => (await api.post('/Ventas', payload)).data;

export const enviarVentaPorCorreo = async (ventaId, destinatario) => {
  await api.post(`/Ventas/${ventaId}/correo`, { destinatario });
};

// Estas funciones mantienen actualizada la caché después de una recarga o creación.
export const actualizarCatalogoPosCache = (nombre, datos) => {
  if (catalogosPosCache) {
    catalogosPosCache = { ...catalogosPosCache, [nombre]: datos };
  }
};

export const agregarClienteAlCatalogoPosCache = (cliente) => {
  if (catalogosPosCache) {
    catalogosPosCache = { ...catalogosPosCache, clientes: [...catalogosPosCache.clientes, cliente] };
  }
};
