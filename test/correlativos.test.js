import test from 'node:test';
import assert from 'node:assert/strict';

import {
  construirSolicitudCorrelativo,
  convertirCorrelativoAFormulario,
  crearFormularioCorrelativoInicial,
  formatearCorrelativoDte,
  obtenerMensajeErrorApi,
  validarFormularioCorrelativo
} from '../src/utils/correlativos.js';

test('crea un formulario nuevo con valores seguros', () => {
  assert.deepEqual(crearFormularioCorrelativoInicial(2026), {
    id: null,
    tipoDte: '01',
    ambiente: '00',
    anio: 2026,
    codEstable: 'M001',
    codPuntoVenta: 'P001',
    ultimoValor: 0
  });
});

test('normaliza el payload para registrar una serie', () => {
  assert.deepEqual(construirSolicitudCorrelativo({
    tipoDte: '03',
    ambiente: '01',
    anio: '2026',
    codEstable: ' m001 ',
    codPuntoVenta: ' p001 ',
    ultimoValor: '254'
  }), {
    tipoDte: '03',
    ambiente: '01',
    anio: 2026,
    codEstable: 'M001',
    codPuntoVenta: 'P001',
    ultimoValor: 254
  });
});

test('valida todos los campos al crear y solo el último valor al editar', () => {
  const formularioInvalido = {
    tipoDte: '', ambiente: '02', anio: 1999,
    codEstable: 'M01', codPuntoVenta: 'P-01', ultimoValor: -1
  };

  assert.deepEqual(Object.keys(validarFormularioCorrelativo(formularioInvalido)).sort(), [
    'ambiente', 'anio', 'codEstable', 'codPuntoVenta', 'tipoDte', 'ultimoValor'
  ]);
  assert.deepEqual(validarFormularioCorrelativo({ ...formularioInvalido, ultimoValor: 10 }, true), {});
});

test('convierte la respuesta de detalle y conserva el correlativo como número', () => {
  assert.deepEqual(convertirCorrelativoAFormulario({
    id: 7,
    tipoDte: '01',
    ambiente: '00',
    anio: 2026,
    codEstable: 'm001',
    codPuntoVenta: 'p001',
    ultimoValor: 1000
  }), {
    id: 7,
    tipoDte: '01',
    ambiente: '00',
    anio: 2026,
    codEstable: 'M001',
    codPuntoVenta: 'P001',
    ultimoValor: 1000
  });
});

test('formatea el último valor con los 15 dígitos del número de control', () => {
  assert.equal(formatearCorrelativoDte(254), '000000000000254');
  assert.equal(formatearCorrelativoDte(null), '—');
});

test('prioriza los mensajes enviados por la API', () => {
  assert.equal(
    obtenerMensajeErrorApi({ response: { status: 400, data: { message: 'La serie ya existe' } } }, 'Error'),
    'La serie ya existe'
  );
  assert.equal(
    obtenerMensajeErrorApi({ response: { status: 403, data: {} } }, 'Error'),
    'No tiene permisos para administrar correlativos.'
  );
});
