const tieneValor = (valor) => String(valor ?? '').trim().length > 0;

export function obtenerCamposFaltantesCreditoFiscal(cliente) {
  if (!cliente) return ['cliente'];

  const direccion = cliente.direccion || {};
  const actividad = cliente.actividadEconomica;
  const tieneDireccionCompleta = tieneValor(direccion.departamento)
    && tieneValor(direccion.municipio)
    && tieneValor(direccion.distrito)
    && tieneValor(direccion.complemento);
  const codigoActividad = actividad?.codActividad ?? actividad?.CodActividad;
  const descripcionActividad = actividad?.descActividad ?? actividad?.DescActividad;
  const tieneActividadCompleta = !!actividad
    && tieneValor(codigoActividad)
    && tieneValor(descripcionActividad);

  return [
    { etiqueta: 'nombre o razón social', completo: tieneValor(cliente.nombre) },
    { etiqueta: 'DUI/NIT', completo: tieneValor(cliente.numDocumento) },
    { etiqueta: 'teléfono', completo: tieneValor(cliente.telefono) },
    { etiqueta: 'NRC', completo: tieneValor(cliente.nrc) },
    { etiqueta: 'dirección completa', completo: tieneDireccionCompleta },
    { etiqueta: 'actividad económica completa', completo: tieneActividadCompleta },
    { etiqueta: 'correo', completo: tieneValor(cliente.correo) },
  ].filter(campo => !campo.completo).map(campo => campo.etiqueta);
}
