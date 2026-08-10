import {
  ICONO_CATEGORIA,
  TRIBUTACION_A_IVA,
} from './constantesPuntoVenta.js';

// La API y la pantalla no usan exactamente los mismos nombres.
// Estos mapeadores dejan un formato único para el resto del POS.
export const mapearProductoApi = (producto) => {
  const categoria = producto.categoria?.nombre || 'Sin categoria';
  const categoriaKey = categoria.toLowerCase();
  const tipoIva = TRIBUTACION_A_IVA[producto.tipoTributacion] || 'gravado';

  return {
    id: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    precio: Number(producto.precioSinIVA || 0),
    precioConIVA: Number(producto.precioConIVA || producto.precioSinIVA || 0),
    categoria,
    icono: ICONO_CATEGORIA[categoriaKey] || 'pi pi-box',
    imagen: producto.imagen || producto.imagenUrl || producto.urlImagen || producto.foto || producto.image || null,
    tipoIva,
    existencia: Number(producto.existencia || 0),
    lineaLibre: !!producto.productoPersonalizable,
  };
};

// También reúne dirección y actividad económica para que los diálogos
// y el ticket no tengan que conocer la forma original de la respuesta.
export const mapearClienteApi = (cliente) => {
  const actividadEconomica = cliente.actividadEconomica || cliente.ActividadEconomica || null;
  const distrito = cliente.distrito || cliente.Distrito || null;
  const municipio = distrito?.municipio || distrito?.Municipio || null;
  const departamento = municipio?.departamento || municipio?.Departamento || null;

  return {
    label: `${cliente.nombre || ''}${cliente.apellidos ? ` ${cliente.apellidos}` : ''}`.trim() || cliente.nombreComercial || 'Cliente',
    value: cliente.id,
    nombre: cliente.nombre || '',
    apellidos: cliente.apellidos || '',
    nit: cliente.numDocumento || cliente.nit || cliente.nrc || 'S/N',
    tipoDocumento: cliente.tipoDocumento,
    numDocumento: cliente.numDocumento || cliente.nit || '',
    nrc: cliente.nrc || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo || '',
    nombreComercial: cliente.nombreComercial || '',
    actividadEconomica,
    distritoId: distrito?.id || cliente.distrito_id || cliente.distritoId || null,
    direccion: {
      departamento: distrito?.departamentoNombre || departamento?.Nombre || departamento?.nombre || '',
      municipio: distrito?.municipioNombre || municipio?.Nombre || municipio?.nombre || '',
      distrito: distrito?.Nombre || distrito?.nombre || '',
      complemento: cliente.complementoDireccion || cliente.ComplementoDireccion || '',
    },
    granContribuyente: !!cliente.granContribuyente,
  };
};
