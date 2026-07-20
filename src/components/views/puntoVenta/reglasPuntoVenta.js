import {
  calcularItemVenta as calcularItem,
  obtenerPrecioUnitarioMostrado,
  redondearMoneda as redondear,
  TASA_IVA,
} from '../../../utils/calculosVenta.js';
import {
  ETIQUETA_IVA,
  TIPOS_DTE,
  METODOS_PAGO,
  TIPOS_DTE_SIN_IVA,
} from './constantesPuntoVenta.js';

/*
 * Reglas del punto de venta que no dependen de React.
 * Aquí se calculan los totales y se prepara la información que va al backend
 * o al ticket. Mantenerlas fuera del JSX facilita probarlas y revisarlas.
 */
export { TASA_IVA };

// Reglas de precio y etiqueta según el tipo de DTE.
export const esTipoDteSinIva = (tipoDte) => TIPOS_DTE_SIN_IVA.has(tipoDte);

export const obtenerPrecioParaDte = (item, tipoDte) =>
  obtenerPrecioUnitarioMostrado(item, tipoDte !== '03');

export const calcularItemParaDte = (item, tipoDte) => {
  if (!esTipoDteSinIva(tipoDte)) return calcularItem(item);

  const precioLiteral = obtenerPrecioParaDte(item, tipoDte);
  return calcularItem({
    ...item,
    precio: precioLiteral,
    precioConIVA: precioLiteral,
    tipoIva: 'noGravado',
  });
};

export const obtenerEtiquetaIvaParaDte = (tipoIva, tipoDte) =>
  esTipoDteSinIva(tipoDte) && tipoIva === 'gravado'
    ? { label: 'Sin IVA', severity: 'secondary' }
    : ETIQUETA_IVA[tipoIva];

// Convierte el error del backend en un mensaje que el usuario pueda leer.
export const interpretarErrorHacienda = (mensaje) => {
  const texto = typeof mensaje === 'string' ? mensaje : String(mensaje || '');
  const inicioJson = texto.indexOf('{');
  const finJson = texto.lastIndexOf('}');

  if (inicioJson === -1 || finJson <= inicioJson) {
    return {
      esRespuestaHacienda: false,
      titulo: 'No se pudo guardar la venta',
      descripcion: texto,
      observaciones: [],
      respuestaTecnica: texto,
    };
  }

  try {
    const respuesta = JSON.parse(texto.slice(inicioJson, finJson + 1));
    const observaciones = Array.isArray(respuesta.observaciones)
      ? respuesta.observaciones.filter(Boolean)
      : [];

    return {
      esRespuestaHacienda: true,
      titulo: respuesta.estado === 'RECHAZADO' ? 'Documento rechazado por Hacienda' : 'Respuesta de Hacienda',
      descripcion: respuesta.descripcionMsg || 'Hacienda devolvió un error al procesar el documento.',
      observaciones,
      codigo: respuesta.codigoMsg || respuesta.codigo,
      clasificacion: respuesta.clasificaMsg || respuesta.clasificacion,
      respuestaTecnica: texto,
    };
  } catch {
    return {
      esRespuestaHacienda: false,
      titulo: 'No se pudo guardar la venta',
      descripcion: texto,
      observaciones: [],
      respuestaTecnica: texto,
    };
  }
};

// Reglas relacionadas con el cliente y la exportación.
export const esClienteFinal = (cliente) => {
  const texto = `${cliente.label || ''} ${cliente.nombreComercial || ''} ${cliente.nit || ''}`.toLowerCase();
  return texto.includes('consumidor final') ||
    texto.includes('cliente final') ||
    texto.includes('clientes varios') ||
    texto.includes('cliente varios') ||
    texto.includes('varios') ||
    texto.includes('000000000');
};

export const obtenerDatosReceptorVenta = ({ esClienteVariosParaFactura, datosReceptorVenta }) => {
  if (!esClienteVariosParaFactura) {
    return { nombre: '', correo: '' };
  }

  return {
    nombre: datosReceptorVenta.nombre.trim(),
    correo: datosReceptorVenta.correo.trim(),
  };
};

export const obtenerCamposFaltantesExportacion = ({ tipoDte, clienteSeleccionado, datosExportacion }) => {
  if (tipoDte !== '11') return [];

  const datosCliente = [
    !clienteSeleccionado?.nombre && 'nombre del cliente',
    !clienteSeleccionado?.correo && 'correo del cliente',
    !clienteSeleccionado?.telefono && 'teléfono del cliente',
    !clienteSeleccionado?.direccion?.complemento && 'dirección del cliente',
    !clienteSeleccionado?.numDocumento && 'documento del cliente',
  ];
  const datosDte = [
    !datosExportacion.codPais && 'país de destino',
    !datosExportacion.tipoPersona && 'tipo de persona',
    !datosExportacion.tipoItemExpor && 'tipo de exportación',
    !datosExportacion.recintoFiscal && 'recinto fiscal',
    !datosExportacion.tipoRegimen && 'tipo de régimen',
    !datosExportacion.regimen && 'régimen aduanero',
    !datosExportacion.codIncoterms && 'Incoterm',
    !(datosExportacion.complemento || clienteSeleccionado?.direccion?.complemento) && 'dirección del receptor',
  ];

  return [...datosCliente, ...datosDte].filter(Boolean);
};

// Calcula los subtotales, impuestos, retenciones y total final de la venta.
export const calcularResumenVenta = ({
  carrito,
  tipoDte,
  documentoSinIva,
  esGranContribuyente,
  retenerRenta,
  datosExportacion,
}) => {
  let subtotal = 0;
  let descuentoTotal = 0;
  let ivaTotal = 0;
  let total = 0;
  const porTipo = { gravado: 0, exento: 0, noSujeto: 0, noGravado: 0 };

  carrito.forEach((item) => {
    const calculo = calcularItemParaDte(item, tipoDte);
    subtotal += calculo.subtotal;
    descuentoTotal += calculo.descuento;
    ivaTotal += calculo.iva;
    total += calculo.total;
    const tipoResumen = tipoDte === '11' ? 'gravado' : item.tipoIva;
    porTipo[tipoResumen] += calculo.subtotalDesc;
  });

  const aplicaRetencion = !documentoSinIva && esGranContribuyente && porTipo.gravado >= 100;
  const retencionVal = aplicaRetencion ? Number((porTipo.gravado * 0.01).toFixed(4)) : 0;
  const retencion = Number(retencionVal.toFixed(2));
  const aplicaReteRenta = tipoDte === '14' && retenerRenta && total > 0;
  const reteRenta = aplicaReteRenta ? redondear(total * 0.10) : 0;
  const flete = tipoDte === '11' ? Math.max(Number(datosExportacion.flete) || 0, 0) : 0;
  const seguro = tipoDte === '11' ? Math.max(Number(datosExportacion.seguro) || 0, 0) : 0;
  const totalCobrar = Number((total + flete + seguro - retencion - reteRenta).toFixed(2));

  return {
    subtotal,
    descuentoTotal,
    ivaTotal,
    total,
    porTipo,
    retencion,
    aplicaRetencion,
    reteRenta,
    aplicaReteRenta,
    flete,
    seguro,
    totalCobrar,
  };
};

// Formatos usados por el payload y por el ticket.
export const monto4 = (valor) => Number(redondear(valor || 0)).toFixed(4);

export const formatoDinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;

export const formatoFechaTicket = (fecha) => new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'short',
  timeStyle: 'medium',
}).format(fecha);

export const normalizarPlazo = (valor) => {
  if (valor === 'días' || valor === 'dias') return 'dias';
  if (valor === 'años' || valor === 'anios') return 'anios';
  return 'meses';
};

export const parsearMontoPago = (valor) => {
  const limpio = String(valor ?? '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');
  const partes = limpio.split('.');
  const normalizado = partes.length > 1
    ? `${partes[0]}.${partes.slice(1).join('')}`
    : limpio;
  const numero = Number(normalizado);
  return Number.isFinite(numero) && normalizado !== '' ? numero : null;
};

export const calcularCambioPago = (efectivoRecibido, totalCobrar) =>
  Math.max(redondear((efectivoRecibido || 0) - totalCobrar), 0);

// Construye exactamente la estructura que espera el backend de ventas.
export const construirDetallesVenta = ({ carrito, tipoDte }) => carrito.map((item, indice) => {
  const calculo = calcularItemParaDte(item, tipoDte);
  const precioUnitario = obtenerPrecioParaDte(item, tipoDte);
  const esExportacion = tipoDte === '11';

  return {
    numItem: indice + 1,
    tipoItem: 'BIEN',
    cantidad: monto4(item.cantidad),
    codigo: item.codigo,
    descripcion: item.nombre,
    precioUni: monto4(precioUnitario),
    montoDescu: monto4(calculo.descuento),
    ventaNoSuj: monto4(item.tipoIva === 'noSujeto' ? calculo.subtotalDesc : 0),
    ventaExenta: monto4(item.tipoIva === 'exento' ? calculo.subtotalDesc : 0),
    ventaGravada: monto4(esExportacion || item.tipoIva === 'gravado' ? calculo.subtotalDesc : 0),
    psv: monto4(precioUnitario),
    noGravado: monto4(!esExportacion && item.tipoIva === 'noGravado' ? calculo.subtotalDesc : 0),
    ivaItem: monto4(calculo.iva),
    producto: { id: item.id },
  };
});

export const construirPayloadVenta = ({
  carrito,
  tipoDte,
  resumen,
  metodoPago,
  referenciaPago,
  cambio,
  efectivoRecibido,
  plazoValor,
  plazoTipo,
  clienteSeleccionado,
  comercio,
  datosExportacion,
  datosReceptor,
}) => ({
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
  reteRenta: monto4(resumen.reteRenta),
  metodoPago,
  referenciaPago: referenciaPago || null,
  montoPago: monto4(resumen.totalCobrar),
  efectivoRecibido: metodoPago === 'efectivo' ? monto4(efectivoRecibido) : null,
  cambio: cambio !== null ? monto4(cambio) : null,
  plazoValor: metodoPago === 'credito' ? plazoValor : null,
  plazoTipo: metodoPago === 'credito' ? normalizarPlazo(plazoTipo) : null,
  condicionOperacion: metodoPago === 'credito' ? 2 : 1,
  nombreReceptor: datosReceptor.nombre || null,
  correoReceptor: datosReceptor.correo || null,
  datosExportacion: tipoDte === '11' ? {
    ...datosExportacion,
    complemento: datosExportacion.complemento || clienteSeleccionado.direccion?.complemento || '',
    descActividad: datosExportacion.descActividad || clienteSeleccionado.actividadEconomica?.descActividad || '',
  } : null,
  cliente: { id: clienteSeleccionado.value },
  comercio: { id: comercio.id },
  detallesVenta: construirDetallesVenta({ carrito, tipoDte }),
});

// Guarda una copia lista para mostrar en el ticket después de cobrar.
export const crearDatosTicketVenta = ({
  ventaGuardada,
  cambio,
  carrito,
  tipoDte,
  metodoPago,
  referenciaPago,
  efectivoRecibido,
  plazoValor,
  plazoTipo,
  clienteSeleccionado,
  comercio,
  resumen,
  datosReceptor,
}) => ({
  id: ventaGuardada?.id,
  numeroControl: ventaGuardada?.numeroControl,
  codigoGeneracion: ventaGuardada?.codigoGeneracion,
  selloRecepcion: String(ventaGuardada?.selloRecepcion || '').trim(),
  fecha: new Date(),
  tipoDte,
  tipoDteLabel: TIPOS_DTE.find((tipo) => tipo.value === tipoDte)?.label || `DTE ${tipoDte}`,
  metodoPago,
  metodoPagoLabel: METODOS_PAGO.find((metodo) => metodo.value === metodoPago)?.label || metodoPago,
  referenciaPago: referenciaPago || null,
  efectivoRecibido: metodoPago === 'efectivo' ? efectivoRecibido : null,
  cambio,
  plazo: metodoPago === 'credito' ? `${plazoValor} ${plazoTipo}` : null,
  cliente: {
    ...clienteSeleccionado,
    label: datosReceptor.nombre || clienteSeleccionado?.label || 'Consumidor Final',
    correo: datosReceptor.correo || clienteSeleccionado?.correo || '',
  },
  comercio,
  items: carrito.map((item) => {
    const calculo = calcularItemParaDte(item, tipoDte);
    return {
      key: item._key,
      codigo: item.codigo,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: obtenerPrecioParaDte(item, tipoDte),
      descuento: calculo.descuento,
      iva: calculo.iva,
      total: calculo.total,
    };
  }),
  resumen: {
    ...resumen,
    porTipo: { ...resumen.porTipo },
  },
});
