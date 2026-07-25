const TASA_IVA = 0.13;
const TASA_RETENCION = 0.01;

const TRIBUTACIONES = {
  GRAVADO: 'gravado',
  EXENTO: 'exento',
  NO_SUJETO: 'noSujeto',
  NO_GRAVADO: 'noGravado',
};

const TRIBUTACION_PRODUCTO = {
  GRAVADO: TRIBUTACIONES.GRAVADO,
  EXENTO: TRIBUTACIONES.EXENTO,
  NO_SUJETO: TRIBUTACIONES.NO_SUJETO,
  NO_GRAVADO: TRIBUTACIONES.NO_GRAVADO,
};

const numeroSeguro = (valor, valorPorDefecto = 0) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : valorPorDefecto;
};

const redondear = (valor, decimales = 4) => {
  const factor = 10 ** decimales;
  return Math.round((numeroSeguro(valor) + Number.EPSILON) * factor) / factor;
};

export const monto4 = (valor) => redondear(valor, 4).toFixed(4);

export const etiquetaTributacionNota = (tributacion) => ({
  [TRIBUTACIONES.GRAVADO]: 'Gravado',
  [TRIBUTACIONES.EXENTO]: 'Exento',
  [TRIBUTACIONES.NO_SUJETO]: 'No sujeto',
  [TRIBUTACIONES.NO_GRAVADO]: 'No gravado',
}[tributacion] || 'Sin clasificación');

export const detectarTributacionNota = (detalle) => {
  const tipoProducto = String(detalle?.producto?.tipoTributacion || '').toUpperCase();
  if (TRIBUTACION_PRODUCTO[tipoProducto]) return TRIBUTACION_PRODUCTO[tipoProducto];
  if (numeroSeguro(detalle?.noGravado) > 0) return TRIBUTACIONES.NO_GRAVADO;
  if (numeroSeguro(detalle?.ventaExenta) > 0) return TRIBUTACIONES.EXENTO;
  if (numeroSeguro(detalle?.ventaNoSuj) > 0) return TRIBUTACIONES.NO_SUJETO;
  if (numeroSeguro(detalle?.ventaGravada) > 0 || numeroSeguro(detalle?.ivaItem) > 0) {
    return TRIBUTACIONES.GRAVADO;
  }
  return null;
};

export const normalizarDetallesNota = (detalles = []) => (
  Array.isArray(detalles)
    ? detalles.map((detalle, indice) => {
      const cantidadOriginal = Math.max(numeroSeguro(detalle?.cantidad), 0);
      const precioOriginal = Math.max(numeroSeguro(detalle?.precioUni), 0);
      const numItem = numeroSeguro(detalle?.numItem, indice + 1);
      return {
        key: String(detalle?.id ?? `${numItem}-${detalle?.codigo || indice}`),
        seleccionada: false,
        cantidadOriginal,
        precioOriginal,
        cantidadNota: cantidadOriginal,
        precioNota: precioOriginal,
        tributacion: detectarTributacionNota(detalle),
        detalleOriginal: { ...detalle },
      };
    })
    : []
);

export const validarLineaNota = (linea, tipoDte) => {
  if (!linea?.seleccionada) return [];

  const errores = [];
  const cantidad = numeroSeguro(linea.cantidadNota, Number.NaN);
  const precio = numeroSeguro(linea.precioNota, Number.NaN);

  if (!linea.tributacion) errores.push('No se pudo determinar el tratamiento tributario.');
  if (!Number.isFinite(cantidad) || cantidad <= 0) errores.push('La cantidad debe ser mayor que cero.');
  if (!Number.isFinite(precio) || precio <= 0) errores.push('El precio debe ser mayor que cero.');
  if (tipoDte === '05' && Number.isFinite(cantidad) && cantidad > linea.cantidadOriginal) {
    errores.push(`La cantidad no puede superar ${linea.cantidadOriginal}.`);
  }
  if (Number.isFinite(cantidad) && Math.abs(cantidad - redondear(cantidad, 4)) > 1e-9) {
    errores.push('La cantidad admite un máximo de cuatro decimales.');
  }
  if (Number.isFinite(precio) && Math.abs(precio - redondear(precio, 4)) > 1e-9) {
    errores.push('El precio admite un máximo de cuatro decimales.');
  }

  return errores;
};

export const validarNota = (lineas, tipoDte) => {
  const seleccionadas = (lineas || []).filter((linea) => linea.seleccionada);
  const erroresPorLinea = Object.fromEntries(
    seleccionadas
      .map((linea) => [linea.key, validarLineaNota(linea, tipoDte)])
      .filter(([, errores]) => errores.length > 0)
  );

  return {
    seleccionadas,
    erroresPorLinea,
    esValida: seleccionadas.length > 0 && Object.keys(erroresPorLinea).length === 0,
    mensajeGeneral: seleccionadas.length === 0 ? 'Seleccione al menos una línea para emitir la nota.' : '',
  };
};

const calcularLineaNota = (linea) => {
  const cantidad = Math.max(numeroSeguro(linea.cantidadNota), 0);
  const precio = Math.max(numeroSeguro(linea.precioNota), 0);
  const subtotal = redondear(cantidad * precio, 4);
  let iva = 0;

  if (linea.tributacion === TRIBUTACIONES.GRAVADO) {
    const cantidadOriginal = numeroSeguro(linea.cantidadOriginal);
    const ivaOriginal = numeroSeguro(linea.detalleOriginal?.ivaItem);
    const conservaPrecioOriginal = Math.abs(precio - numeroSeguro(linea.precioOriginal)) < 0.00005;

    iva = conservaPrecioOriginal && cantidadOriginal > 0 && ivaOriginal > 0
      ? redondear(cantidad * (ivaOriginal / cantidadOriginal), 4)
      : redondear(subtotal * TASA_IVA, 4);
  }

  return { subtotal, iva };
};

export const calcularResumenNota = ({ lineas = [], esGranContribuyente = false }) => {
  const porTipo = {
    gravado: 0,
    exento: 0,
    noSujeto: 0,
    noGravado: 0,
  };
  let ivaTotal = 0;

  lineas.filter((linea) => linea.seleccionada).forEach((linea) => {
    const calculo = calcularLineaNota(linea);
    if (linea.tributacion && Object.hasOwn(porTipo, linea.tributacion)) {
      porTipo[linea.tributacion] = redondear(porTipo[linea.tributacion] + calculo.subtotal, 4);
    }
    ivaTotal = redondear(ivaTotal + calculo.iva, 4);
  });

  const subtotal = redondear(Object.values(porTipo).reduce((suma, valor) => suma + valor, 0), 4);
  const aplicaRetencion = esGranContribuyente && porTipo.gravado >= 100;
  const retencion4 = aplicaRetencion ? redondear(porTipo.gravado * TASA_RETENCION, 4) : 0;
  const retencion = redondear(retencion4, 2);
  const montoTotalOperacion = redondear(subtotal + ivaTotal, 4);
  const totalPagar = redondear(montoTotalOperacion - retencion, 2);

  return {
    porTipo,
    subtotal,
    ivaTotal,
    aplicaRetencion,
    retencion,
    montoTotalOperacion,
    totalPagar,
    lineasSeleccionadas: lineas.filter((linea) => linea.seleccionada).length,
  };
};

const construirDetalleNota = (linea, indice, codigoGeneracion, resumenLinea) => {
  const detalle = linea.detalleOriginal || {};
  const productoId = detalle.producto?.id;
  const subtotal = resumenLinea.subtotal;
  const es = (tributacion) => linea.tributacion === tributacion;

  return {
    numItem: indice + 1,
    tipoItem: detalle.tipoItem || 'BIEN',
    numeroDocumento: codigoGeneracion,
    cantidad: monto4(linea.cantidadNota),
    codigo: detalle.codigo,
    codTributo: detalle.codTributo || null,
    descripcion: detalle.descripcion,
    precioUni: monto4(linea.precioNota),
    montoDescu: monto4(0),
    ventaNoSuj: monto4(es(TRIBUTACIONES.NO_SUJETO) ? subtotal : 0),
    ventaExenta: monto4(es(TRIBUTACIONES.EXENTO) ? subtotal : 0),
    ventaGravada: monto4(es(TRIBUTACIONES.GRAVADO) ? subtotal : 0),
    psv: monto4(linea.precioNota),
    noGravado: monto4(es(TRIBUTACIONES.NO_GRAVADO) ? subtotal : 0),
    ivaItem: monto4(resumenLinea.iva),
    ...(productoId ? { producto: { id: productoId } } : {}),
  };
};

export const construirPayloadNota = ({ ventaOrigen, lineas, tipoDte }) => {
  if (!['05', '06'].includes(tipoDte)) {
    throw new Error('El tipo de nota debe ser DTE 05 o DTE 06.');
  }
  if (!ventaOrigen?.codigoGeneracion) {
    throw new Error('La venta original no contiene código de generación.');
  }
  if (!ventaOrigen?.cliente?.id || !ventaOrigen?.comercio?.id) {
    throw new Error('La venta original no contiene cliente o comercio válido.');
  }

  const validacion = validarNota(lineas, tipoDte);
  if (!validacion.esValida) {
    throw new Error(validacion.mensajeGeneral || 'Revise las líneas seleccionadas antes de emitir.');
  }

  const esGranContribuyente = Boolean(ventaOrigen?.cliente?.granContribuyente);
  const resumen = calcularResumenNota({ lineas, esGranContribuyente });
  const detallesVenta = validacion.seleccionadas.map((linea, indice) => (
    construirDetalleNota(
      linea,
      indice,
      ventaOrigen?.codigoGeneracion,
      calcularLineaNota(linea)
    )
  ));

  return {
    version: 4,
    ambiente: ventaOrigen?.ambiente || '00',
    tipoDte,
    tipoModelo: numeroSeguro(ventaOrigen?.tipoModelo, 1),
    tipoOperacion: numeroSeguro(ventaOrigen?.tipoOperacion, 1),
    tipoMoneda: ventaOrigen?.tipoMoneda || 'USD',
    jsonVenta: '',
    totalGeneral: monto4(resumen.totalPagar),
    totalExento: monto4(resumen.porTipo.exento),
    totalNoSujeto: monto4(resumen.porTipo.noSujeto),
    totalGravado: monto4(resumen.porTipo.gravado),
    totalNoGravado: monto4(resumen.porTipo.noGravado),
    totalDescuento: monto4(0),
    totalIva: monto4(resumen.ivaTotal),
    reteRenta: monto4(0),
    metodoPago: ventaOrigen?.metodoPago || null,
    referenciaPago: ventaOrigen?.referenciaPago || null,
    montoPago: monto4(resumen.totalPagar),
    efectivoRecibido: null,
    cambio: null,
    plazoValor: ventaOrigen?.plazoValor ?? null,
    plazoTipo: ventaOrigen?.plazoTipo ?? null,
    condicionOperacion: numeroSeguro(ventaOrigen?.condicionOperacion, 1),
    nombreReceptor: ventaOrigen?.nombreReceptor || null,
    correoReceptor: ventaOrigen?.correoReceptor || null,
    cliente: { id: ventaOrigen?.cliente?.id },
    comercio: { id: ventaOrigen?.comercio?.id },
    detallesVenta,
  };
};
