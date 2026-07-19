export const soloDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

export function obtenerErrorFormatoCliente(cliente) {
  const numeroDocumento = String(cliente.numDocumento ?? '').trim();
  const nrc = String(cliente.nrc ?? '').trim();
  const telefono = String(cliente.telefono ?? '').trim();

  if (!/^(?:\d{9}|\d{14})$/.test(numeroDocumento)) {
    return 'El número de documento debe contener exactamente 9 o 14 dígitos, sin guiones.';
  }

  if (nrc && !/^\d+$/.test(nrc)) {
    return 'El NRC debe contener únicamente números, sin guiones.';
  }

  if (!/^\d{8,}$/.test(telefono)) {
    return 'El teléfono debe contener únicamente números y tener al menos 8 dígitos.';
  }

  return '';
}
