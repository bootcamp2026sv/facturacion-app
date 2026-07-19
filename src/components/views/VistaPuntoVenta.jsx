import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import api from '../../services/api';
import {
  calcularItemVenta as calcItem,
  obtenerPrecioUnitarioMostrado,
  redondearMoneda as redondear,
  TASA_IVA,
} from '../../utils/calculosVenta';
import { obtenerCamposFaltantesCreditoFiscal } from '../../utils/validacionesVenta';
import { obtenerErrorFormatoCliente, soloDigitos } from '../../utils/validacionesCliente';
import './VistaPuntoVenta.css';
import {
  AvisoError,
  AvisoPagoExitoso,
  ContenedorPuntoVenta,
  DialogoPuntoVenta,
  ImpresionTicket,
  PanelCarrito,
  PanelCatalogo,
} from './componentesPuntoVenta';

const PRODUCTOS = [
  { id: 1, nombre: 'Coca-Cola 355ml', precio: 1.50, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'gravado' },
  { id: 2, nombre: 'Agua Pura 500ml', precio: 1.00, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'exento' },
  { id: 3, nombre: 'Jugo de Naranja', precio: 2.00, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'gravado', lineaLibre: true },
  { id: 4, nombre: 'Café Americano', precio: 2.50, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'gravado' },
  { id: 5, nombre: 'Hamburguesa Clásica', precio: 5.50, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'gravado', lineaLibre: true },
  { id: 6, nombre: 'Pizza Personal', precio: 6.00, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'gravado', lineaLibre: true },
  { id: 7, nombre: 'Papas Fritas Grandes', precio: 3.00, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'exento', lineaLibre: true },
  { id: 8, nombre: 'Nachos con Queso', precio: 4.00, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'gravado' },
  { id: 9, nombre: 'Pastel de Chocolate', precio: 3.50, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'noSujeto' },
  { id: 10, nombre: 'Helado Vainilla', precio: 2.50, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'gravado', lineaLibre: true },
  { id: 11, nombre: 'Flan Caramelo', precio: 3.00, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'gravado' },
  { id: 12, nombre: 'Cheesecake', precio: 4.50, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'noGravado' },
];

const CLIENTES = [
  { label: 'Cliente Final', value: 0, nit: 'Consumidor Final', granContribuyente: false },
  { label: 'Distribuidora Alimentos S.A. de C.V.', value: 1, nit: '0614-150882-101-1', granContribuyente: true },
  { label: 'Juan Carlos Pérez', value: 2, nit: '01234567-8', granContribuyente: false },
  { label: 'Tecnología Integrada S.A. de C.V.', value: 3, nit: '0614-210398-102-3', granContribuyente: true },
  { label: 'María José Rodríguez', value: 4, nit: '02468101-3', granContribuyente: false },
  { label: 'Constructora del Valle S.A.', value: 5, nit: '0614-050783-101-7', granContribuyente: false },
  { label: 'Supermercados Unidos S.A.', value: 6, nit: '0614-120195-104-2', granContribuyente: true },
  { label: 'Ana Lucía Hernández', value: 7, nit: '03691245-6', granContribuyente: false },
];

const METODOS_PAGO = [
  { label: 'Efectivo', value: 'efectivo', icono: 'pi pi-money-bill' },
  { label: 'Tarjeta', value: 'tarjeta', icono: 'pi pi-credit-card' },
  { label: 'Crédito', value: 'credito', icono: 'pi pi-clock' },
  { label: 'Transferencia', value: 'transferencia', icono: 'pi pi-building' },
];

const TIPOS_DTE = [
  { label: 'Factura (DTE 01)', value: '01', icon: 'pi pi-user', color: '#10b981' },
  { label: 'Crédito Fiscal (DTE 03)', value: '03', icon: 'pi pi-briefcase', color: '#6366f1' },
  { label: 'Sujeto Excluido (DTE 14)', value: '14', icon: 'pi pi-user-minus', color: '#f59e0b' },
  { label: 'Exportación (DTE 11)', value: '11', icon: 'pi pi-globe', color: '#8b5cf6' },
];

const CATEGORIAS = ['Todas', 'Bebidas', 'Comidas', 'Postres'];

const ETIQUETA_IVA = {
  gravado: { label: 'IVA 13%', severity: 'info' },
  exento: { label: 'Exento', severity: 'success' },
  noSujeto: { label: 'No Sujeto', severity: 'warning' },
  noGravado: { label: 'No Gravado', severity: 'secondary' },
};

const COLOR_PAGO = { efectivo: '#10b981', tarjeta: '#6366f1', credito: '#f59e0b', transferencia: '#8b5cf6' };

const ANCHOS_TICKET = [
  { label: '80 mm', value: 80 },
  { label: '58 mm', value: 58 },
];

const TICKET_ANCHO_STORAGE_KEY = 'pos.ticketAnchoMm';

const TIPO_DOC_OPCIONES = [
  { label: 'DUI', value: 13 },
  { label: 'NIT', value: 36 },
  { label: 'Pasaporte', value: 3 },
  { label: 'Carnet residente', value: 2 },
  { label: 'Otro', value: 37 },
];

const clienteRapidoInicial = {
  nombre: '',
  apellidos: '',
  nombreComercial: '',
  tipoDocumento: 13,
  numDocumento: '',
  nrc: '',
  telefono: '',
  correo: '',
  granContribuyente: false,
  activo: true,
  complementoDireccion: '',
  distrito_id: null,
  actividadEconomica_id: null,
};

const TRIBUTACION_A_IVA = {
  GRAVADO: 'gravado',
  EXENTO: 'exento',
  NO_SUJETO: 'noSujeto',
  NO_GRAVADO: 'noGravado',
};

const ICONO_CATEGORIA = {
  bebidas: 'pi pi-glass',
  alimentos: 'pi pi-shopping-cart',
  comida: 'pi pi-shopping-cart',
  comidas: 'pi pi-shopping-cart',
  postres: 'pi pi-star',
  electronica: 'pi pi-desktop',
  electrónica: 'pi pi-desktop',
};

let catalogosPosCache = null;
let catalogosPosPromise = null;

const obtenerCatalogosPos = async () => {
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

export default function VistaPuntoVenta() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [comercio, setComercio] = useState(null);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [recargandoProductos, setRecargandoProductos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState('');
  const [errorVenta, setErrorVenta] = useState('');
  const [guardandoVenta, setGuardandoVenta] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dialogoPago, setDialogoPago] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [dialogoTicket, setDialogoTicket] = useState(false);
  const [ticketVenta, setTicketVenta] = useState(null);
  const [ticketAncho, setTicketAncho] = useState(() => {
    const guardado = Number(localStorage.getItem(TICKET_ANCHO_STORAGE_KEY));
    return ANCHOS_TICKET.some(ancho => ancho.value === guardado) ? guardado : 80;
  });
  const [esGranContribuyente, setEsGranContribuyente] = useState(false);
  const [tipoDte, setTipoDte] = useState('01');

  const [dialogoItem, setDialogoItem] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [precioIncluyeIva, setPrecioIncluyeIva] = useState(false);

  const cambiarModoIvaPrecio = (valor) => {
    if (valor === precioIncluyeIva) return;
    setPrecioIncluyeIva(valor);
    if (itemEditando) {
      if (valor) {
        setItemEditando(prev => ({
          ...prev,
          precio: prev.tipoIva === 'gravado' ? redondear(prev.precio * (1 + TASA_IVA)) : prev.precio
        }));
      } else {
        setItemEditando(prev => ({
          ...prev,
          precio: prev.tipoIva === 'gravado' ? redondear(prev.precio / (1 + TASA_IVA)) : prev.precio
        }));
      }
    }
  };
  const [dialogoCliente, setDialogoCliente] = useState(false);
  const [dialogoNuevoCliente, setDialogoNuevoCliente] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState('');
  const [errorClienteRapido, setErrorClienteRapido] = useState('');
  const [clienteRapido, setClienteRapido] = useState(clienteRapidoInicial);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState(null);
  const [efectivoRecibidoTexto, setEfectivoRecibidoTexto] = useState('');
  const efectivoRecibidoRef = useRef(null);
  const [plazoValor, setPlazoValor] = useState(1);
  const [plazoTipo, setPlazoTipo] = useState('meses');
  const [referenciaPago, setReferenciaPago] = useState('');

  const clienteSeleccionado = useMemo(
    () => clientes.find(c => c.value === cliente) || null,
    [cliente, clientes]
  );

  const camposFaltantesCreditoFiscal = useMemo(
    () => tipoDte === '03' ? obtenerCamposFaltantesCreditoFiscal(clienteSeleccionado) : [],
    [tipoDte, clienteSeleccionado]
  );

  const mensajeClienteCreditoFiscal = camposFaltantesCreditoFiscal.length > 0
    ? `Crédito Fiscal: completa ${camposFaltantesCreditoFiscal.join(', ')} del cliente antes de cobrar.`
    : '';

  const parsearMontoPago = useCallback((valor) => {
    const limpio = String(valor ?? '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    const normalizado = partes.length > 1
      ? `${partes[0]}.${partes.slice(1).join('')}`
      : limpio;
    const numero = Number(normalizado);
    return Number.isFinite(numero) && normalizado !== '' ? numero : null;
  }, []);

  const actualizarEfectivoRecibido = useCallback((valor) => {
    const limpio = String(valor ?? '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    const texto = partes.length > 1
      ? `${partes[0]}.${partes.slice(1).join('').slice(0, 2)}`
      : limpio;
    setEfectivoRecibidoTexto(texto);
    setEfectivoRecibido(parsearMontoPago(texto));
  }, [parsearMontoPago]);

  const togglePantallaCompleta = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const manejarCambio = () => {
      const fs = !!document.fullscreenElement;
      setPantallaCompleta(fs);
      document.body.style.overflow = fs ? 'hidden' : '';
      document.documentElement.style.overflow = fs ? 'hidden' : '';
      const main = document.querySelector('main');
      if (main) main.style.overflow = fs ? 'hidden' : '';
    };
    document.addEventListener('fullscreenchange', manejarCambio);
    return () => {
      document.removeEventListener('fullscreenchange', manejarCambio);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const main = document.querySelector('main');
      if (main) main.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(TICKET_ANCHO_STORAGE_KEY, String(ticketAncho));
  }, [ticketAncho]);

  const mapearProductoApi = (producto) => {
    const categoria = producto.categoria?.nombre || 'Sin categoria';
    const categoriaKey = categoria.toLowerCase();
    const tipoIva = TRIBUTACION_A_IVA[producto.tipoTributacion] || 'gravado';
    return {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: Number(producto.precioSinIVA || 0),
      precioConIVA: Number(producto.precioConIVA || producto.precioSinIVA || 0),
      categoria,
      icono: ICONO_CATEGORIA[categoriaKey] || 'pi pi-box',
      imagen: producto.imagen || producto.imagenUrl || producto.urlImagen || producto.foto || producto.image || null,
      tipoIva,
      existencia: Number(producto.existencia || 0),
      lineaLibre: !!producto.productoPersonalizable,
    };
  };

  const recargarProductos = async () => {
    setRecargandoProductos(true);
    setErrorCatalogos('');
    try {
      const respuesta = await api.get('/Productos');
      const productosApi = (respuesta.data || [])
        .filter(producto => producto.activo !== false)
        .map(mapearProductoApi);

      setProductos(productosApi);
      if (catalogosPosCache) {
        catalogosPosCache = { ...catalogosPosCache, productos: respuesta.data || [] };
      }
    } catch (error) {
      console.error('Error al recargar productos:', error);
      setErrorCatalogos(error.response?.data?.message || 'No se pudieron recargar los productos.');
    } finally {
      setRecargandoProductos(false);
    }
  };

  const mapearClienteApi = (cli) => ({
    label: `${cli.nombre || ''}${cli.apellidos ? ` ${cli.apellidos}` : ''}`.trim() || cli.nombreComercial || 'Cliente',
    value: cli.id,
    nombre: cli.nombre || '',
    apellidos: cli.apellidos || '',
    nit: cli.numDocumento || cli.nit || cli.nrc || 'S/N',
    tipoDocumento: cli.tipoDocumento,
    numDocumento: cli.numDocumento || cli.nit || '',
    nrc: cli.nrc || '',
    telefono: cli.telefono || '',
    correo: cli.correo || '',
    nombreComercial: cli.nombreComercial || '',
    actividadEconomica: cli.actividadEconomica || null,
    distritoId: cli.distrito?.id || cli.distrito_id || cli.distritoId || null,
    direccion: {
      departamento: cli.distrito?.municipio?.departamento?.Nombre || cli.distrito?.municipio?.departamento?.nombre || '',
      municipio: cli.distrito?.municipio?.Nombre || cli.distrito?.municipio?.nombre || '',
      distrito: cli.distrito?.Nombre || cli.distrito?.nombre || '',
      complemento: cli.complementoDireccion || '',
    },
    granContribuyente: !!cli.granContribuyente,
  });

  const esClienteFinal = (cli) => {
    const texto = `${cli.label || ''} ${cli.nombreComercial || ''} ${cli.nit || ''}`.toLowerCase();
    return texto.includes('consumidor final') ||
      texto.includes('cliente final') ||
      texto.includes('clientes varios') ||
      texto.includes('cliente varios') ||
      texto.includes('varios') ||
      texto.includes('000000000');
  };

  const restablecerClienteFinalYFactura = () => {
    const clienteFinal = clientes.find(esClienteFinal) || null;
    setCliente(clienteFinal?.value ?? null);
    setEsGranContribuyente(!!clienteFinal?.granContribuyente);
    setTipoDte('01');
  };

  const cerrarDialogoPago = () => {
    setDialogoPago(false);
    restablecerClienteFinalYFactura();
  };

  const cerrarDialogoTicket = () => {
    setDialogoTicket(false);
    restablecerClienteFinalYFactura();
  };

  const aplicarClientesApi = (clientesApi, clienteActual = cliente) => {
    setClientes(clientesApi);

    const clienteVigente = clientesApi.find(c => c.value === clienteActual);
    const clienteDefault = clientesApi.find(esClienteFinal) || null;
    const siguienteCliente = clienteVigente || clienteDefault || null;

    setCliente(siguienteCliente?.value || null);
    setEsGranContribuyente(!!siguienteCliente?.granContribuyente);
    return clienteDefault;
  };

  const recargarClientes = async () => {
    setCargandoClientes(true);
    setErrorClientes('');

    try {
      const respuesta = await api.get('/Clientes');
      const clientesApi = (respuesta.data || [])
        .filter(cli => cli.activo !== false)
        .map(mapearClienteApi);

      const clienteDefault = aplicarClientesApi(clientesApi);

      if (catalogosPosCache) {
        catalogosPosCache = { ...catalogosPosCache, clientes: respuesta.data || [] };
      }

      if (!clienteDefault) {
        setErrorClientes('No se encontro el cliente final/default.');
      }
    } catch (error) {
      console.error('Error al recargar clientes del POS:', error);
      setErrorClientes(error.response?.data?.message || 'No se pudieron actualizar los clientes.');
    } finally {
      setCargandoClientes(false);
    }
  };

  const abrirDialogoCliente = () => {
    setDialogoCliente(true);
    setBusquedaCliente('');
    recargarClientes();
  };

  useEffect(() => {
    let activo = true;

    const cargarCatalogos = async () => {
      setCargandoCatalogos(true);
      setErrorCatalogos('');
      try {
        const catalogos = await obtenerCatalogosPos();

        if (!activo) return;

        const productosApi = catalogos.productos
          .filter(producto => producto.activo !== false)
          .map(mapearProductoApi);
        const clientesApi = catalogos.clientes
          .filter(cli => cli.activo !== false)
          .map(mapearClienteApi);
        const comercioApi = catalogos.comercios[0] || null;
        const distritosApi = catalogos.distritos || [];
        const actividadesApi = catalogos.actividades || [];
        const clienteDefault = clientesApi.find(esClienteFinal) || null;

        setProductos(productosApi);
        setClientes(clientesApi);
        setDistritos(distritosApi);
        setActividades(actividadesApi);
        setClienteRapido(prev => ({
          ...prev,
          distrito_id: prev.distrito_id || distritosApi[0]?.id || null,
        }));
        setComercio(comercioApi);
        setCliente(prev => prev || clienteDefault?.value || null);
        setEsGranContribuyente(!!clienteDefault?.granContribuyente);
        if (!clienteDefault) {
          setErrorCatalogos('No se encontro el cliente final/default. Cree o active un cliente "Consumidor Final", "Cliente Final" o "Clientes Varios" antes de vender.');
        }
      } catch (error) {
        console.error('Error al cargar catálogos del POS:', error);
        console.debug('Catálogos demo ignorados por el POS real:', PRODUCTOS.length, CLIENTES.length, CATEGORIAS.length);
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

  const categorias = useMemo(() => {
    const unicas = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    return ['Todas', ...unicas];
  }, [productos]);

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return clientes;
    const q = busquedaCliente.toLowerCase();
    return clientes.filter(c => c.label.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q));
  }, [busquedaCliente, clientes]);

  const abrirNuevoCliente = () => {
    setClienteRapido({
      ...clienteRapidoInicial,
      distrito_id: distritos[0]?.id || null,
      actividadEconomica_id: null,
    });
    setErrorClienteRapido('');
    setDialogoCliente(false);
    setDialogoNuevoCliente(true);
  };

  const guardarClienteRapido = async () => {
    if (!clienteRapido.nombre.trim()) {
      setErrorClienteRapido('El nombre o razon social es obligatorio.');
      return;
    }

    const errorFormato = obtenerErrorFormatoCliente(clienteRapido);
    if (errorFormato) {
      setErrorClienteRapido(errorFormato);
      return;
    }

    setGuardandoCliente(true);
    setErrorClienteRapido('');

    try {
      const respuesta = await api.post('/Clientes', {
        ...clienteRapido,
        distrito_id: clienteRapido.distrito_id || distritos[0]?.id || 1,
        actividadEconomica_id: clienteRapido.actividadEconomica_id || null,
      });
      const clienteGuardado = respuesta.data;
      const clienteMapeado = mapearClienteApi(clienteGuardado);

      catalogosPosCache = catalogosPosCache
        ? { ...catalogosPosCache, clientes: [...catalogosPosCache.clientes, clienteGuardado] }
        : catalogosPosCache;

      setClientes(prev => [...prev, clienteMapeado]);
      setCliente(clienteMapeado.value);
      setEsGranContribuyente(!!clienteMapeado.granContribuyente);
      setDialogoNuevoCliente(false);
      setClienteRapido(clienteRapidoInicial);
    } catch (error) {
      console.error('Error al crear cliente desde POS:', error);
      setErrorClienteRapido(error.response?.data?.message || error.response?.data?.error || 'No se pudo crear el cliente.');
    } finally {
      setGuardandoCliente(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      if (categoriaActiva !== 'Todas' && p.categoria !== categoriaActiva) return false;
      if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [busqueda, categoriaActiva, productos]);

  const abrirPersonalizar = (producto) => {
    if (!producto.lineaLibre) {
      setCarrito(prev => {
        const existente = prev.find(item => item.id === producto.id);
        if (existente) {
          return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
        }
        return [...prev, { ...producto, _key: Date.now() + Math.random(), cantidad: 1, descuentoTipo: 'porcentaje', descuentoValor: 0 }];
      });
      return;
    }
    setItemEditando({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precio,
      precioConIVA: producto.precioConIVA,
      cantidad: 1,
      descuentoTipo: 'porcentaje',
      descuentoValor: 0,
      tipoIva: producto.tipoIva,
    });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  };

  const agregarAlCarrito = () => {
    if (!itemEditando) return;
    const precioFinal = (precioIncluyeIva && itemEditando.tipoIva === 'gravado')
      ? itemEditando.precio / (1 + TASA_IVA)
      : itemEditando.precio;
    const precioConIVA = itemEditando.tipoIva === 'gravado'
      ? (precioIncluyeIva ? itemEditando.precio : redondear(itemEditando.precio * (1 + TASA_IVA)))
      : itemEditando.precio;
    const itemConPrecioBase = { ...itemEditando, precio: precioFinal, precioConIVA };
    setCarrito(prev => {
      const idx = prev.findIndex(item => item._key === itemEditando._key);
      if (idx >= 0) {
        const nueva = [...prev];
        nueva[idx] = itemConPrecioBase;
        return nueva;
      }
      return [...prev, { ...itemConPrecioBase, _key: Date.now() + Math.random() }];
    });
    setDialogoItem(false);
    setItemEditando(null);
  };

  const editarItem = (item) => {
    setItemEditando({ ...item });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  };

  const cambiarCantidad = (key, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item._key !== key) return item;
      const nueva = item.cantidad + delta;
      return nueva <= 0 ? null : { ...item, cantidad: nueva };
    }).filter(Boolean));
  };

  const quitarDelCarrito = (key) => {
    setCarrito(prev => prev.filter(item => item._key !== key));
  };

  const monto4 = (valor) => Number(redondear(valor || 0)).toFixed(4);

  const formatoDinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;

  const formatoFechaTicket = (fecha) => new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(fecha);

  const plazoNormalizado = (valor) => {
    if (valor === 'días' || valor === 'dias') return 'dias';
    if (valor === 'años' || valor === 'anios') return 'anios';
    return 'meses';
  };

  const resumen = useMemo(() => {
    let subtotal = 0, descuentoTotal = 0, ivaTotal = 0, total = 0;
    const porTipo = { gravado: 0, exento: 0, noSujeto: 0, noGravado: 0 };
    carrito.forEach(item => {
      const c = calcItem(item);
      subtotal += c.subtotal;
      descuentoTotal += c.descuento;
      ivaTotal += c.iva;
      total += c.total;
      porTipo[item.tipoIva] += c.subtotalDesc;
    });

    const aplicaRetencion = esGranContribuyente && porTipo.gravado >= 100;
    const retencionVal = aplicaRetencion ? Number((porTipo.gravado * 0.01).toFixed(4)) : 0;
    const retencion = Number(retencionVal.toFixed(2));
    const totalCobrar = Number((total - retencion).toFixed(2));

    return { 
      subtotal, 
      descuentoTotal, 
      ivaTotal, 
      total, 
      porTipo, 
      retencion, 
      aplicaRetencion, 
      totalCobrar 
    };
  }, [carrito, esGranContribuyente]);

  const crearTicketVenta = (ventaGuardada, cambio) => {
    const items = carrito.map(item => {
      const calculo = calcItem(item);
      return {
        key: item._key,
        codigo: item.codigo,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        descuento: calculo.descuento,
        iva: calculo.iva,
        total: calculo.total,
      };
    });

    return {
      id: ventaGuardada?.id,
      numeroControl: ventaGuardada?.numeroControl,
      codigoGeneracion: ventaGuardada?.codigoGeneracion,
      selloRecepcion: ventaGuardada?.selloRecepcion,
      fecha: new Date(),
      tipoDte,
      tipoDteLabel: TIPOS_DTE.find(t => t.value === tipoDte)?.label || `DTE ${tipoDte}`,
      metodoPago,
      metodoPagoLabel: METODOS_PAGO.find(m => m.value === metodoPago)?.label || metodoPago,
      referenciaPago: referenciaPago || null,
      efectivoRecibido: metodoPago === 'efectivo' ? efectivoRecibido : null,
      cambio,
      plazo: metodoPago === 'credito' ? `${plazoValor} ${plazoTipo}` : null,
      cliente: clienteSeleccionado,
      comercio,
      items,
      resumen: {
        ...resumen,
        porTipo: { ...resumen.porTipo },
      },
    };
  };

  const imprimirTicket = () => {
    requestAnimationFrame(() => window.print());
  };

  const renderTicket = (ticket) => {
    if (!ticket) return null;
    const nombreComercio = ticket.comercio?.nombreComercial || ticket.comercio?.nombre || 'Comercio';
    const direccion = ticket.comercio?.complementoDireccion || ticket.comercio?.direccion || '';
    const muestraIvaSeparado = ticket.tipoDte === '03';
    const subtotalTicket = muestraIvaSeparado ? ticket.resumen.subtotal : ticket.resumen.total;
    const muestraClienteCompleto = ['03', '11', '14'].includes(ticket.tipoDte);
    const direccionCliente = ticket.cliente?.direccion || {};
    const direccionClienteTexto = [
      direccionCliente.departamento,
      direccionCliente.municipio,
      direccionCliente.distrito,
      direccionCliente.complemento,
    ].filter(Boolean).join(', ');

    return (
      <div className={`thermal-ticket ticket-${ticketAncho}`}>
        <div className="ticket-center ticket-header">
          <div className="ticket-title">{nombreComercio}</div>
          {ticket.comercio?.nombre && ticket.comercio.nombre !== nombreComercio && <div>{ticket.comercio.nombre}</div>}
          {ticket.comercio?.nit && <div>NIT: {ticket.comercio.nit}</div>}
          {ticket.comercio?.nrc && <div>NRC: {ticket.comercio.nrc}</div>}
          {direccion && <div>{direccion}</div>}
          {ticket.comercio?.telefono && <div>Tel: {ticket.comercio.telefono}</div>}
        </div>

        <div className="ticket-line" />

        <div className="ticket-row"><span>Fecha</span><span>{formatoFechaTicket(ticket.fecha)}</span></div>
        <div className="ticket-row"><span>Documento</span><span>{ticket.tipoDteLabel}</span></div>
        {ticket.numeroControl && <div className="ticket-small-break">No. {ticket.numeroControl}</div>}
        {ticket.codigoGeneracion && <div className="ticket-small-break">Cod. {ticket.codigoGeneracion}</div>}
        {ticket.selloRecepcion && <div className="ticket-small-break">Sello MH: {ticket.selloRecepcion}</div>}
        <div className="ticket-row"><span>Cliente</span><span>{ticket.cliente?.label || 'Cliente Final'}</span></div>
        {muestraClienteCompleto ? (
          <>
            {ticket.cliente?.numDocumento && <div className="ticket-row"><span>Doc.</span><span>{ticket.cliente.numDocumento}</span></div>}
            {ticket.cliente?.nrc && <div className="ticket-row"><span>NRC</span><span>{ticket.cliente.nrc}</span></div>}
            {ticket.cliente?.nombreComercial && <div className="ticket-row"><span>Comercial</span><span>{ticket.cliente.nombreComercial}</span></div>}
            {ticket.cliente?.actividadEconomica?.codActividad && <div className="ticket-row"><span>Actividad</span><span>{ticket.cliente.actividadEconomica.codActividad}</span></div>}
            {ticket.cliente?.actividadEconomica?.descActividad && <div className="ticket-small-break">Giro: {ticket.cliente.actividadEconomica.descActividad}</div>}
            {direccionClienteTexto && <div className="ticket-small-break">Dir: {direccionClienteTexto}</div>}
            {ticket.cliente?.telefono && <div className="ticket-row"><span>Tel.</span><span>{ticket.cliente.telefono}</span></div>}
            {ticket.cliente?.correo && <div className="ticket-small-break">Correo: {ticket.cliente.correo}</div>}
          </>
        ) : (
          ticket.cliente?.nit && <div className="ticket-row"><span>Doc.</span><span>{ticket.cliente.nit}</span></div>
        )}

        <div className="ticket-line" />

        <div className="ticket-items">
          {ticket.items.map(item => (
            <div key={item.key} className="ticket-item">
              <div className="ticket-item-name">{item.nombre}</div>
              <div className="ticket-row">
                <span>{item.cantidad} x {formatoDinero(muestraIvaSeparado ? item.precio : item.total / item.cantidad)}</span>
                <span>{formatoDinero(muestraIvaSeparado ? item.total - item.iva : item.total)}</span>
              </div>
              {item.descuento > 0 && (
                <div className="ticket-row ticket-muted">
                  <span>Descuento</span>
                  <span>-{formatoDinero(item.descuento)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ticket-line" />

        <div className="ticket-row"><span>Subtotal</span><span>{formatoDinero(subtotalTicket)}</span></div>
        {muestraIvaSeparado && ticket.resumen.descuentoTotal > 0 && <div className="ticket-row"><span>Descuentos</span><span>-{formatoDinero(ticket.resumen.descuentoTotal)}</span></div>}
        {muestraIvaSeparado && ticket.resumen.ivaTotal > 0 && <div className="ticket-row"><span>IVA 13%</span><span>{formatoDinero(ticket.resumen.ivaTotal)}</span></div>}
        {ticket.resumen.retencion > 0 && <div className="ticket-row"><span>Retencion 1%</span><span>-{formatoDinero(ticket.resumen.retencion)}</span></div>}
        <div className="ticket-row ticket-total"><span>Total</span><span>{formatoDinero(ticket.resumen.totalCobrar)}</span></div>

        <div className="ticket-line" />

        <div className="ticket-row"><span>Pago</span><span>{ticket.metodoPagoLabel}</span></div>
        {ticket.referenciaPago && <div className="ticket-row"><span>Ref.</span><span>{ticket.referenciaPago}</span></div>}
        {ticket.plazo && <div className="ticket-row"><span>Plazo</span><span>{ticket.plazo}</span></div>}
        {ticket.efectivoRecibido !== null && <div className="ticket-row"><span>Recibido</span><span>{formatoDinero(ticket.efectivoRecibido)}</span></div>}
        {ticket.cambio !== null && <div className="ticket-row"><span>Cambio</span><span>{formatoDinero(ticket.cambio)}</span></div>}

        <div className="ticket-line" />

        <div className="ticket-center ticket-footer">
          <div>Gracias por su compra</div>
        </div>
      </div>
    );
  };

  const cobrar = async () => {
    if (carrito.length === 0 || !clienteSeleccionado || !comercio) return;
    if (tipoDte === '03' && camposFaltantesCreditoFiscal.length > 0) {
      setErrorVenta(mensajeClienteCreditoFiscal);
      cerrarDialogoPago();
      return;
    }

    setGuardandoVenta(true);
    setErrorVenta('');

    const cambio = metodoPago === 'efectivo' ? Math.max(redondear((efectivoRecibido || 0) - resumen.totalCobrar), 0) : null;
    const condicionOperacion = metodoPago === 'credito' ? 2 : 1;

    const detallesVenta = carrito.map((item, index) => {
      const calculo = calcItem(item);
      return {
        numItem: index + 1,
        tipoItem: 'BIEN',
        cantidad: monto4(item.cantidad),
        codigo: item.codigo,
        descripcion: item.nombre,
        precioUni: monto4(item.precio),
        montoDescu: monto4(calculo.descuento),
        ventaNoSuj: monto4(item.tipoIva === 'noSujeto' ? calculo.subtotalDesc : 0),
        ventaExenta: monto4(item.tipoIva === 'exento' ? calculo.subtotalDesc : 0),
        ventaGravada: monto4(item.tipoIva === 'gravado' ? calculo.subtotalDesc : 0),
        psv: monto4(item.precio),
        noGravado: monto4(item.tipoIva === 'noGravado' ? calculo.subtotalDesc : 0),
        ivaItem: monto4(calculo.iva),
        producto: { id: item.id },
      };
    });

    const payload = {
      version: 1,
      ambiente: '00',
      tipoDte,
      tipoModelo: 1,
      tipoOperacion: 1,
      tipoMoneda: 'USD',
      jsonVenta: '',
      totalGeneral: monto4(resumen.totalCobrar),
      totalExento: monto4(resumen.porTipo.exento),
      totalNoSujeto: monto4(resumen.porTipo.noSujeto),
      totalGravado: monto4(resumen.porTipo.gravado),
      totalNoGravado: monto4(resumen.porTipo.noGravado),
      totalDescuento: monto4(resumen.descuentoTotal),
      totalIva: monto4(resumen.ivaTotal),
      metodoPago,
      referenciaPago: referenciaPago || null,
      montoPago: monto4(resumen.totalCobrar),
      efectivoRecibido: metodoPago === 'efectivo' ? monto4(efectivoRecibido) : null,
      cambio: cambio !== null ? monto4(cambio) : null,
      plazoValor: metodoPago === 'credito' ? plazoValor : null,
      plazoTipo: metodoPago === 'credito' ? plazoNormalizado(plazoTipo) : null,
      condicionOperacion,
      cliente: { id: clienteSeleccionado.value },
      comercio: { id: comercio.id },
      detallesVenta,
    };

    try {
      const respuesta = await api.post('/Ventas', payload);
      // La API guarda la venta, la firma, la envía a Hacienda y devuelve
      // la venta actualizada con su selloRecepcion.
      setTicketVenta(crearTicketVenta(respuesta.data, cambio));
      // La siguiente venta debe iniciar con el método de pago predeterminado.
      setMetodoPago('efectivo');
      restablecerClienteFinalYFactura();
      setDialogoPago(false);
      setDialogoTicket(true);
      setPagoExitoso(true);
      setCarrito([]);
      setTimeout(() => setPagoExitoso(false), 3000);
    } catch (error) {
      console.error('Error al guardar venta:', error);
      setErrorVenta(error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar la venta.');
    } finally {
      setGuardandoVenta(false);
    }
  };

  return (
    <ContenedorPuntoVenta style={{ '--ancho-ticket': `${ticketAncho}mm` }}>
      <ImpresionTicket>
        {renderTicket(ticketVenta)}
      </ImpresionTicket>

      {pagoExitoso && (
        <AvisoPagoExitoso>
          <i className="pi pi-check-circle text-xl" style={{ color: '#10b981' }}></i>
          <div>
            <p className="font-bold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>Pago exitoso</p>
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>La venta se ha registrado correctamente</p>
          </div>
        </AvisoPagoExitoso>
      )}

      {errorCatalogos && (
        <AvisoError>
          <i className="pi pi-exclamation-triangle"></i>
          <span className="text-sm font-semibold">{errorCatalogos}</span>
        </AvisoError>
      )}

      <div className="punto-venta__contenido">

        {/* ===== LEFT: Products Panel ===== */}
        <PanelCatalogo>
          <div className="premium-surface-card p-3 flex flex-column sm:flex-row gap-3 align-items-start sm:align-items-center">
            <div className="premium-input-group flex-1 punto-venta__barra-herramientas">
              <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.85rem' }}></i>
              <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="w-full" />
            </div>
            <div className="flex align-items-center gap-2 flex-wrap">
              {categorias.map(cat => (
                <button key={cat} onClick={() => setCategoriaActiva(cat)}
                  className="border-none border-round-xl cursor-pointer px-3 py-2 text-sm font-semibold transition-all transition-duration-200"
                  style={{
                    background: categoriaActiva === cat ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface-hover)',
                    color: categoriaActiva === cat ? '#fff' : 'var(--text-secondary)'
                  }}>
                  {cat}
                </button>
              ))}
              <button onClick={recargarProductos} disabled={cargandoCatalogos || recargandoProductos}
                title="Recargar productos"
                className="flex align-items-center justify-content-center gap-2 border-none border-round-xl cursor-pointer transition-all transition-duration-200 px-3 py-2 text-sm font-semibold"
                style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)', opacity: (cargandoCatalogos || recargandoProductos) ? 0.65 : 1 }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--surface-border-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}>
                <i className={`pi ${recargandoProductos ? 'pi-spin pi-spinner' : 'pi-refresh'}`}></i>
                <span>Recargar</span>
              </button>
              <button onClick={togglePantallaCompleta} title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                className="flex align-items-center justify-content-center border-none border-round-xl cursor-pointer transition-all transition-duration-200"
                style={{ width: '36px', height: '36px', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-border-light)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}>
                <i className={`pi ${pantallaCompleta ? 'pi-window-minimize' : 'pi-window-maximize'} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="punto-venta__productos premium-surface-card p-3">
            {cargandoCatalogos ? (
              <div className="punto-venta__estado flex flex-column align-items-center justify-content-center">
                <i className="pi pi-spin pi-spinner text-4xl mb-3" style={{ color: '#6366f1' }}></i>
                <p className="text-lg font-semibold m-0" style={{ color: 'var(--text-icon)' }}>Cargando productos</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="punto-venta__estado punto-venta__estado--vacio flex flex-column align-items-center justify-content-center">
                <i className="pi pi-box text-6xl mb-3" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-lg font-semibold m-0" style={{ color: 'var(--text-icon)' }}>No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid">
                {productosFiltrados.map(producto => (
                  <div key={producto.id} className="col-6 sm:col-4 lg:col-3 xl:col-2">
                    <button type="button" onClick={() => abrirPersonalizar(producto)}
                      className="punto-venta__producto border-none border-round-xl p-3 cursor-pointer flex flex-column align-items-center gap-2"
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = '0 8px 25px -8px rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--surface-border-light)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}>
                      <div className="punto-venta__producto-visual flex align-items-center justify-content-center border-circle">
                        <i className={`${producto.icono} punto-venta__producto-icono-fallback text-lg`} aria-hidden="true"></i>
                        {producto.imagen && (
                          <img
                            src={producto.imagen}
                            alt=""
                            className="punto-venta__producto-imagen"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <span className="punto-venta__producto-nombre text-sm font-semibold text-center">{producto.nombre}</span>
                      <span className="punto-venta__producto-precio text-sm font-bold">
                        ${obtenerPrecioUnitarioMostrado(producto, tipoDte !== '03').toFixed(2)}
                        {tipoDte !== '03' && producto.tipoIva === 'gravado' && <span className="text-2xs font-normal" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}> (IVA incl.)</span>}
                      </span>
                      <Tag value={ETIQUETA_IVA[producto.tipoIva].label} severity={ETIQUETA_IVA[producto.tipoIva].severity} className="punto-venta__producto-etiqueta premium-tag" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PanelCatalogo>

        {/* ===== RIGHT: Cart Panel ===== */}
        <PanelCarrito>
          <div className="p-3 border-bottom-1 surface-border flex align-items-center justify-content-between">
            <div className="flex align-items-center gap-2">
              <div className="flex align-items-center justify-content-center border-circle" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <i className="pi pi-shopping-cart text-white text-sm"></i>
              </div>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Venta Actual</span>
            </div>
            <Tag value={`${carrito.reduce((s, i) => s + i.cantidad, 0)} items`} className="premium-tag" severity="info" />
          </div>

          <button onClick={abrirDialogoCliente} className="w-full border-none cursor-pointer p-3 border-bottom-1 surface-border flex align-items-center gap-3 transition-all transition-duration-200" style={{ background: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div className="flex align-items-center justify-content-center border-circle" style={{ width: '36px', height: '36px', minWidth: '36px', background: !cliente ? 'var(--surface-border-light)' : 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <i className={`${!cliente ? 'pi pi-user' : 'pi pi-user-check'} text-sm`} style={{ color: !cliente ? 'var(--text-muted)' : '#fff' }}></i>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cliente</p>
              <p className="font-semibold m-0 text-sm flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {clienteSeleccionado?.label || 'Seleccione cliente'}
                {clienteSeleccionado?.granContribuyente && (
                  <Tag value="GC" severity="warning" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem' }} />
                )}
              </p>
            </div>
            <i className="pi pi-chevron-down text-xs" style={{ color: 'var(--text-icon)', flexShrink: 0 }}></i>
          </button>

          {!!cliente && (
            <div className="px-3 py-2 flex align-items-center justify-content-between border-bottom-1 surface-border" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-percentage text-xs" style={{ color: esGranContribuyente ? '#f59e0b' : 'var(--text-icon)' }}></i>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Gran Contribuyente</span>
              </div>
              <button 
                onClick={() => setEsGranContribuyente(!esGranContribuyente)}
                className="border-none cursor-pointer p-1 px-2 border-round text-xs font-bold transition-all transition-duration-200"
                style={{
                  background: esGranContribuyente ? 'rgba(245,158,11,0.15)' : 'var(--surface-hover)',
                  color: esGranContribuyente ? '#f59e0b' : 'var(--text-muted)',
                  border: esGranContribuyente ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--surface-border-light)'
                }}
              >
                {esGranContribuyente ? 'Retención Activa' : 'Desactivada'}
              </button>
            </div>
          )}

          <div className="px-3 py-2 border-bottom-1 surface-border flex flex-column gap-2" style={{ background: 'var(--surface-ground-light)' }}>
            <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Tipo de DTE</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TIPOS_DTE.map(t => {
                const esActivo = tipoDte === t.value;
                return (
                  <button key={t.value} onClick={() => setTipoDte(t.value)}
                    className="border-none cursor-pointer p-2 flex align-items-center justify-content-center gap-2 transition-all transition-duration-150"
                    style={{
                      background: esActivo ? `${t.color}15` : 'transparent',
                      border: `1.5px solid ${esActivo ? t.color : 'var(--surface-border-light)'}`,
                      borderRadius: '8px',
                      color: esActivo ? t.color : 'var(--text-secondary)',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => { if (!esActivo) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={(e) => { if (!esActivo) e.currentTarget.style.background = 'transparent'; }}>
                    <i className={`${t.icon} text-xs`} style={{ color: esActivo ? t.color : 'var(--text-icon)' }}></i>
                    <span className="font-bold" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{t.label.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="punto-venta__carrito-contenido">
            {carrito.length === 0 ? (
              <div className="punto-venta__carrito-vacio flex flex-column align-items-center justify-content-center">
                <i className="pi pi-cart-arrow-down text-5xl mb-2" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-icon)' }}>Carrito vacío</p>
                <p className="text-xs m-0" style={{ color: 'var(--text-icon)' }}>Seleccione productos</p>
              </div>
            ) : (
              <div className="flex flex-column gap-2">
                {carrito.map(item => {
                  const c = calcItem(item);
                  return (
                    <div key={item._key} className="p-2 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
                      <div className="flex align-items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.nombre}</span>
                        </div>
                        <div className="flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                          <Tag value={ETIQUETA_IVA[item.tipoIva].label} severity={ETIQUETA_IVA[item.tipoIva].severity} style={{ fontSize: '0.55rem', padding: '0 0.4rem', height: '16px' }} />
                          <span className="font-bold text-sm" style={{ color: c.iva > 0 ? '#6366f1' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>${c.total.toFixed(2)}</span>
                          <button onClick={() => quitarDelCarrito(item._key)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '20px', height: '20px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.55rem', flexShrink: 0 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
                            <i className="pi pi-trash" style={{ fontSize: '0.6rem' }}></i>
                          </button>
                        </div>
                      </div>
                      <div className="flex align-items-center gap-2" style={{ marginTop: '4px' }}>
                        <div className="flex align-items-center" style={{ gap: '2px' }}>
                          <button onClick={() => cambiarCantidad(item._key, -1)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '24px', height: '24px', background: 'var(--surface-border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--text-icon)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-border-light)'}>−</button>
                          <span className="font-bold text-center" style={{ width: '22px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.cantidad}</span>
                          <button onClick={() => cambiarCantidad(item._key, 1)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '24px', height: '24px', background: 'var(--surface-border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--text-icon)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-border-light)'}>+</button>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          × ${obtenerPrecioUnitarioMostrado(item, tipoDte !== '03').toFixed(2)}
                          {tipoDte !== '03' && item.tipoIva === 'gravado' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}> c/IVA</span>}
                        </span>
                        {item.descuentoValor > 0 && <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>−{item.descuentoTipo === 'porcentaje' ? `${item.descuentoValor}%` : `$${item.descuentoValor}`}</span>}
                        <button onClick={() => editarItem(item)} className="border-none bg-transparent cursor-pointer p-0 flex align-items-center text-xs" style={{ color: '#6366f1', marginLeft: 'auto' }}>
                          <i className="pi pi-pencil" style={{ fontSize: '0.6rem' }}></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-top-1 surface-border flex flex-column gap-3">
            <div className="flex flex-column gap-1">
              <div className="flex justify-content-between mb-1">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total de items</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span>
              </div>
              {resumen.porTipo.gravado > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#6366f1' }}> Gravado</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.gravado.toFixed(2)}</span>
                </div>
              )}
              {resumen.porTipo.exento > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#10b981' }}> Exento</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.exento.toFixed(2)}</span>
                </div>
              )}
              {resumen.porTipo.noSujeto > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}> No Sujeto</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noSujeto.toFixed(2)}</span>
                </div>
              )}
              {resumen.porTipo.noGravado > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}> No Gravado</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noGravado.toFixed(2)}</span>
                </div>
              )}
              {resumen.descuentoTotal > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Descuentos</span>
                  <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>-${resumen.descuentoTotal.toFixed(2)}</span>
                </div>
              )}
              {resumen.ivaTotal > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>IVA (13%)</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>${resumen.ivaTotal.toFixed(2)}</span>
                </div>
              )}
              {resumen.retencion > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Retención (1%)</span>
                  <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>-${resumen.retencion.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-content-between pt-2 border-top-1 surface-border">
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total a cobrar</span>
                <span className="font-bold text-xl" style={{ color: '#6366f1' }}>${resumen.totalCobrar.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-1">
              {METODOS_PAGO.map(m => (
                <button key={m.value} onClick={() => setMetodoPago(m.value)}
                  className="flex-1 flex flex-column align-items-center gap-1 p-1 border-round-lg border-none cursor-pointer transition-all transition-duration-200"
                  style={{
                    background: metodoPago === m.value ? `${COLOR_PAGO[m.value]}20` : 'var(--surface-muted)',
                    border: `1.5px solid ${metodoPago === m.value ? COLOR_PAGO[m.value] : 'var(--surface-border-light)'}`
                  }}>
                  <i className={`${m.icono} text-xs`} style={{ color: metodoPago === m.value ? COLOR_PAGO[m.value] : 'var(--text-icon)' }}></i>
                  <span className="text-xs font-semibold" style={{ color: metodoPago === m.value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.6rem' }}>{m.label}</span>
                </button>
              ))}
            </div>

            {mensajeClienteCreditoFiscal && (
              <div className="flex align-items-start gap-2 p-2 border-round-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309' }}>
                <i className="pi pi-exclamation-triangle text-sm mt-1"></i>
                <p className="text-xs font-semibold m-0 line-height-3">{mensajeClienteCreditoFiscal}</p>
              </div>
            )}

            <Button label="Cobrar" icon="pi pi-credit-card" className="premium-btn w-full" style={{ fontSize: '1.05rem' }}
              onClick={() => { if (carrito.length > 0) { setEfectivoRecibido(null); setEfectivoRecibidoTexto(''); setPlazoValor(1); setPlazoTipo('meses'); setReferenciaPago(''); setErrorVenta(''); setDialogoPago(true); }}}
              disabled={carrito.length === 0 || cargandoCatalogos || !clienteSeleccionado || !comercio || camposFaltantesCreditoFiscal.length > 0} />
          </div>
        </PanelCarrito>
      </div>

      {/* ===== Product Customization Dialog ===== */}
      <DialogoPuntoVenta header="Personalizar producto" visible={dialogoItem} style={{ width: '580px' }}
        onHide={() => { setDialogoItem(false); setItemEditando(null); }} draggable={false} resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => { setDialogoItem(false); setItemEditando(null); }} />
            <Button label={carrito.find(i => i._key === itemEditando?._key) ? 'Actualizar' : 'Agregar al Carrito'} icon="pi pi-cart-plus" className="premium-btn" onClick={agregarAlCarrito} />
          </div>
        }>
        {itemEditando && (() => {
          const basePrice = (precioIncluyeIva && itemEditando.tipoIva === 'gravado')
            ? itemEditando.precio / (1 + TASA_IVA)
            : itemEditando.precio;
          const sub = basePrice * itemEditando.cantidad;
          const d = itemEditando.descuentoTipo === 'porcentaje' ? sub * (itemEditando.descuentoValor || 0) / 100 : (itemEditando.descuentoValor || 0);
          const subtotalDesc = sub - d;
          const iva = itemEditando.tipoIva === 'gravado' ? redondear(subtotalDesc * 0.13) : 0;
          return (
            <div className="flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="flex flex-column gap-1">
                <label className="premium-label">Nombre del producto</label>
                <InputText value={itemEditando.nombre} onChange={(e) => setItemEditando({ ...itemEditando, nombre: e.target.value })}
                  className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex flex-column gap-1">
                  <div className="flex justify-content-between align-items-center">
                    <label className="premium-label">Precio unitario</label>
                    <div className="flex border-1 surface-border border-round-lg overflow-hidden" style={{ height: '22px' }}>
                      <button type="button" onClick={() => cambiarModoIvaPrecio(false)}
                        className="border-none cursor-pointer px-2 text-2xs font-bold transition-all transition-duration-150"
                        style={{ background: !precioIncluyeIva ? '#6366f1' : 'var(--card-bg)', color: !precioIncluyeIva ? '#fff' : 'var(--text-muted)', fontSize: '0.62rem' }}>Sin IVA</button>
                      <button type="button" onClick={() => cambiarModoIvaPrecio(true)}
                        className="border-none cursor-pointer px-2 text-2xs font-bold transition-all transition-duration-150"
                        style={{ background: precioIncluyeIva ? '#6366f1' : 'var(--card-bg)', color: precioIncluyeIva ? '#fff' : 'var(--text-muted)', fontSize: '0.62rem' }}>Con IVA</button>
                    </div>
                  </div>
                  <InputNumber value={itemEditando.precio} locale="en-US" onValueChange={(e) => setItemEditando({ ...itemEditando, precio: e.value || 0 })}
                    min={0} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} onFocus={(e) => e.target.select()} />
                </div>
                <div className="flex-1 flex flex-column gap-1">
                  <label className="premium-label">Cantidad</label>
                  <InputNumber value={itemEditando.cantidad} locale="en-US" onValueChange={(e) => setItemEditando({ ...itemEditando, cantidad: e.value || 1 })}
                    min={1} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} onFocus={(e) => e.target.select()} />
                </div>
              </div>

              <div className="flex flex-column gap-1">
                <label className="premium-label">Tipo de IVA</label>
                <div className="flex gap-1">
                  {['gravado', 'exento', 'noSujeto', 'noGravado'].map(t => (
                    <button key={t} onClick={() => setItemEditando({ ...itemEditando, tipoIva: t })}
                      className="flex-1 border-round-xl border-none cursor-pointer py-2 text-xs font-semibold transition-all transition-duration-200"
                      style={{
                        background: itemEditando.tipoIva === t ? `${t === 'gravado' ? '#6366f1' : t === 'exento' ? '#10b981' : t === 'noSujeto' ? '#f59e0b' : '#64748b'}` : 'var(--surface-hover)',
                        color: itemEditando.tipoIva === t ? '#fff' : 'var(--text-secondary)'
                      }}>
                      {ETIQUETA_IVA[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-column gap-1">
                <label className="premium-label">Descuento</label>
                <div className="flex gap-2 align-items-center">
                  <div className="flex border-round-xl overflow-hidden" style={{ border: '1.5px solid var(--surface-border-light)', flexShrink: 0, height: '40px' }}>
                    <button onClick={() => setItemEditando({ ...itemEditando, descuentoTipo: 'porcentaje', descuentoValor: 0 })}
                      className="border-none cursor-pointer px-3 text-sm font-semibold transition-all transition-duration-200"
                      style={{ background: itemEditando.descuentoTipo === 'porcentaje' ? '#6366f1' : 'var(--card-bg)', color: itemEditando.descuentoTipo === 'porcentaje' ? '#fff' : 'var(--text-muted)', height: '100%' }}>%</button>
                    <button onClick={() => setItemEditando({ ...itemEditando, descuentoTipo: 'monto', descuentoValor: 0 })}
                      className="border-none cursor-pointer px-3 text-sm font-semibold transition-all transition-duration-200"
                      style={{ background: itemEditando.descuentoTipo === 'monto' ? '#6366f1' : 'var(--card-bg)', color: itemEditando.descuentoTipo === 'monto' ? '#fff' : 'var(--text-muted)', height: '100%' }}>$</button>
                  </div>
                <InputNumber value={itemEditando.descuentoValor} locale="en-US" onValueChange={(e) => setItemEditando({ ...itemEditando, descuentoValor: e.value || 0 })}
                    min={0} max={itemEditando.descuentoTipo === 'porcentaje' ? 100 : undefined} className="w-full"
                    inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }}
                    minFractionDigits={2} maxFractionDigits={2}
                    placeholder={itemEditando.descuentoTipo === 'porcentaje' ? '0.00%' : '$0.00'}
                    onFocus={(e) => e.target.select()} />
                </div>
              </div>

              <div className="p-3 border-round-xl" style={{ background: 'var(--surface-muted)', border: '1px solid var(--surface-border-light)', overflowX: 'hidden' }}>
                <div className="flex flex-column gap-1">
                  <div className="flex justify-content-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>
                      {itemEditando.cantidad} x ${basePrice.toFixed(2)}
                      {precioIncluyeIva && itemEditando.tipoIva === 'gravado' && <span style={{ fontSize: '0.72rem', opacity: 0.75 }}> (${itemEditando.precio.toFixed(2)} c/IVA)</span>}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>${sub.toFixed(2)}</span>
                  </div>
                  {d > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Descuento</span><span className="font-semibold" style={{ color: '#ef4444' }}>-${d.toFixed(2)}</span></div>}
                  <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>IVA ({itemEditando.tipoIva === 'gravado' ? '13%' : '0%'})</span><span style={{ color: 'var(--text-muted)' }}>${iva.toFixed(2)}</span></div>
                  <div className="flex justify-content-between font-bold pt-1 border-top-1 surface-border"><span style={{ color: 'var(--text-primary)' }}>Total item</span><span className="text-lg" style={{ color: '#6366f1' }}>${(subtotalDesc + iva).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          );
        })()}
      </DialogoPuntoVenta>

      {/* ===== Payment Confirmation Dialog ===== */}
      <DialogoPuntoVenta header="Confirmar Cobro" visible={dialogoPago} style={{ width: '500px' }} onHide={cerrarDialogoPago}
        onShow={() => {
          if (metodoPago === 'efectivo') {
            requestAnimationFrame(() => efectivoRecibidoRef.current?.focus());
          }
        }} draggable={false} resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={cerrarDialogoPago} disabled={guardandoVenta} />
            <Button label={guardandoVenta ? 'Guardando...' : 'Confirmar Pago'} icon={guardandoVenta ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="premium-btn" onClick={cobrar} disabled={guardandoVenta || (metodoPago === 'efectivo' && (!efectivoRecibido || efectivoRecibido < resumen.totalCobrar))} />
          </div>
        }>
        <div className="flex flex-column gap-3 py-2">
          <div className="flex align-items-center gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
            <div className="flex align-items-center justify-content-center border-circle" style={{ width: '48px', height: '48px', minWidth: '48px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <i className="pi pi-file text-white"></i>
            </div>
            <div>
              <p className="font-bold m-0" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado?.label}</p>
              <div className="flex align-items-center gap-2 mt-1 flex-wrap">
                <Tag value={TIPOS_DTE.find(t => t.value === tipoDte)?.label} severity="info" style={{ fontSize: '0.65rem' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• {METODOS_PAGO.find(m => m.value === metodoPago)?.label}</span>
              </div>
            </div>
          </div>

          {errorVenta && (
            <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
              <i className="pi pi-exclamation-circle text-sm"></i>
              <p className="text-xs font-semibold m-0">{errorVenta}</p>
            </div>
          )}

          {metodoPago === 'efectivo' && (
            <div className="flex flex-column gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex flex-column gap-1">
                <label className="premium-label">Efectivo Recibido</label>
                <InputText
                  ref={efectivoRecibidoRef}
                  value={efectivoRecibidoTexto}
                  onChange={(e) => actualizarEfectivoRecibido(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && efectivoRecibido >= resumen.totalCobrar && !guardandoVenta) {
                      e.preventDefault();
                      cobrar();
                    }
                  }}
                  inputMode="decimal"
                  className="w-full"
                  style={{ borderRadius: '10px', padding: '0.65rem 1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                  placeholder="$0.00"
                  onFocus={(e) => e.target.select()}
                />
              </div>
              {efectivoRecibido > 0 && (
                <div className="flex flex-column gap-1">
                  <div className="flex justify-content-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Total</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${resumen.totalCobrar.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-content-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Efectivo</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${efectivoRecibido.toFixed(2)}</span>
                  </div>
                  <hr className="premium-divider" />
                  <div className="flex justify-content-between">
                    <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>Cambio</span>
                    <span className="font-bold text-xl" style={{ color: efectivoRecibido >= resumen.totalCobrar ? '#10b981' : '#ef4444' }}>${(efectivoRecibido - resumen.totalCobrar).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {metodoPago === 'tarjeta' && (
            <div className="flex flex-column gap-2 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex flex-column gap-1">
                <label className="premium-label">N° de Autorización <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label>
                <InputText value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Ej. AUTH-98765" className="w-full" style={{ borderRadius: '10px', padding: '0.6rem 0.75rem' }} />
              </div>
            </div>
          )}

          {metodoPago === 'credito' && (
            <div className="flex flex-column gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <label className="premium-label">Plazo del crédito</label>
              <div style={{ maxWidth: '160px' }}>
                <InputNumber value={plazoValor} onValueChange={(e) => setPlazoValor(e.value || 1)} min={1} max={999}
                  maxFractionDigits={0} useGrouping={false} inputStyle={{ borderRadius: '10px', padding: '0.6rem 0.75rem', textAlign: 'center' }} onFocus={(e) => e.target.select()} />
              </div>
              <div className="flex gap-1">
                {['días', 'meses', 'años'].map(t => (
                  <button key={t} onClick={() => setPlazoTipo(t)}
                    className="flex-1 border-round-xl border-none cursor-pointer py-2 text-xs font-semibold transition-all transition-duration-200"
                    style={{ background: plazoTipo === t ? '#f59e0b' : 'var(--surface-hover)', color: plazoTipo === t ? '#fff' : 'var(--text-secondary)' }}>{t}</button>
                ))}
              </div>
              <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>Pago a {plazoValor} {plazoTipo}</p>
            </div>
          )}

          {metodoPago === 'transferencia' && (
            <div className="flex flex-column gap-2 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: `${COLOR_PAGO.transferencia}15` }}>
                <i className="pi pi-info-circle text-sm" style={{ color: COLOR_PAGO.transferencia }}></i>
                <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>La transferencia se procesará a través de la pasarela de pagos.</p>
              </div>
              <div className="flex flex-column gap-1">
                <label className="premium-label">N° de Transferencia <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label>
                <InputText value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Ej. REF-12345" className="w-full" style={{ borderRadius: '10px', padding: '0.6rem 0.75rem' }} />
              </div>
            </div>
          )}

          <div className="border-top-1 surface-border pt-2 flex flex-column gap-1">
            <div className="flex justify-content-between text-sm mb-1"><span style={{ color: 'var(--text-muted)' }}>Total de items</span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span></div>
            {resumen.porTipo.gravado > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#6366f1' }}> Gravado</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.gravado.toFixed(2)}</span></div>}
            {resumen.porTipo.exento > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#10b981' }}> Exento</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.exento.toFixed(2)}</span></div>}
            {resumen.porTipo.noSujeto > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#f59e0b' }}> No Sujeto</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noSujeto.toFixed(2)}</span></div>}
            {resumen.porTipo.noGravado > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: 'var(--text-muted)' }}> No Gravado</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noGravado.toFixed(2)}</span></div>}
            {resumen.descuentoTotal > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Descuentos</span><span className="font-semibold" style={{ color: '#ef4444' }}>-${resumen.descuentoTotal.toFixed(2)}</span></div>}
            {resumen.ivaTotal > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>IVA (13%)</span><span style={{ color: 'var(--text-muted)' }}>${resumen.ivaTotal.toFixed(2)}</span></div>}
            {resumen.retencion > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#f59e0b' }}>Retención 1%</span><span className="font-semibold" style={{ color: '#f59e0b' }}>-${resumen.retencion.toFixed(2)}</span></div>}
            <div className="flex justify-content-between pt-1 border-top-1 surface-border">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total a cobrar</span>
              <span className="font-bold text-xl" style={{ color: '#6366f1' }}>${resumen.totalCobrar.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogoPuntoVenta>

      {/* ===== Thermal Ticket Dialog ===== */}
      <DialogoPuntoVenta header="Ticket de venta" visible={dialogoTicket} style={{ width: '520px' }}
        onHide={cerrarDialogoTicket} draggable={false} resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={cerrarDialogoTicket} />
            <Button label="Imprimir" icon="pi pi-print" className="premium-btn" onClick={imprimirTicket} disabled={!ticketVenta} />
          </div>
        }>
        <div className="flex flex-column gap-3 py-2">
          <div className="flex align-items-center justify-content-between gap-2 flex-wrap p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-print" style={{ color: '#6366f1' }}></i>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Formato termico</span>
            </div>
            <div className="flex gap-1">
              {ANCHOS_TICKET.map(ancho => (
                <button key={ancho.value} type="button" onClick={() => setTicketAncho(ancho.value)}
                  className="border-none border-round-lg cursor-pointer px-3 py-2 text-xs font-bold transition-all transition-duration-200"
                  style={{
                    background: ticketAncho === ancho.value ? '#6366f1' : 'var(--card-bg)',
                    color: ticketAncho === ancho.value ? '#fff' : 'var(--text-secondary)',
                    border: ticketAncho === ancho.value ? '1px solid #6366f1' : '1px solid var(--surface-border-light)',
                  }}>
                  {ancho.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-round-xl p-3" style={{ background: '#f8fafc', border: '1px solid var(--surface-border-light)', maxHeight: '62vh', overflow: 'auto' }}>
            {renderTicket(ticketVenta)}
          </div>
        </div>
      </DialogoPuntoVenta>

      {/* ===== Customer Selection Dialog ===== */}
      <DialogoPuntoVenta header="Seleccionar Cliente" visible={dialogoCliente} style={{ width: '480px' }} onHide={() => { setDialogoCliente(false); setBusquedaCliente(''); }} draggable={false} resizable={false}>
        <div className="flex flex-column gap-3">
          <Button label="Registrar nuevo cliente" icon="pi pi-user-plus" className="premium-btn w-full" onClick={abrirNuevoCliente} />
          {(cargandoClientes || errorClientes) && (
            <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: errorClientes ? 'rgba(239,68,68,0.1)' : 'var(--surface-muted)', border: errorClientes ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--surface-border-light)', color: errorClientes ? '#ef4444' : 'var(--text-muted)' }}>
              <i className={`pi ${cargandoClientes ? 'pi-spin pi-spinner' : 'pi-exclamation-circle'} text-sm`}></i>
              <p className="text-xs font-semibold m-0">{cargandoClientes ? 'Actualizando clientes...' : errorClientes}</p>
            </div>
          )}
          <div className="premium-input-group">
            <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.85rem' }}></i>
            <InputText value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Buscar por nombre o NIT..." className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} autoFocus />
          </div>
          <div className="flex flex-column gap-1" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {clientesFiltrados.length === 0 ? (
              <div className="flex flex-column align-items-center gap-2 py-5" style={{ opacity: 0.5 }}>
                <i className="pi pi-users text-4xl" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-icon)' }}>No se encontraron clientes</p>
              </div>
            ) : (
              clientesFiltrados.map(c => (
                <button key={c.value} onClick={() => { setCliente(c.value); setEsGranContribuyente(!!c.granContribuyente); setDialogoCliente(false); setBusquedaCliente(''); }}
                  className="w-full border-none border-round-xl cursor-pointer p-3 flex align-items-center gap-3 transition-all transition-duration-200"
                  style={{ background: cliente === c.value ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                  onMouseEnter={(e) => { if (cliente !== c.value) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                  onMouseLeave={(e) => { if (cliente !== c.value) e.currentTarget.style.background = 'transparent'; }}>
                  <div className="flex align-items-center justify-content-center border-circle" style={{ width: '40px', height: '40px', minWidth: '40px', background: cliente === c.value ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface-hover)' }}>
                    <i className={`pi ${c.value === 0 ? 'pi-user' : 'pi-user-check'} text-sm`} style={{ color: cliente === c.value ? '#fff' : 'var(--text-muted)' }}></i>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex align-items-center gap-2">
                      <p className="font-semibold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>{c.label}</p>
                      {c.granContribuyente && <Tag value="Gran Contribuyente" severity="warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }} />}
                    </div>
                    <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>{c.nit}</p>
                  </div>
                  {cliente === c.value && <i className="pi pi-check text-sm" style={{ color: '#6366f1', flexShrink: 0 }}></i>}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogoPuntoVenta>

      {/* ===== Quick Customer Creation Dialog ===== */}
      <DialogoPuntoVenta header="Registrar cliente" visible={dialogoNuevoCliente} style={{ width: '680px' }}
        onHide={() => { setDialogoNuevoCliente(false); setErrorClienteRapido(''); }} draggable={false} resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setDialogoNuevoCliente(false)} disabled={guardandoCliente} />
            <Button label={guardandoCliente ? 'Guardando...' : 'Guardar y seleccionar'} icon={guardandoCliente ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="premium-btn" onClick={guardarClienteRapido} disabled={guardandoCliente} />
          </div>
        }>
        <div className="flex flex-column gap-3 py-2">
          {errorClienteRapido && (
            <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
              <i className="pi pi-exclamation-circle text-sm"></i>
              <p className="text-xs font-semibold m-0">{errorClienteRapido}</p>
            </div>
          )}

          <div className="grid">
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Nombre / razon social</label>
              <InputText value={clienteRapido.nombre} onChange={(e) => setClienteRapido({ ...clienteRapido, nombre: e.target.value })}
                placeholder="Nombre del cliente" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} autoFocus />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Apellidos</label>
              <InputText value={clienteRapido.apellidos} onChange={(e) => setClienteRapido({ ...clienteRapido, apellidos: e.target.value })}
                placeholder="Opcional" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Nombre comercial</label>
              <InputText value={clienteRapido.nombreComercial} onChange={(e) => setClienteRapido({ ...clienteRapido, nombreComercial: e.target.value })}
                placeholder="Opcional" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Tipo documento</label>
              <Dropdown value={clienteRapido.tipoDocumento} options={TIPO_DOC_OPCIONES}
                onChange={(e) => setClienteRapido({ ...clienteRapido, tipoDocumento: e.value })}
                className="w-full" />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Numero documento <span style={{ color: '#ef4444' }}>*</span></label>
              <InputText value={clienteRapido.numDocumento} onChange={(e) => setClienteRapido({ ...clienteRapido, numDocumento: soloDigitos(e.target.value).slice(0, 14) })}
                inputMode="numeric" maxLength={14} placeholder="9 o 14 dígitos, sin guiones" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">NRC</label>
              <InputText value={clienteRapido.nrc} onChange={(e) => setClienteRapido({ ...clienteRapido, nrc: soloDigitos(e.target.value) })}
                inputMode="numeric" placeholder="Solo números, sin guiones" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Telefono <span style={{ color: '#ef4444' }}>*</span></label>
              <InputText value={clienteRapido.telefono} onChange={(e) => setClienteRapido({ ...clienteRapido, telefono: soloDigitos(e.target.value) })}
                inputMode="numeric" placeholder="Mínimo 8 dígitos, sin guiones" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Correo</label>
              <InputText value={clienteRapido.correo} onChange={(e) => setClienteRapido({ ...clienteRapido, correo: e.target.value })}
                placeholder="correo@ejemplo.com" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Distrito</label>
              <Dropdown value={clienteRapido.distrito_id}
                options={distritos.map(d => ({ label: d.nombre || d.Nombre || 'Distrito', value: d.id }))}
                onChange={(e) => setClienteRapido({ ...clienteRapido, distrito_id: e.value })}
                className="w-full" filter />
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-1">
              <label className="premium-label">Actividad economica</label>
              <Dropdown value={clienteRapido.actividadEconomica_id}
                options={actividades.map(a => ({ label: `${a.codActividad || a.CodActividad || ''} - ${a.descActividad || a.DescActividad || ''}`, value: a.id }))}
                onChange={(e) => setClienteRapido({ ...clienteRapido, actividadEconomica_id: e.value })}
                placeholder="Seleccione una actividad económica" className="w-full" filter showClear />
            </div>
            <div className="col-12 flex flex-column gap-1">
              <label className="premium-label">Direccion</label>
              <InputText value={clienteRapido.complementoDireccion} onChange={(e) => setClienteRapido({ ...clienteRapido, complementoDireccion: e.target.value })}
                placeholder="Calle, avenida, numero de casa, colonia..." className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>
            <div className="col-12 flex align-items-center justify-content-between p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div>
                <p className="font-bold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>Gran contribuyente</p>
                <p className="m-0 text-xs" style={{ color: 'var(--text-muted)' }}>Activa la retencion del 1% cuando aplique.</p>
              </div>
              <InputSwitch checked={clienteRapido.granContribuyente} onChange={(e) => setClienteRapido({ ...clienteRapido, granContribuyente: e.value })} />
            </div>
          </div>
        </div>
      </DialogoPuntoVenta>
    </ContenedorPuntoVenta>
  );
}
