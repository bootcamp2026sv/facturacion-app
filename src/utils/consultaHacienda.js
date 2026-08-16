const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}/;

export const obtenerFechaEmisionHacienda = (fecha) => {
  if (!fecha) return null;

  if (typeof fecha === 'string') {
    const coincidencia = fecha.match(FORMATO_FECHA);
    if (coincidencia) return coincidencia[0];
  }

  const fechaNormalizada = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(fechaNormalizada.getTime())) return null;

  const anio = fechaNormalizada.getFullYear();
  const mes = String(fechaNormalizada.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaNormalizada.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Debe permanecer alineada con la URL que codifican los generadores PDF del backend.
export const construirUrlConsultaHacienda = ({ ambiente, codigoGeneracion, fecha } = {}) => {
  const codigo = String(codigoGeneracion || '').trim();
  const fechaEmision = obtenerFechaEmisionHacienda(fecha);
  if (!codigo || !fechaEmision) return null;

  const ambienteNormalizado = String(ambiente || '00').trim() || '00';
  return `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambienteNormalizado}`
    + `&codGen=${codigo}&fechaEmi=${fechaEmision}`;
};
