import test from 'node:test';
import assert from 'node:assert/strict';

import { obtenerDominioCorreo, obtenerValoresCorreoPorDefecto } from '../src/utils/configuracionCorreo.js';

test('obtiene el dominio de un correo', () => {
  assert.equal(obtenerDominioCorreo('ventas@ejemplo.com'), 'ejemplo.com');
  assert.equal(obtenerDominioCorreo('correo-invalido'), '');
});

test('aplica valores recomendados para Gmail', () => {
  assert.deepEqual(obtenerValoresCorreoPorDefecto('GMAIL', 'ventas@ejemplo.com'), {
    proveedorCorreo: 'GMAIL',
    servidorSmtp: 'smtp.gmail.com',
    puertoSmtp: 587,
    seguridadSmtp: 'STARTTLS'
  });
});

test('aplica valores recomendados para cPanel y Plesk', () => {
  assert.deepEqual(obtenerValoresCorreoPorDefecto('CPANEL', 'ventas@ejemplo.com'), {
    proveedorCorreo: 'CPANEL',
    servidorSmtp: 'mail.ejemplo.com',
    puertoSmtp: 465,
    seguridadSmtp: 'SSL'
  });
  assert.deepEqual(obtenerValoresCorreoPorDefecto('PLESK', 'ventas@ejemplo.com'), {
    proveedorCorreo: 'PLESK',
    servidorSmtp: 'mail.ejemplo.com',
    puertoSmtp: 465,
    seguridadSmtp: 'SSL'
  });
});
