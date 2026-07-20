// Opciones y valores iniciales compartidos por la vista y sus componentes.

// Métodos de pago que se pueden seleccionar en el carrito.
export const METODOS_PAGO = [
  { label: 'Efectivo', value: 'efectivo', icono: 'pi pi-money-bill' },
  { label: 'Tarjeta', value: 'tarjeta', icono: 'pi pi-credit-card' },
  { label: 'Crédito', value: 'credito', icono: 'pi pi-clock' },
  { label: 'Transferencia', value: 'transferencia', icono: 'pi pi-building' },
];

// Documentos que el POS puede preparar.
export const TIPOS_DTE = [
  { label: 'Factura (DTE 01)', value: '01', icon: 'pi pi-user', color: '#10b981' },
  { label: 'Crédito Fiscal (DTE 03)', value: '03', icon: 'pi pi-briefcase', color: '#6366f1' },
  { label: 'Sujeto Excluido (DTE 14)', value: '14', icon: 'pi pi-user-minus', color: '#f59e0b' },
  { label: 'Exportación (DTE 11)', value: '11', icon: 'pi pi-globe', color: '#8b5cf6' },
];

// Texto y color de cada tipo de IVA que se muestra en pantalla.
export const ETIQUETA_IVA = {
  gravado: { label: 'IVA 13%', severity: 'info' },
  exento: { label: 'Exento', severity: 'success' },
  noSujeto: { label: 'No Sujeto', severity: 'warning' },
  noGravado: { label: 'No Gravado', severity: 'secondary' },
};

// Color usado para distinguir cada método de pago.
export const COLOR_PAGO = {
  efectivo: '#10b981',
  tarjeta: '#6366f1',
  credito: '#f59e0b',
  transferencia: '#8b5cf6',
};

// Opciones guardadas para el ticket térmico.
export const ANCHOS_TICKET = [
  { label: '80 mm', value: 80 },
  { label: '58 mm', value: 58 },
];

export const TICKET_ANCHO_STORAGE_KEY = 'pos.ticketAnchoMm';

// Tipos de documento disponibles al crear un cliente rápido.
export const TIPO_DOC_OPCIONES = [
  { label: 'DUI', value: 13 },
  { label: 'NIT', value: 36 },
  { label: 'Pasaporte', value: 3 },
  { label: 'Carnet residente', value: 2 },
  { label: 'Otro', value: 37 },
];

// Valores iniciales para limpiar formularios y comenzar una venta nueva.
export const clienteRapidoInicial = {
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

export const datosReceptorVentaInicial = {
  nombre: '',
  correo: '',
};

export const datosExportacionDte11Iniciales = {
  tipoItemExpor: null,
  tipoItemExporDescripcion: '',
  recintoFiscal: '',
  recintoFiscalDescripcion: '',
  tipoRegimen: '',
  tipoRegimenDescripcion: '',
  regimen: '',
  regimenDescripcion: '',
  codPais: '',
  nombrePais: '',
  complemento: '',
  tipoPersona: null,
  tipoPersonaDescripcion: '',
  descActividad: '',
  codIncoterms: '',
  descIncoterms: '',
  flete: 0,
  seguro: 0,
};

export const TRIBUTACION_A_IVA = {
  GRAVADO: 'gravado',
  EXENTO: 'exento',
  NO_SUJETO: 'noSujeto',
  NO_GRAVADO: 'noGravado',
};

export const ICONO_CATEGORIA = {
  bebidas: 'pi pi-glass',
  alimentos: 'pi pi-shopping-cart',
  comida: 'pi pi-shopping-cart',
  comidas: 'pi pi-shopping-cart',
  postres: 'pi pi-star',
  electronica: 'pi pi-desktop',
  electrónica: 'pi pi-desktop',
};

export const TIPOS_DTE_SIN_IVA = new Set(['11', '14']);
