export const MESES_REPORTE = Object.freeze([
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
]);

export const TIPOS_INGRESO_RENTA = Object.freeze([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13,
].map((value) => ({ value, label: `${value}` })));

export const REPORTES_FACTURACION = Object.freeze([
  { tipo: 'excel-general', titulo: 'Reporte general Excel', descripcion: 'Facturas válidas, pendientes, anuladas, resumen diario y eventos EOP/ERET.', icono: 'pi pi-file-excel', tono: 'verde' },
  { tipo: 'zip-json', titulo: 'ZIP mensual de JSON', descripcion: 'Todos los documentos del período, incluidos anulados, pendientes y JSON recuperados.', icono: 'pi pi-file-export', tono: 'azul' },
  { tipo: 'anexo-1', titulo: 'Anexo 1 CSV', descripcion: 'DTE 03, 05 y 06 válidos en las 20 columnas del F07.', icono: 'pi pi-table', tono: 'morado' },
  { tipo: 'anexo-2', titulo: 'Anexo 2 CSV', descripcion: 'DTE 01 válidos agrupados por día en las 23 columnas del F07.', icono: 'pi pi-calendar', tono: 'naranja' },
  { tipo: 'libro-consumidor', titulo: 'Libro de consumidor final', descripcion: 'Resumen diario de DTE 01 válidos con fila final de totales.', icono: 'pi pi-book', tono: 'cian' },
  { tipo: 'libro-contribuyentes', titulo: 'Libro de contribuyentes', descripcion: 'Detalle por documento para DTE 03 o para 03/05/06.', icono: 'pi pi-building-columns', tono: 'rojo' },
]);

export const rangoMensual = (anio, mes) => {
  if (!anio || !mes) return '';
  const mm = String(mes).padStart(2, '0');
  const siguiente = Number(mes) === 12 ? { mes: 1, anio: Number(anio) + 1 } : { mes: Number(mes) + 1, anio: Number(anio) };
  return `[01/${mm}/${anio} 00:00, 01/${String(siguiente.mes).padStart(2, '0')}/${siguiente.anio} 00:00)`;
};

export const extraerNombreArchivo = (contentDisposition, respaldo = 'reporte') => {
  if (!contentDisposition) return respaldo;
  const utf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try { return decodeURIComponent(utf8[1].replaceAll('"', '').trim()); } catch { return utf8[1]; }
  }
  const normal = contentDisposition.match(/filename="?([^";]+)"?/i);
  return normal?.[1]?.trim() || respaldo;
};

export const filasParaEnvio = (filas) => filas.map((fila) => Object.fromEntries(
  Object.entries(fila).map(([clave, valor]) => [clave, valor == null ? '' : String(valor)]),
));

const CAMPOS_AJUSTE = [
  'fechaAnulacion', 'cliente', 'telefono', 'correo', 'documento', 'nrc',
  'giro', 'actividad', 'retencionIva', 'retencionRenta', 'impuestoPercibido', 'fovial', 'cotrans', 'turismo',
];

export const ajustesDesdeFilas = (filas) => filas.map((fila) => ({
  ventaId: Number(fila.id),
  ...Object.fromEntries(CAMPOS_AJUSTE.map((campo) => [campo, fila[campo] == null ? '' : String(fila[campo])])),
}));

export const erroresLocalesReporte = (tipo, filas, columnas = []) => {
  if (!filas.length) return ['No hay filas disponibles para descargar.'];
  const errores = [];
  filas.forEach((fila, indice) => {
    if (tipo === 'excel-general') {
      if (['17', '18'].includes(String(fila.tipoDte))) return;
      if (fila.estado === 'ANULADO' && !String(fila.fechaAnulacion || '').trim()) errores.push(`Fila ${indice + 1}: falta fecha de anulación.`);
      // Un DTE-01 puede tener receptor null cuando se emitió para un cliente
      // genérico sin datos personalizados. DTE-03 y los demás tipos siguen
      // requiriendo cliente/receptor en el reporte general.
      if (String(fila.tipoDte) !== '01' && !String(fila.cliente || '').trim()) {
        errores.push(`Fila ${indice + 1}: falta cliente.`);
      }
    }
    if (tipo === 'libro-contribuyentes' && (!String(fila.cliente || '').trim() || !String(fila.nrc || '').trim())) {
      errores.push(`Fila ${indice + 1}: complete cliente y NRC.`);
    }
    if (tipo.startsWith('anexo-')) {
      columnas.forEach(({ campo }) => {
        if (!(campo in fila)) errores.push(`Fila ${indice + 1}: falta ${campo}.`);
      });
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(fila.fecha || ''))) errores.push(`Fila ${indice + 1}: fecha inválida.`);
      const numericos = columnas.filter(({ campo }) => /ventas|debito|total/i.test(campo));
      numericos.forEach(({ campo }) => {
        if (!/^-?\d+(\.\d+)?$/.test(String(fila[campo] ?? ''))) errores.push(`Fila ${indice + 1}: ${campo} debe ser decimal con punto.`);
      });
      if (!['0', '1', '2', '3', '4'].includes(String(fila.tipoOperacion))) errores.push(`Fila ${indice + 1}: tipo de operación inválido.`);
      if (!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '13'].includes(String(fila.tipoIngreso))) errores.push(`Fila ${indice + 1}: tipo de ingreso inválido.`);
    }
    if (tipo.startsWith('libro-')) {
      columnas.filter(({ tipo: clase }) => clase === 'numero').forEach(({ campo }) => {
        if (!/^-?\d+(\.\d+)?$/.test(String(fila[campo] ?? ''))) errores.push(`Fila ${indice + 1}: ${campo} debe ser numérico.`);
      });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fila.fecha || ''))) errores.push(`Fila ${indice + 1}: fecha inválida.`);
    }
  });
  return errores;
};
