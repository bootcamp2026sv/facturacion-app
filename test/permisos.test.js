import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clasificarErrorAutorizacion,
  filtrarMenuPorPermisos,
  normalizarSesion,
  puedeVerVista,
  tienePermiso,
} from '../src/utils/permisos.js';

const menu = [
  { id: 'inicio' },
  { id: 'ventas' },
  { id: 'productos' },
  { id: 'control' },
];

test('filtra módulos y conserva inicio según los permisos funcionales', () => {
  const usuario = { permisos: ['VENTAS_VER', 'CORRELATIVOS_VER'] };
  assert.deepEqual(filtrarMenuPorPermisos(menu, usuario).map((item) => item.id), ['inicio', 'ventas', 'control']);
  assert.equal(puedeVerVista(usuario, 'productos'), false);
  assert.equal(tienePermiso(usuario, 'VENTAS_VER'), true);
});

test('normaliza rol único y permisos sin mezclar ROLE_ADMIN', () => {
  const usuario = normalizarSesion({
    id: 1,
    nombreUsuario: 'ana',
    rol: { id: 4, nombre: 'CONTADOR' },
    permisos: ['VENTAS_VER'],
  });
  assert.equal(usuario.rol.nombre, 'CONTADOR');
  assert.deepEqual(usuario.permisos, ['VENTAS_VER']);
});

test('diferencia 401 de 403 para no cerrar sesión por falta de permiso', () => {
  assert.equal(clasificarErrorAutorizacion(401), 'RENOVAR_SESION');
  assert.equal(clasificarErrorAutorizacion(403), 'MOSTRAR_SIN_PERMISO');
  assert.equal(clasificarErrorAutorizacion(500), 'PROPAGAR_ERROR');
});
