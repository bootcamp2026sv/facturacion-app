import { useCallback, useEffect, useState } from 'react';
import {
  actualizarCatalogoPosCache,
  obtenerCatalogosPos,
  obtenerClientesPuntoVenta,
  obtenerProductosPuntoVenta,
} from '../serviciosPuntoVenta.js';
import {
  mapearClienteApi,
  mapearProductoApi,
} from '../mapeadoresPuntoVenta.js';
import { esClienteFinal } from '../reglasPuntoVenta.js';

const MENSAJE_CLIENTE_PREDETERMINADO = 'No se encontro el cliente final/default. Cree o active un cliente "Consumidor Final", "Cliente Final" o "Clientes Varios" antes de vender.';

// Administra los catálogos y las recargas que necesita el POS.
export function useCatalogosPuntoVenta() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [comercio, setComercio] = useState(null);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [recargandoProductos, setRecargandoProductos] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState('');
  const [errorClientes, setErrorClientes] = useState('');
  const [cliente, setCliente] = useState(null);
  const [esGranContribuyente, setEsGranContribuyente] = useState(false);

  // Recarga solo productos para no volver a pedir todos los catálogos.
  const recargarProductos = useCallback(async () => {
    setRecargandoProductos(true);
    setErrorCatalogos('');

    try {
      const respuesta = await obtenerProductosPuntoVenta();
      const productosApi = respuesta
        .filter((producto) => producto.activo !== false)
        .map(mapearProductoApi);

      setProductos(productosApi);
      actualizarCatalogoPosCache('productos', respuesta);
    } catch (error) {
      console.error('Error al recargar productos:', error);
      setErrorCatalogos(error.response?.data?.message || 'No se pudieron recargar los productos.');
    } finally {
      setRecargandoProductos(false);
    }
  }, []);

  // Recarga clientes y conserva el cliente actual cuando todavía existe.
  const recargarClientes = useCallback(async (clienteActual = null) => {
    setCargandoClientes(true);
    setErrorClientes('');

    try {
      const respuesta = await obtenerClientesPuntoVenta();
      const clientesApi = respuesta
        .filter((cliente) => cliente.activo !== false)
        .map(mapearClienteApi);
      const clienteVigente = clientesApi.find((cliente) => cliente.value === clienteActual);
      const clienteDefault = clientesApi.find(esClienteFinal) || null;
      const siguienteCliente = clienteVigente || clienteDefault || null;

      setClientes(clientesApi);
      setCliente(siguienteCliente?.value || null);
      setEsGranContribuyente(!!siguienteCliente?.granContribuyente);
      actualizarCatalogoPosCache('clientes', respuesta);

      if (!clienteDefault) {
        setErrorClientes('No se encontro el cliente final/default.');
      }

      return { clienteDefault, siguienteCliente };
    } catch (error) {
      console.error('Error al recargar clientes del POS:', error);
      setErrorClientes(error.response?.data?.message || 'No se pudieron actualizar los clientes.');
      return { clienteDefault: null, siguienteCliente: null };
    } finally {
      setCargandoClientes(false);
    }
  }, []);

  // La primera carga usa una promesa compartida para evitar solicitudes duplicadas.
  useEffect(() => {
    let activo = true;

    const cargarCatalogos = async () => {
      setCargandoCatalogos(true);
      setErrorCatalogos('');

      try {
        const catalogos = await obtenerCatalogosPos();
        if (!activo) return;

        setProductos(catalogos.productos
          .filter((producto) => producto.activo !== false)
          .map(mapearProductoApi));
        setClientes(catalogos.clientes
          .filter((cliente) => cliente.activo !== false)
          .map(mapearClienteApi));
        setDistritos(catalogos.distritos || []);
        setActividades(catalogos.actividades || []);
        setComercio(catalogos.comercios[0] || null);

        const clienteDefault = catalogos.clientes
          .filter((cliente) => cliente.activo !== false)
          .map(mapearClienteApi)
          .find(esClienteFinal);

        setCliente(clienteDefault?.value || null);
        setEsGranContribuyente(!!clienteDefault?.granContribuyente);

        if (!clienteDefault) {
          setErrorCatalogos(MENSAJE_CLIENTE_PREDETERMINADO);
        }
      } catch (error) {
        console.error('Error al cargar catálogos del POS:', error);
        if (activo) {
          setErrorCatalogos(error.response?.data?.message || 'No se pudieron cargar productos, clientes o comercio.');
        }
      } finally {
        if (activo) setCargandoCatalogos(false);
      }
    };

    cargarCatalogos();
    return () => {
      activo = false;
    };
  }, []);

  return {
    productos,
    clientes,
    distritos,
    actividades,
    comercio,
    cargandoCatalogos,
    recargandoProductos,
    cargandoClientes,
    errorCatalogos,
    errorClientes,
    cliente,
    setCliente,
    esGranContribuyente,
    setEsGranContribuyente,
    setClientes,
    recargarProductos,
    recargarClientes,
  };
}
