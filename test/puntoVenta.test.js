import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularResumenVenta,
  construirDetallesVenta,
  construirPayloadVenta,
  crearDatosTicketVenta,
  formatoFechaTicket,
  normalizarFechaTicket,
  interpretarErrorHacienda,
  normalizarPlazo,
  parsearMontoPago,
} from '../src/components/views/puntoVenta/reglasPuntoVenta.js';

const productoGravado = {
  id: 10,
  codigo: 'P-10',
  nombre: 'Producto gravado',
  precio: 100,
  precioConIVA: 113,
  cantidad: 1,
  tipoIva: 'gravado',
  descuentoTipo: 'porcentaje',
  descuentoValor: 0,
  _key: 1,
};

const datosExportacionCompletos = {
  codPais: 'US',
  tipoPersona: 1,
  tipoItemExpor: 1,
  recintoFiscal: '01',
  tipoRegimen: '01',
  regimen: '01',
  codIncoterms: 'FOB',
  complemento: 'Dirección internacional',
  flete: 5,
  seguro: 2,
};

test('calcula IVA y retención del gran contribuyente para una factura', () => {
  const resumen = calcularResumenVenta({
    carrito: [productoGravado],
    tipoDte: '01',
    documentoSinIva: false,
    esGranContribuyente: true,
    retenerRenta: false,
    datosExportacion: { flete: 0, seguro: 0 },
  });

  assert.equal(resumen.porTipo.gravado, 100);
  assert.equal(resumen.ivaTotal, 13);
  assert.equal(resumen.retencion, 1);
  assert.equal(resumen.totalCobrar, 112);
});

test('calcula flete y seguro como cargos de exportación sin IVA', () => {
  const resumen = calcularResumenVenta({
    carrito: [productoGravado],
    tipoDte: '11',
    documentoSinIva: true,
    esGranContribuyente: true,
    retenerRenta: false,
    datosExportacion: datosExportacionCompletos,
  });

  assert.equal(resumen.ivaTotal, 0);
  assert.equal(resumen.flete, 5);
  assert.equal(resumen.seguro, 2);
  assert.equal(resumen.totalCobrar, 120);
  assert.equal(resumen.retencion, 0);
});

test('aplica retención de renta únicamente para sujeto excluido', () => {
  const resumen = calcularResumenVenta({
    carrito: [productoGravado],
    tipoDte: '14',
    documentoSinIva: true,
    esGranContribuyente: false,
    retenerRenta: true,
    datosExportacion: { flete: 0, seguro: 0 },
  });

  assert.equal(resumen.reteRenta, 11.3);
  assert.equal(resumen.totalCobrar, 101.7);
});

test('construye los detalles de crédito fiscal con montos de cuatro decimales', () => {
  const detalles = construirDetallesVenta({ carrito: [{ ...productoGravado, cantidad: 2 }], tipoDte: '03' });

  assert.deepEqual(detalles[0], {
    numItem: 1,
    tipoItem: 'BIEN',
    cantidad: '2.0000',
    codigo: 'P-10',
    descripcion: 'Producto gravado',
    precioUni: '100.0000',
    montoDescu: '0.0000',
    ventaNoSuj: '0.0000',
    ventaExenta: '0.0000',
    ventaGravada: '200.0000',
    psv: '100.0000',
    noGravado: '0.0000',
    ivaItem: '26.0000',
    producto: { id: 10 },
  });
});

test('construye el payload conservando campos de API y condiciones de pago', () => {
  const carrito = [{ ...productoGravado, cantidad: 2 }];
  const resumen = calcularResumenVenta({
    carrito,
    tipoDte: '03',
    documentoSinIva: false,
    esGranContribuyente: false,
    retenerRenta: false,
    datosExportacion: { flete: 0, seguro: 0 },
  });
  const payload = construirPayloadVenta({
    carrito,
    tipoDte: '03',
    resumen,
    metodoPago: 'credito',
    referenciaPago: 'REF-1',
    cambio: null,
    efectivoRecibido: null,
    plazoValor: 2,
    plazoTipo: 'años',
    clienteSeleccionado: { value: 7, direccion: {}, actividadEconomica: null },
    comercio: { id: 4 },
    datosExportacion: datosExportacionCompletos,
    datosReceptor: { nombre: '', correo: '' },
  });

  assert.equal(payload.tipoDte, '03');
  assert.equal(payload.totalGeneral, '226.0000');
  assert.equal(payload.metodoPago, 'credito');
  assert.equal(payload.plazoTipo, 'anios');
  assert.equal(payload.condicionOperacion, 2);
  assert.equal(payload.datosExportacion, null);
  assert.equal(payload.cliente.id, 7);
  assert.equal(payload.comercio.id, 4);
  assert.equal(payload.detallesVenta.length, 1);
});

test('interpreta respuestas JSON de Hacienda y conserva texto plano', () => {
  const respuesta = interpretarErrorHacienda('Error: {"estado":"RECHAZADO","codigoMsg":"E01","observaciones":["Dato inválido"]}');
  assert.equal(respuesta.esRespuestaHacienda, true);
  assert.equal(respuesta.titulo, 'Documento rechazado por Hacienda');
  assert.deepEqual(respuesta.observaciones, ['Dato inválido']);

  const texto = interpretarErrorHacienda('No hay conexión');
  assert.equal(texto.esRespuestaHacienda, false);
  assert.equal(texto.descripcion, 'No hay conexión');
});

test('normaliza plazos y montos de pago', () => {
  assert.equal(normalizarPlazo('días'), 'dias');
  assert.equal(normalizarPlazo('años'), 'anios');
  assert.equal(normalizarPlazo('meses'), 'meses');
  assert.equal(parsearMontoPago('$12,50'), 12.5);
  assert.equal(parsearMontoPago(''), null);
});

test('formatea fechas del API sin derribar el ticket', () => {
  assert.equal(normalizarFechaTicket('2026-08-16T10:30:00')?.getFullYear(), 2026);
  assert.equal(normalizarFechaTicket([2026, 8, 16, 10, 30])?.getMonth(), 7);
  assert.match(formatoFechaTicket('2026-08-16T10:30:00'), /16/);
  assert.equal(formatoFechaTicket('fecha-invalida'), 'Fecha no disponible');
  assert.equal(formatoFechaTicket(null), 'Fecha no disponible');
});

test('crea el modelo del ticket con venta, receptor y forma de pago', () => {
  const ticket = crearDatosTicketVenta({
    ventaGuardada: {
      id: 9,
      numeroControl: 'DTE-9',
      codigoGeneracion: '8511884C-8EB5-4BE7-AB91-612F575B433C',
      ambiente: '01',
      fecha: '2026-08-16T10:30:00',
      selloRecepcion: 'SELLO',
    },
    cambio: 3,
    carrito: [productoGravado],
    tipoDte: '01',
    metodoPago: 'efectivo',
    referenciaPago: '',
    efectivoRecibido: 103,
    plazoValor: 1,
    plazoTipo: 'meses',
    clienteSeleccionado: { label: 'Cliente Final', correo: '' },
    comercio: { id: 4, nombre: 'Comercio' },
    resumen: { total: 113, porTipo: { gravado: 100 }, totalCobrar: 100, descuentoTotal: 0, ivaTotal: 13, retencion: 0, reteRenta: 0, flete: 0, seguro: 0 },
    datosReceptor: { nombre: 'Ana', correo: 'ana@correo.test' },
  });

  assert.equal(ticket.id, 9);
  assert.equal(ticket.ambiente, '01');
  assert.equal(ticket.fecha, '2026-08-16T10:30:00');
  assert.equal(ticket.cliente.label, 'Ana');
  assert.equal(ticket.efectivoRecibido, 103);
  assert.equal(ticket.cambio, 3);
  assert.equal(ticket.items[0].nombre, 'Producto gravado');
});
