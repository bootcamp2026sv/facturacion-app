export const PERMISOS_POR_VISTA = Object.freeze({
  inicio: [],
  ventas: ['VENTAS_VER'],
  pos: ['VENTAS_EMITIR', 'VENTAS_EMITIR_AJUSTES'],
  'pos-clasico': ['VENTAS_EMITIR', 'VENTAS_EMITIR_AJUSTES'],
  productos: ['PRODUCTOS_VER'],
  categorias: ['CATEGORIAS_VER'],
  clientes: ['CLIENTES_VER'],
  comercios: ['COMERCIO_VER'],
  geografia: ['CATALOGOS_VER'],
  actividades: ['CATALOGOS_VER'],
  unidades: ['CATALOGOS_VER'],
  'catalogos-exportacion': ['CATALOGOS_VER'],
  control: ['CORRELATIVOS_VER', 'USUARIOS_VER', 'ROLES_VER', 'AUDITORIA_VER'],
});

export const tienePermiso = (usuario, codigo) =>
  Boolean(codigo && usuario?.permisos?.includes(codigo));

export const puedeVerVista = (usuario, vista) => {
  const requeridos = PERMISOS_POR_VISTA[vista];
  if (!requeridos) return false;
  return requeridos.length === 0 || requeridos.some((codigo) => tienePermiso(usuario, codigo));
};

export const filtrarMenuPorPermisos = (elementos, usuario) =>
  elementos.filter((elemento) => puedeVerVista(usuario, elemento.id));

export const primeraVistaAutorizada = (elementos, usuario) =>
  filtrarMenuPorPermisos(elementos, usuario)[0]?.id || 'inicio';

export const normalizarSesion = (datos) => ({
  id: datos?.id,
  nombreUsuario: datos?.nombreUsuario || datos?.username || '',
  correo: datos?.correo || datos?.email || '',
  habilitado: datos?.habilitado !== false,
  rol: datos?.rol || null,
  permisos: Array.isArray(datos?.permisos) ? datos.permisos : [],
});

export const clasificarErrorAutorizacion = (status) => {
  if (status === 401) return 'RENOVAR_SESION';
  if (status === 403) return 'MOSTRAR_SIN_PERMISO';
  return 'PROPAGAR_ERROR';
};
