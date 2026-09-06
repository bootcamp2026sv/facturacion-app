import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ajustesDesdeFilas,
  erroresLocalesReporte,
  extraerNombreArchivo,
  filasParaEnvio,
  rangoMensual,
} from '../src/utils/reportesFacturacion.js';

test('expresa el mes como rango semiabierto y cruza diciembre correctamente', () => {
  assert.equal(rangoMensual(2024, 2), '[01/02/2024 00:00, 01/03/2024 00:00)');
  assert.equal(rangoMensual(2025, 12), '[01/12/2025 00:00, 01/01/2026 00:00)');
});

test('lee nombres Content-Disposition normales y UTF-8', () => {
  assert.equal(extraerNombreArchivo('attachment; filename="reporte.xlsx"'), 'reporte.xlsx');
  assert.equal(extraerNombreArchivo("attachment; filename*=UTF-8''anexo%20enero.csv"), 'anexo enero.csv');
});

test('crea ajustes efímeros y normaliza las filas editadas para el API', () => {
  const filas = [{ id: 7, cliente: 'ACME', fechaAnulacion: '2025-01-10', total: 10.5 }];
  assert.equal(ajustesDesdeFilas(filas)[0].ventaId, 7);
  assert.equal(ajustesDesdeFilas(filas)[0].cliente, 'ACME');
  assert.equal('vendedor' in ajustesDesdeFilas(filas)[0], false);
  assert.equal('usuario' in ajustesDesdeFilas(filas)[0], false);
  assert.deepEqual(filasParaEnvio(filas), [{ id: '7', cliente: 'ACME', fechaAnulacion: '2025-01-10', total: '10.5' }]);
});

test('el Excel general no exige usuario ni vendedor y conserva las demás validaciones', () => {
  const errores = erroresLocalesReporte('excel-general', [{
    id: 1, estado: 'ANULADO', cliente: 'Cliente', usuario: '', vendedor: '', fechaAnulacion: '',
  }]);
  assert.deepEqual(errores, ['Fila 1: falta fecha de anulación.']);
  assert.deepEqual(erroresLocalesReporte('excel-general', [{
    id: 1, estado: 'ANULADO', cliente: 'Cliente', usuario: '', vendedor: '', fechaAnulacion: '2025-01-10',
  }]), []);
});
