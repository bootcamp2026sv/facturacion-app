import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerErrorFormatoCliente, soloDigitos } from '../src/utils/validacionesCliente.js';

test('elimina guiones y caracteres no numéricos', () => {
  assert.equal(soloDigitos('0614-200595-101-5'), '06142005951015');
  assert.equal(soloDigitos('+503 2222-3333'), '50322223333');
});

test('acepta documentos de 9 o 14 dígitos', () => {
  assert.equal(obtenerErrorFormatoCliente({ numDocumento: '012345678', nrc: '', telefono: '22223333' }), '');
  assert.equal(obtenerErrorFormatoCliente({ numDocumento: '06142005951015', nrc: '1234567', telefono: '22223333' }), '');
});

test('rechaza documentos con una longitud diferente', () => {
  assert.match(
    obtenerErrorFormatoCliente({ numDocumento: '12345678', nrc: '', telefono: '22223333' }),
    /9 o 14 dígitos/
  );
});

test('rechaza NRC con guiones y teléfonos con menos de 8 dígitos', () => {
  assert.match(
    obtenerErrorFormatoCliente({ numDocumento: '012345678', nrc: '123456-7', telefono: '22223333' }),
    /NRC/
  );
  assert.match(
    obtenerErrorFormatoCliente({ numDocumento: '012345678', nrc: '1234567', telefono: '2222333' }),
    /al menos 8 dígitos/
  );
});
