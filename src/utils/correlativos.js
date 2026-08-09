export const MAXIMO_CORRELATIVO_DTE = 999999999999999;

export const TIPOS_DTE_CORRELATIVO = [
  { label: '01 · Factura de Consumidor Final', value: '01' },
  { label: '03 · Comprobante de Crédito Fiscal', value: '03' },
  { label: '05 · Nota de Crédito', value: '05' },
  { label: '06 · Nota de Débito', value: '06' },
  { label: '11 · Factura de Exportación', value: '11' },
  { label: '14 · Factura de Sujeto Excluido', value: '14' }
];

export const AMBIENTES_CORRELATIVO = [
  { label: '00 · Pruebas', value: '00' },
  { label: '01 · Producción', value: '01' }
];

export const crearFormularioCorrelativoInicial = (anio = new Date().getFullYear()) => ({
  id: null,
  tipoDte: '01',
  ambiente: '00',
  anio,
  codEstable: 'M001',
  codPuntoVenta: 'P001',
  ultimoValor: 0
});

export const convertirCorrelativoAFormulario = (correlativo) => ({
  id: correlativo.id,
  tipoDte: String(correlativo.tipoDte || ''),
  ambiente: String(correlativo.ambiente || ''),
  anio: Number(correlativo.anio),
  codEstable: String(correlativo.codEstable || '').toUpperCase(),
  codPuntoVenta: String(correlativo.codPuntoVenta || '').toUpperCase(),
  ultimoValor: Number(correlativo.ultimoValor)
});

const codigoValido = (valor) => /^[A-Z0-9]{4}$/.test(String(valor || '').trim().toUpperCase());

export const validarFormularioCorrelativo = (formulario, esEdicion = false) => {
  const errores = {};
  const ultimoValor = Number(formulario.ultimoValor);

  if (!Number.isSafeInteger(ultimoValor) || ultimoValor < 0 || ultimoValor > MAXIMO_CORRELATIVO_DTE) {
    errores.ultimoValor = 'Ingrese un entero entre 0 y 999999999999999.';
  }

  if (esEdicion) return errores;

  if (!/^\d{2}$/.test(String(formulario.tipoDte || ''))) {
    errores.tipoDte = 'Seleccione un tipo DTE válido.';
  }
  if (!['00', '01'].includes(String(formulario.ambiente || ''))) {
    errores.ambiente = 'Seleccione el ambiente.';
  }

  const anio = Number(formulario.anio);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    errores.anio = 'Ingrese un año entre 2000 y 2100.';
  }
  if (!codigoValido(formulario.codEstable)) {
    errores.codEstable = 'Debe contener exactamente 4 letras o números.';
  }
  if (!codigoValido(formulario.codPuntoVenta)) {
    errores.codPuntoVenta = 'Debe contener exactamente 4 letras o números.';
  }

  return errores;
};

export const construirSolicitudCorrelativo = (formulario) => ({
  tipoDte: String(formulario.tipoDte),
  ambiente: String(formulario.ambiente),
  anio: Number(formulario.anio),
  codEstable: String(formulario.codEstable).trim().toUpperCase(),
  codPuntoVenta: String(formulario.codPuntoVenta).trim().toUpperCase(),
  ultimoValor: Number(formulario.ultimoValor)
});

export const formatearCorrelativoDte = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 0) return '—';
  return String(numero).padStart(15, '0');
};

export const obtenerEtiquetaTipoDte = (tipoDte) => (
  TIPOS_DTE_CORRELATIVO.find((tipo) => tipo.value === String(tipoDte))?.label
  || `${tipoDte} · DTE`
);

export const obtenerEtiquetaAmbiente = (ambiente) => (
  AMBIENTES_CORRELATIVO.find((opcion) => opcion.value === String(ambiente))?.label
  || String(ambiente || '—')
);

export const obtenerMensajeErrorApi = (error, mensajePredeterminado) => {
  const respuesta = error?.response?.data;
  if (typeof respuesta === 'string' && respuesta.trim()) return respuesta;
  if (typeof respuesta?.message === 'string' && respuesta.message.trim()) return respuesta.message;
  if (typeof respuesta?.error === 'string' && respuesta.error.trim()) return respuesta.error;

  if (error?.response?.status === 401) return 'La sesión venció. Inicie sesión nuevamente.';
  if (error?.response?.status === 403) return 'No tiene permisos para administrar correlativos.';
  if (error?.response?.status === 404) return 'El correlativo solicitado ya no existe.';
  if (!error?.response && error?.request) return 'No fue posible conectar con la API.';

  return mensajePredeterminado;
};
