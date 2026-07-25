import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularResumenNota,
  construirPayloadNota,
  detectarTributacionNota,
  normalizarDetallesNota,
  validarLineaNota,
  validarNota,
} from '../src/components/views/ventas/reglasNotasVenta.js';

const detalleGravado = {
  id: 10,
  numItem: 1,
  tipoItem: 'BIEN',
  cantidad: '2.0000',
  codigo: 'PROD-01',
  descripcion: 'Producto gravado',
  precioUni: '100.0000',
  montoDescu: '0.0000',
  ventaNoSuj: '0.0000',
  ventaExenta: '0.0000',
  ventaGravada: '200.0000',
  psv: '100.0000',
  noGravado: '0.0000',
  ivaItem: '26.0000',
};

const ventaOrigen = {
  id: 7,
  version: 1,
  ambiente: '00',
  tipoDte: '03',
  numeroControl: 'DTE-03-M001P001-000000000000007',
  codigoGeneracion: 'CCB8FBEB-553B-4F66-BDA1-44F7EE45ADCE',
  tipoModelo: 1,
  tipoOperacion: 1,
  tipoMoneda: 'USD',
  totalGeneral: '226.0000',
  metodoPago: 'credito',
  plazoValor: 30,
  plazoTipo: 'dias',
  condicionOperacion: 2,
  cliente: { id: 3, granContribuyente: true },
  comercio: { id: 1 },
};

const lineaSeleccionada = (cambios = {}) => ({
  ...normalizarDetallesNota([detalleGravado])[0],
  seleccionada: true,
  cantidadNota: 1,
  precioNota: 100,
  ...cambios,
});

test('normaliza los detalles reales y detecta su tributación', () => {
  const detalles = [
    detalleGravado,
    { ...detalleGravado, id: 11, ventaGravada: 0, ivaItem: 0, ventaExenta: 25 },
    { ...detalleGravado, id: 12, ventaGravada: 0, ivaItem: 0, ventaNoSuj: 25 },
    { ...detalleGravado, id: 13, ventaGravada: 0, ivaItem: 0, noGravado: 25 },
  ];
  const lineas = normalizarDetallesNota(detalles);

  assert.equal(lineas[0].cantidadOriginal, 2);
  assert.equal(lineas[0].precioOriginal, 100);
  assert.equal(lineas[0].cantidadNota, 2);
  assert.equal(lineas[0].precioNota, 100);
  assert.deepEqual(lineas.map((linea) => linea.tributacion), [
    'gravado',
    'exento',
    'noSujeto',
    'noGravado',
  ]);
  assert.equal(detectarTributacionNota({ ventaGravada: 0, ivaItem: 0 }), null);
});

test('valida selección, valores positivos y máximo de cantidad para DTE 05', () => {
  const linea = lineaSeleccionada({ cantidadNota: 3 });

  assert.match(validarLineaNota(linea, '05')[0], /no puede superar/i);
  assert.equal(validarLineaNota(linea, '06').length, 0);
  assert.match(validarLineaNota({ ...linea, cantidadNota: 0 }, '06')[0], /mayor que cero/i);
  assert.equal(validarNota([{ ...linea, seleccionada: false }], '05').esValida, false);
  assert.equal(validarNota([lineaSeleccionada()], '05').esValida, true);
});

test('no retiene a un receptor que no es gran contribuyente', () => {
  const resumen = calcularResumenNota({
    lineas: [lineaSeleccionada()],
    esGranContribuyente: false,
  });

  assert.equal(resumen.porTipo.gravado, 100);
  assert.equal(resumen.ivaTotal, 13);
  assert.equal(resumen.retencion, 0);
  assert.equal(resumen.totalPagar, 113);
});

test('conserva el desglose original de un precio final de un dolar', () => {
  const detalleUnDolar = {
    ...detalleGravado,
    cantidad: '1.0000',
    precioUni: '0.8800',
    ventaGravada: '0.8800',
    ivaItem: '0.1200',
  };
  const linea = {
    ...normalizarDetallesNota([detalleUnDolar])[0],
    seleccionada: true,
  };
  const resumen = calcularResumenNota({
    lineas: [linea],
    esGranContribuyente: false,
  });

  assert.equal(resumen.porTipo.gravado, 0.88);
  assert.equal(resumen.ivaTotal, 0.12);
  assert.equal(resumen.totalPagar, 1);
});

test('no retiene cuando el gravado del gran contribuyente es menor a cien', () => {
  const resumen = calcularResumenNota({
    lineas: [lineaSeleccionada({ precioNota: 99 })],
    esGranContribuyente: true,
  });

  assert.equal(resumen.porTipo.gravado, 99);
  assert.equal(resumen.retencion, 0);
  assert.equal(resumen.totalPagar, 111.87);
});

test('retiene uno por ciento al alcanzar exactamente cien de gravado', () => {
  const resumen = calcularResumenNota({
    lineas: [lineaSeleccionada()],
    esGranContribuyente: true,
  });

  assert.equal(resumen.aplicaRetencion, true);
  assert.equal(resumen.retencion, 1);
  assert.equal(resumen.totalPagar, 112);
});

test('la retención usa solo el gravado aunque existan líneas exentas', () => {
  const exenta = {
    ...lineaSeleccionada({
      key: 'exenta',
      precioNota: 50,
      tributacion: 'exento',
      detalleOriginal: {
        ...detalleGravado,
        id: 20,
        codigo: 'EX-01',
        descripcion: 'Producto exento',
        ventaGravada: 0,
        ivaItem: 0,
        ventaExenta: 100,
      },
    }),
  };
  const resumen = calcularResumenNota({
    lineas: [lineaSeleccionada(), exenta],
    esGranContribuyente: true,
  });

  assert.equal(resumen.porTipo.gravado, 100);
  assert.equal(resumen.porTipo.exento, 50);
  assert.equal(resumen.ivaTotal, 13);
  assert.equal(resumen.retencion, 1);
  assert.equal(resumen.totalPagar, 162);
});

test('construye una venta para POST y descuenta la retención en total y monto de pago', () => {
  const payload = construirPayloadNota({
    ventaOrigen,
    lineas: [lineaSeleccionada()],
    tipoDte: '05',
  });

  assert.equal(payload.tipoDte, '05');
  assert.equal(payload.version, 4);
  assert.equal(payload.totalGeneral, '112.0000');
  assert.equal(payload.montoPago, '112.0000');
  assert.equal(payload.totalGravado, '100.0000');
  assert.equal(payload.totalIva, '13.0000');
  assert.equal(payload.cliente.id, 3);
  assert.equal(payload.comercio.id, 1);
  assert.equal(payload.detallesVenta.length, 1);
  assert.equal(payload.detallesVenta[0].numItem, 1);
  assert.equal(payload.detallesVenta[0].cantidad, '1.0000');
  assert.equal(payload.detallesVenta[0].precioUni, '100.0000');
  assert.equal(payload.detallesVenta[0].numeroDocumento, ventaOrigen.codigoGeneracion);
  assert.equal(Object.hasOwn(payload, 'id'), false);
  assert.equal(Object.hasOwn(payload, 'numeroControl'), false);
  assert.equal(Object.hasOwn(payload, 'codigoGeneracion'), false);
  assert.equal(Object.hasOwn(payload, 'fecha'), false);
});

test('excluye líneas desmarcadas y renumera las seleccionadas', () => {
  const omitida = lineaSeleccionada({
    key: 'omitida',
    seleccionada: false,
    detalleOriginal: { ...detalleGravado, id: 30, codigo: 'OMITIDA' },
  });
  const segunda = lineaSeleccionada({
    key: 'segunda',
    detalleOriginal: { ...detalleGravado, id: 31, codigo: 'SEGUNDA' },
  });
  const tercera = lineaSeleccionada({
    key: 'tercera',
    detalleOriginal: { ...detalleGravado, id: 32, codigo: 'TERCERA' },
  });
  const payload = construirPayloadNota({
    ventaOrigen,
    lineas: [omitida, segunda, tercera],
    tipoDte: '06',
  });

  assert.deepEqual(payload.detallesVenta.map((detalle) => detalle.codigo), ['SEGUNDA', 'TERCERA']);
  assert.deepEqual(payload.detallesVenta.map((detalle) => detalle.numItem), [1, 2]);
});

test('los payloads DTE 05 y 06 solamente cambian en tipoDte', () => {
  const lineas = [lineaSeleccionada()];
  const credito = construirPayloadNota({ ventaOrigen, lineas, tipoDte: '05' });
  const debito = construirPayloadNota({ ventaOrigen, lineas, tipoDte: '06' });
  const { tipoDte: tipoCredito, ...creditoComun } = credito;
  const { tipoDte: tipoDebito, ...debitoComun } = debito;

  assert.equal(tipoCredito, '05');
  assert.equal(tipoDebito, '06');
  assert.deepEqual(creditoComun, debitoComun);
});
