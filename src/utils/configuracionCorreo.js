export const obtenerDominioCorreo = (correo) => {
  if (!correo || !correo.includes('@')) return '';
  return correo.substring(correo.indexOf('@') + 1).trim();
};

export const obtenerValoresCorreoPorDefecto = (proveedor, correoRemitente = '') => {
  const dominio = obtenerDominioCorreo(correoRemitente);
  const valores = { proveedorCorreo: proveedor };

  if (proveedor === 'GMAIL') {
    valores.servidorSmtp = 'smtp.gmail.com';
    valores.puertoSmtp = 587;
    valores.seguridadSmtp = 'STARTTLS';
  } else if (proveedor === 'CPANEL' || proveedor === 'PLESK') {
    valores.servidorSmtp = dominio ? `mail.${dominio}` : '';
    valores.puertoSmtp = 465;
    valores.seguridadSmtp = 'SSL';
  }

  return valores;
};
