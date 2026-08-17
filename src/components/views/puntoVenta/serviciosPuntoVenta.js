import api from '../../../services/api';
import { guardarMarcaComercio } from '../../../utils/marcaComercio';

// La caché evita repetir la carga inicial de catálogos si la vista se vuelve a abrir.
let catalogosPosCache = null;
let catalogosPosPromise = null;

// La carga inicial trae solo datos compactos; productos y clientes se buscan por página.
export const obtenerCatalogosPos = async () => {
  if (catalogosPosCache) return catalogosPosCache;

  if (!catalogosPosPromise) {
    catalogosPosPromise = Promise.all([
      api.get('/pos/inicial'),
      api.get('/pos/productos', { params: { page: 0, size: 50 } }),
      api.get('/pos/clientes', { params: { page: 0, size: 50 } }),
    ])
      .then(([resInicial, resProductos, resClientes]) => {
        const inicial = resInicial.data || {};
        guardarMarcaComercio(inicial.comercio);
        const clientes = resClientes.data?.content || [];
        if (inicial.clientePredeterminado && !clientes.some((cliente) => cliente.id === inicial.clientePredeterminado.id)) {
          clientes.unshift(inicial.clientePredeterminado);
        }
        catalogosPosCache = {
          productos: resProductos.data?.content || [],
          clientes,
          comercio: inicial.comercio || null,
          clientePredeterminado: inicial.clientePredeterminado || null,
          distritos: inicial.distritos || [],
          actividades: inicial.actividades || [],
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
const configuracionBusqueda = (q, signal) => ({
  params: { page: 0, size: 50, q },
  ...(signal && typeof signal.addEventListener === 'function' ? { signal } : {}),
});

export const obtenerProductosPuntoVenta = async (q = '', signal) =>
  (await api.get('/pos/productos', configuracionBusqueda(q, signal))).data?.content || [];

export const obtenerClientesPuntoVenta = async (q = '', signal) =>
  (await api.get('/pos/clientes', configuracionBusqueda(q, signal))).data?.content || [];

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
