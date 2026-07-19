export const TASA_IVA = 0.13;

export function redondearMoneda(valor) {
  const numero = Number(valor) || 0;
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

export function desglosarIvaIncluido(totalIncluido) {
  const total = redondearMoneda(Math.max(Number(totalIncluido) || 0, 0));
  const iva = redondearMoneda(total * TASA_IVA / (1 + TASA_IVA));
  const gravado = redondearMoneda(total - iva);

  return { gravado, iva, total };
}

export function obtenerPrecioUnitarioMostrado(item, incluyeIva) {
  const precioBase = Math.max(Number(item.precio) || 0, 0);

  if (item.tipoIva !== 'gravado') {
    return redondearMoneda(precioBase);
  }

  const precioConIvaGuardado = Number(item.precioConIVA);
  const precioConIva = Number.isFinite(precioConIvaGuardado) && precioConIvaGuardado > 0
    ? precioConIvaGuardado
    : precioBase * (1 + TASA_IVA);
  const desglose = desglosarIvaIncluido(precioConIva);

  return incluyeIva ? desglose.total : desglose.gravado;
}

export function calcularItemVenta(item) {
  const cantidad = Math.max(Number(item.cantidad) || 0, 0);
  const precioBase = Math.max(Number(item.precio) || 0, 0);
  const subtotal = precioBase * cantidad;
  const descuentoSolicitado = item.descuentoTipo === 'porcentaje'
    ? subtotal * Math.max(Number(item.descuentoValor) || 0, 0) / 100
    : Math.max(Number(item.descuentoValor) || 0, 0);
  const descuento = Math.min(descuentoSolicitado, subtotal);
  const subtotalDescExacto = subtotal - descuento;

  if (item.tipoIva !== 'gravado') {
    const total = redondearMoneda(subtotalDescExacto);
    return { subtotal, descuento, subtotalDesc: total, iva: 0, total };
  }

  const precioConIvaGuardado = Number(item.precioConIVA);
  const precioConIva = Number.isFinite(precioConIvaGuardado) && precioConIvaGuardado > 0
    ? precioConIvaGuardado
    : precioBase * (1 + TASA_IVA);
  const proporcionDespuesDescuento = subtotal > 0 ? subtotalDescExacto / subtotal : 0;
  const totalIncluido = precioConIva * cantidad * proporcionDespuesDescuento;
  const desglose = desglosarIvaIncluido(totalIncluido);

  return {
    subtotal,
    descuento,
    subtotalDesc: desglose.gravado,
    iva: desglose.iva,
    total: desglose.total,
  };
}
