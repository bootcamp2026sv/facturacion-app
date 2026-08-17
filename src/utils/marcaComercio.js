const MARCA_COMERCIO_STORAGE_KEY = 'marcaComercio';
export const MARCA_COMERCIO_EVENT = 'marcaComercioActualizada';
const NOMBRE_SISTEMA_OMITIDO = 'BOOTCAMP 2026';

const leerTexto = (...valores) => valores.find((valor) => typeof valor === 'string' && valor.trim())?.trim() || '';
const limpiarNombreVisible = (nombre) => nombre.toLocaleUpperCase('es-ES') === NOMBRE_SISTEMA_OMITIDO ? '' : nombre;
const notificarCambio = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(MARCA_COMERCIO_EVENT));
};

export const obtenerMarcaComercio = () => {
  try {
    const guardado = localStorage.getItem(MARCA_COMERCIO_STORAGE_KEY);
    if (!guardado) return null;

    const marca = JSON.parse(guardado);
    if (!marca || typeof marca !== 'object') return null;

    return {
      nombre: limpiarNombreVisible(leerTexto(marca.nombreComercial, marca.nombre)),
      nombreLegal: limpiarNombreVisible(leerTexto(marca.nombre)),
      logoUrl: typeof marca.logoUrl === 'string' && marca.logoUrl.trim() ? marca.logoUrl : null,
    };
  } catch {
    return null;
  }
};

export const guardarMarcaComercio = (comercio) => {
  if (!comercio || typeof comercio !== 'object') {
    try {
      localStorage.removeItem(MARCA_COMERCIO_STORAGE_KEY);
      notificarCambio();
    } catch {
      // El navegador puede bloquear el acceso al almacenamiento.
    }
    return;
  }

  const marca = {
    nombreComercial: limpiarNombreVisible(leerTexto(comercio.nombreComercial, comercio.NombreComercial)),
    nombre: limpiarNombreVisible(leerTexto(comercio.nombre, comercio.Nombre)),
    logoUrl: typeof comercio.logoUrl === 'string' && comercio.logoUrl.trim() ? comercio.logoUrl : null,
  };

  try {
    localStorage.setItem(MARCA_COMERCIO_STORAGE_KEY, JSON.stringify(marca));
    notificarCambio();
  } catch {
    // El flujo de acceso continúa aunque el navegador bloquee localStorage.
  }
};
