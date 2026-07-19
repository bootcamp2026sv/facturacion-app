import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerCamposFaltantesCreditoFiscal } from '../src/utils/validacionesVenta.js';

const clienteCompleto = {
  nombre: 'Empresa de Prueba, S.A. de C.V.',
  numDocumento: '06141234567890',
  telefono: '2222-2222',
  nrc: '123456-7',
  correo: 'ventas@empresa.test',
  actividadEconomica: { id: 1, codActividad: '62010' },
  distritoId: 1,
  direccion: {
    complemento: 'Calle principal, local 1',
    distrito: 'San Salvador',
  },
};

test('permite crédito fiscal cuando el cliente tiene todos los datos', () => {
  assert.deepEqual(obtenerCamposFaltantesCreditoFiscal(clienteCompleto), []);
});

test('identifica cada dato obligatorio faltante para crédito fiscal', () => {
  const incompleto = {
    ...clienteCompleto,
    telefono: '',
    correo: '   ',
    actividadEconomica: null,
  };

  assert.deepEqual(obtenerCamposFaltantesCreditoFiscal(incompleto), [
    'teléfono',
    'actividad económica',
    'correo',
  ]);
});

test('el distrito relacionado cubre municipio y departamento', () => {
  const clienteConDistritoRelacionado = {
    ...clienteCompleto,
    direccion: {
      complemento: clienteCompleto.direccion.complemento,
      distrito: '',
    },
  };

  assert.deepEqual(obtenerCamposFaltantesCreditoFiscal(clienteConDistritoRelacionado), []);
});

test('requiere seleccionar un cliente', () => {
  assert.deepEqual(obtenerCamposFaltantesCreditoFiscal(null), ['cliente']);
});
