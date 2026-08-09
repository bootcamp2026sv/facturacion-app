import api from './api';

export const usuariosService = {
  listar: async () => (await api.get('/usuarios')).data,
  crear: async (datos) => (await api.post('/usuarios', datos)).data,
  editar: async (id, datos) => (await api.patch(`/usuarios/${id}`, datos)).data,
  cambiarEstado: async (id, habilitado) =>
    (await api.patch(`/usuarios/${id}/estado`, { habilitado })).data,
  restablecerContrasena: async (id, nuevaContrasena) =>
    (await api.patch(`/usuarios/${id}/password`, { nuevaContrasena })).data,
};

export const rolesService = {
  listar: async () => (await api.get('/roles')).data,
  crear: async (datos) => (await api.post('/roles', datos)).data,
  editar: async (id, datos) => (await api.patch(`/roles/${id}`, datos)).data,
  eliminar: async (id) => api.delete(`/roles/${id}`),
  permisos: async () => (await api.get('/permisos')).data,
};

export const auditoriaService = {
  listar: async ({ page = 0, size = 20, tipo = '', actor = '' } = {}) =>
    (await api.get('/auditoria-seguridad', { params: { page, size, tipo, actor, sort: 'creadoEn,desc' } })).data,
};
