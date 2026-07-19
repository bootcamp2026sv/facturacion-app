import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularItemVenta,
  desglosarIvaIncluido,
  obtenerPrecioUnitarioMostrado,
} from '../src/utils/calculosVenta.js';

test('desglosa un dólar con IVA incluido en 0.88 gravado y 0.12 IVA', () => {
  assert.deepEqual(desglosarIvaIncluido(1), {
    gravado: 0.88,
    iva: 0.12,
    total: 1,
  });
});

test('muestra 0.88 como precio unitario sin IVA en crédito fiscal', () => {
  const producto = {
    precio: 0.885,
    precioConIVA: 1,
    tipoIva: 'gravado',
  };

  assert.equal(obtenerPrecioUnitarioMostrado(producto, false), 0.88);
  assert.equal(obtenerPrecioUnitarioMostrado(producto, true), 1);
});

test('mantiene el precio con IVA como referencia al vender varias unidades', () => {
  const calculo = calcularItemVenta({
    precio: 0.885,
    precioConIVA: 1,
    cantidad: 2,
    tipoIva: 'gravado',
    descuentoTipo: 'porcentaje',
    descuentoValor: 0,
  });

  assert.equal(calculo.subtotalDesc, 1.77);
  assert.equal(calculo.iva, 0.23);
  assert.equal(calculo.total, 2);
  assert.equal(calculo.subtotalDesc + calculo.iva, calculo.total);
});

test('cuadra el desglose después de aplicar un descuento', () => {
  const calculo = calcularItemVenta({
    precio: 0.885,
    precioConIVA: 1,
    cantidad: 1,
    tipoIva: 'gravado',
    descuentoTipo: 'porcentaje',
    descuentoValor: 10,
  });

  assert.equal(calculo.subtotalDesc, 0.8);
  assert.equal(calculo.iva, 0.1);
  assert.equal(calculo.total, 0.9);
  assert.equal(calculo.subtotalDesc + calculo.iva, calculo.total);
});

test('calcula el IVA desde el precio base cuando no existe precio con IVA', () => {
  const calculo = calcularItemVenta({
    precio: 1,
    cantidad: 1,
    tipoIva: 'gravado',
    descuentoTipo: 'porcentaje',
    descuentoValor: 0,
  });

  assert.equal(calculo.subtotalDesc, 1);
  assert.equal(calculo.iva, 0.13);
  assert.equal(calculo.total, 1.13);
});

test('no agrega IVA a productos exentos', () => {
  const calculo = calcularItemVenta({
    precio: 0.5,
    cantidad: 2,
    tipoIva: 'exento',
    descuentoTipo: 'porcentaje',
    descuentoValor: 0,
  });

  assert.equal(calculo.subtotalDesc, 1);
  assert.equal(calculo.iva, 0);
  assert.equal(calculo.total, 1);
});
