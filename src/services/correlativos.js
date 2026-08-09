import api from './api';

export const listarCorrelativos = async () => {
  const respuesta = await api.get('/correlativos');
  return Array.isArray(respuesta.data) ? respuesta.data : [];
};

export const obtenerCorrelativo = async (id) => {
  const respuesta = await api.get(`/correlativos/${id}`);
  return respuesta.data;
};

export const registrarCorrelativo = async (solicitud) => {
  const respuesta = await api.post('/correlativos', solicitud);
  return respuesta.data;
};

export const actualizarUltimoCorrelativo = async (id, ultimoValor) => {
  const respuesta = await api.patch(`/correlativos/${id}`, { ultimoValor });
  return respuesta.data;
};
