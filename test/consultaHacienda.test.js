import test from 'node:test';
import assert from 'node:assert/strict';
import {
  construirUrlConsultaHacienda,
  obtenerFechaEmisionHacienda,
} from '../src/utils/consultaHacienda.js';

test('construye la misma URL de consulta publica usada por el PDF', () => {
  const url = construirUrlConsultaHacienda({
    ambiente: '01',
    codigoGeneracion: '8511884C-8EB5-4BE7-AB91-612F575B433C',
    fecha: '2026-08-16T10:30:00',
  });

  assert.equal(
    url,
    'https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=8511884C-8EB5-4BE7-AB91-612F575B433C&fechaEmi=2026-08-16',
  );
});

test('usa ambiente de pruebas por defecto y conserva la fecha local', () => {
  assert.equal(obtenerFechaEmisionHacienda(new Date(2026, 7, 16, 23, 59)), '2026-08-16');
  assert.equal(
    construirUrlConsultaHacienda({ codigoGeneracion: 'ABC', fecha: '2026-08-16' }),
    'https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=ABC&fechaEmi=2026-08-16',
  );
});

test('no genera enlace cuando faltan codigo o fecha', () => {
  assert.equal(construirUrlConsultaHacienda({ fecha: '2026-08-16' }), null);
  assert.equal(construirUrlConsultaHacienda({ codigoGeneracion: 'ABC' }), null);
});
