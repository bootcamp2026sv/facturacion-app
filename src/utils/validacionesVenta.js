const tieneValor = (valor) => String(valor ?? '').trim().length > 0;

export function obtenerCamposFaltantesCreditoFiscal(cliente) {
  if (!cliente) return ['cliente'];

  const direccion = cliente.direccion || {};
  const actividad = cliente.actividadEconomica;
  const tieneDistrito = cliente.distritoId != null || tieneValor(direccion.distrito);
  const tieneActividad = !!actividad && (
    actividad.id != null ||
    tieneValor(actividad.codActividad) ||
    tieneValor(actividad.CodActividad) ||
    tieneValor(actividad.descActividad) ||
    tieneValor(actividad.DescActividad)
  );

  return [
    { etiqueta: 'nombre o razón social', completo: tieneValor(cliente.nombre) },
    { etiqueta: 'DUI/NIT', completo: tieneValor(cliente.numDocumento) },
    { etiqueta: 'teléfono', completo: tieneValor(cliente.telefono) },
    { etiqueta: 'NRC', completo: tieneValor(cliente.nrc) },
    { etiqueta: 'dirección', completo: tieneValor(direccion.complemento) },
    { etiqueta: 'distrito', completo: tieneDistrito },
    { etiqueta: 'actividad económica', completo: tieneActividad },
    { etiqueta: 'correo', completo: tieneValor(cliente.correo) },
  ].filter(campo => !campo.completo).map(campo => campo.etiqueta);
}
