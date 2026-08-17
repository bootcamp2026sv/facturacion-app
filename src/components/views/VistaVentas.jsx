import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import api from '../../services/api';
import DialogoNotaVenta from './ventas/DialogoNotaVenta';
import { useAuth } from '../../context/AuthContext';
import {
  construirPayloadNota,
  normalizarDetallesNota,
  validarNota,
} from './ventas/reglasNotasVenta';

const etiquetaTipoDte = (tipoDte) => ({
  '01': '01 CF',
  '03': '03 CCF',
  '05': '05 NC',
  '06': '06 ND',
  '14': '14 SE',
  '11': '11 EXP'
}[tipoDte] || tipoDte || 'DTE');

const nombreTipoDte = (tipoDte) => ({
  '01': 'Factura de Consumidor Final',
  '03': 'Comprobante de Crédito Fiscal',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '14': 'Factura de Sujeto Excluido',
  '11': 'Factura de Exportación'
}[tipoDte] || 'Documento Tributario Electrónico');

const obtenerCorrelativoNumeroControl = (numeroControl) => {
  const correlativo = String(numeroControl || '').split('-').pop() || '';
  return correlativo.replace(/^0+(?=\d)/, '') || '—';
};

const nombreCliente = (cliente) => {
  if (!cliente) return 'Consumidor final';
  return [cliente.nombre, cliente.nombres, cliente.apellidos]
    .filter(Boolean).join(' ').trim() || cliente.nombreComercial || 'Consumidor final';
};

const formatearFechaVenta = (fecha) => {
  const fechaConvertida = new Date(fecha);
  return Number.isNaN(fechaConvertida.getTime()) ? '—' : fechaConvertida.toLocaleDateString();
};

const obtenerSelloRecepcion = (venta) => String(venta?.selloRecepcion || '').trim();
const obtenerSelloAnulacion = (venta) => String(venta?.selloAnulacion || '').trim();

const puedeEmitirNota = (venta) => (
  venta?.tipoCodigo === '03'
  && Boolean(obtenerSelloRecepcion(venta))
  && !obtenerSelloAnulacion(venta)
);

const motivoNotaNoDisponible = (venta) => {
  if (venta?.tipoCodigo !== '03') return 'Las notas solo pueden emitirse sobre un DTE 03.';
  if (!obtenerSelloRecepcion(venta)) return 'El DTE debe tener sello de recepción.';
  if (obtenerSelloAnulacion(venta)) return 'No se puede emitir una nota sobre un DTE anulado.';
  return '';
};

const obtenerEstadoVenta = (venta) => {
  const selloRecepcion = obtenerSelloRecepcion(venta);
  const selloAnulacion = obtenerSelloAnulacion(venta);

  if (!selloRecepcion) {
    return {
      etiqueta: 'Inválido',
      icono: 'pi-exclamation-circle',
      color: '#be123c',
      fondo: 'rgba(225, 29, 72, 0.10)',
      titulo: 'Documento inválido: no tiene sello de recepción'
    };
  }

  if (selloAnulacion) {
    return {
      etiqueta: 'Anulado',
      icono: 'pi-ban',
      color: '#b45309',
      fondo: 'rgba(245, 158, 11, 0.12)',
      titulo: `Sello de anulación: ${selloAnulacion}`
    };
  }

  return {
    etiqueta: 'Válido',
    icono: 'pi-check-circle',
    color: '#047857',
    fondo: 'rgba(16, 185, 129, 0.10)',
    titulo: `Documento válido. Sello de recepción: ${selloRecepcion}`
  };
};

export default function VistaVentas() {
  const { puede } = useAuth();
  const toast = useRef(null);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroControl, setFiltroControl] = useState('');
  const [pagina, setPagina] = useState(0);
  const [filas, setFilas] = useState(20);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [orden, setOrden] = useState({ campo: 'fecha', direccion: -1 });
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    const espera = setTimeout(async () => {
      setCargando(true);
      setErrorCarga('');
      try {
        const respuesta = await api.get('/Ventas', {
          signal: controlador.signal,
          params: {
            page: pagina,
            size: filas,
            tipoDte: filtroTipo,
            cliente: filtroCliente.trim(),
            numeroControl: filtroControl.trim(),
            sortBy: orden.campo,
            sortDir: orden.direccion === 1 ? 'asc' : 'desc'
          }
        });
        const contenido = Array.isArray(respuesta.data?.content) ? respuesta.data.content : [];
        setVentas(contenido.map((venta) => ({
          ...venta,
          cliente: venta.cliente || venta.nombreReceptor || nombreCliente(venta.cliente),
          tipo: etiquetaTipoDte(venta.tipoDte),
          tipoCodigo: venta.tipoDte,
          total: Number(venta.totalGeneral || 0),
          fecha: venta.fecha || venta.createdAt
        })));
        setTotalRegistros(Number(respuesta.data?.totalElements || 0));
      } catch (error) {
        if (error.code === 'ERR_CANCELED') return;
        console.error('Error al cargar ventas:', error);
        setErrorCarga(error.response?.data?.message || 'No se pudieron cargar las ventas reales del servidor.');
        setVentas([]);
        setTotalRegistros(0);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }, filtroCliente || filtroControl ? 300 : 0);
    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [pagina, filas, filtroTipo, filtroCliente, filtroControl, orden, recarga]);

  const cargarVentas = () => setRecarga((actual) => actual + 1);

  const tiposDte = [
    { label: 'Todos', value: '' },
    { label: '01 CF', value: '01' },
    { label: '03 CCF', value: '03' },
    { label: '05 NC', value: '05' },
    { label: '06 ND', value: '06' },
    { label: '14 SE', value: '14' },
    { label: '11 EXP', value: '11' }
  ];

  const opcionesOrden = [
    { label: 'Fecha de emisión', value: 'fecha' },
    { label: 'Tipo DTE', value: 'tipoDte' },
    { label: 'Número de control', value: 'numeroControl' },
    { label: 'Total', value: 'totalGeneral' },
  ];

  const opcionesFilas = [10, 20, 50, 100].map((valor) => ({
    label: `${valor} por página`,
    value: valor,
  }));

  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState(null);
  const [accionCargando, setAccionCargando] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [tipoNota, setTipoNota] = useState('Crédito');
  const [consultaVisible, setConsultaVisible] = useState(false);
  const [consultaCargando, setConsultaCargando] = useState(false);
  const [respuestaConsulta, setRespuestaConsulta] = useState(null);
  const [errorConsulta, setErrorConsulta] = useState('');
  const [operacionHacienda, setOperacionHacienda] = useState('consultar');
  const [notaVisible, setNotaVisible] = useState(false);
  const [tipoDteNota, setTipoDteNota] = useState('05');
  const [ventaOrigenNota, setVentaOrigenNota] = useState(null);
  const [lineasNota, setLineasNota] = useState([]);
  const [notaCargando, setNotaCargando] = useState(false);
  const [notaEmitiendo, setNotaEmitiendo] = useState(false);
  const [errorCargaNota, setErrorCargaNota] = useState('');
  const [errorEmisionNota, setErrorEmisionNota] = useState('');

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroCliente('');
    setFiltroControl('');
    setPagina(0);
  };

  const abrirAcciones = (venta) => {
    setVentaSeleccionada(venta);
    setDialogoVisible(true);
  };

  const confirmarAccion = (accion) => {
    if (accion === 'Nota Créd/Déb' && !puedeEmitirNota(ventaSeleccionada)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Nota no disponible',
        detail: motivoNotaNoDisponible(ventaSeleccionada),
        life: 5000
      });
      return;
    }
    setAccionConfirmar(accion);
    setEmailDestino('');
    setTipoNota('Crédito');
    setConfirmacionVisible(true);
  };

  const limpiarNota = () => {
    setVentaOrigenNota(null);
    setLineasNota([]);
    setErrorCargaNota('');
    setErrorEmisionNota('');
  };

  const cerrarNota = () => {
    if (notaEmitiendo) return;
    setNotaVisible(false);
    limpiarNota();
  };

  const obtenerMensajeErrorApi = (error, mensajePorDefecto) => {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    return data?.message || data?.mensaje || data?.error || error.message || mensajePorDefecto;
  };

  const cargarVentaParaNota = async (venta = ventaSeleccionada, tipoDte = tipoDteNota) => {
    if (!venta?.id) return;

    setTipoDteNota(tipoDte);
    setNotaVisible(true);
    setNotaCargando(true);
    setErrorCargaNota('');
    setErrorEmisionNota('');
    setVentaOrigenNota(null);
    setLineasNota([]);

    try {
      const respuesta = await api.get(`/Ventas/${venta.id}`);
      const ventaCompleta = respuesta.data;
      if (!ventaCompleta || typeof ventaCompleta !== 'object') {
        throw new Error('El servidor no devolvió la venta solicitada.');
      }
      if (!Array.isArray(ventaCompleta.detallesVenta) || ventaCompleta.detallesVenta.length === 0) {
        throw new Error('La venta no contiene detalles disponibles para preparar la nota.');
      }

      setVentaOrigenNota(ventaCompleta);
      setLineasNota(normalizarDetallesNota(ventaCompleta.detallesVenta));
    } catch (error) {
      console.error('Error al cargar la venta para la nota:', error);
      setErrorCargaNota(obtenerMensajeErrorApi(error, 'No se pudo obtener la venta original.'));
    } finally {
      setNotaCargando(false);
    }
  };

  const emitirNota = async () => {
    if (!ventaOrigenNota || notaEmitiendo) return;

    const validacion = validarNota(lineasNota, tipoDteNota);
    if (!validacion.esValida) {
      setErrorEmisionNota(validacion.mensajeGeneral || 'Revise las líneas seleccionadas antes de emitir.');
      return;
    }

    setNotaEmitiendo(true);
    setErrorEmisionNota('');
    try {
      const payload = construirPayloadNota({
        ventaOrigen: ventaOrigenNota,
        lineas: lineasNota,
        tipoDte: tipoDteNota,
      });
      const respuesta = await api.post('/Ventas', payload);
      const notaEmitida = respuesta.data || {};
      const sello = obtenerSelloRecepcion(notaEmitida);
      const detalle = [
        notaEmitida.numeroControl && `Control: ${notaEmitida.numeroControl}`,
        sello && `Sello: ${sello}`,
      ].filter(Boolean).join(' · ') || 'La nota fue recibida correctamente.';

      toast.current?.show({
        severity: 'success',
        summary: `DTE ${tipoDteNota} emitido`,
        detail: detalle,
        life: 7000
      });
      setNotaVisible(false);
      limpiarNota();
      await cargarVentas();
    } catch (error) {
      console.error('Error al emitir la nota:', error);
      setErrorEmisionNota(obtenerMensajeErrorApi(error, 'No fue posible emitir la nota.'));
    } finally {
      setNotaEmitiendo(false);
    }
  };

  const ejecutarAccion = async () => {
    if (!ventaSeleccionada?.id || accionCargando) return;

    setAccionCargando(true);
    try {
      if (accionConfirmar === 'Anular') {
        await anulacionHacienda(ventaSeleccionada);
      } else if (accionConfirmar === 'Enviar Hacienda') {
        await enviarHacienda(ventaSeleccionada);
      } else if (accionConfirmar === 'Enviar Correo') {
        const respuesta = await api.post(`/Ventas/${ventaSeleccionada.id}/correo`, { destinatario: emailDestino });
        toast.current.show({ severity: 'success', summary: 'Correo enviado', detail: respuesta.data?.mensaje || 'El DTE fue enviado correctamente.', life: 5000 });
      } else if (accionConfirmar === 'Ver PDF') {
        const respuesta = await api.get(`/Ventas/${ventaSeleccionada.id}/pdf`, { responseType: 'blob' });
        const url = URL.createObjectURL(respuesta.data);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else if (accionConfirmar === 'Descargar JSON') {
        const respuesta = await api.get(`/Ventas/${ventaSeleccionada.id}/json`, { responseType: 'blob' });
        const url = URL.createObjectURL(respuesta.data);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `Factura-${ventaSeleccionada.numeroControl || ventaSeleccionada.id}.json`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
      } else if (accionConfirmar === 'Nota Créd/Déb') {
        const tipoDte = tipoNota === 'Crédito' ? '05' : '06';
        setDialogoVisible(false);
        setConfirmacionVisible(false);
        await cargarVentaParaNota(ventaSeleccionada, tipoDte);
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'No fue posible completar la acción.';
      toast.current.show({ severity: 'error', summary: 'Acción no completada', detail: mensaje, life: 6500 });
    } finally {
      setAccionCargando(false);
      setConfirmacionVisible(false);
    }
  };


  const anulacionHacienda = async (venta = ventaSeleccionada) => {
    setDialogoVisible(false);
    setOperacionHacienda('anular');
    setConsultaVisible(true);
    setRespuestaConsulta(null);
    setErrorConsulta('');

    if (!venta?.id) {
      setErrorConsulta('No se encontro el ID de la venta seleccionada.');
      return;
    }

    setConsultaCargando(true);
    try {
      const respuesta = await api.post('/hacienda/anular-dte', { ventaId: venta.id });
      setRespuestaConsulta(respuesta.data);
      const sello = respuesta.data?.selloRecibido || respuesta.data?.selloRecepcion;
      if (sello) {
        setVentaSeleccionada((actual) => ({ ...actual, selloAnulacion: sello }));
        setVentas((actuales) => actuales.map((actual) => (
          actual.id === venta.id ? { ...actual, selloAnulacion: sello } : actual
        )));
      }
    } catch (error) {
      console.error('Error al anular DTE en Hacienda:', error);
      setErrorConsulta(obtenerMensajeErrorConsulta(error));
    } finally {
      setConsultaCargando(false);
    }
  };

  const obtenerMensajeErrorConsulta = (error) => {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    return data?.message || data?.mensaje || data?.error || error.message || 'No se pudo consultar el DTE en Hacienda.';
  };

  const enviarHacienda = async (venta = ventaSeleccionada) => {
    setDialogoVisible(false);
    setOperacionHacienda('enviar');
    setConsultaVisible(true);
    setRespuestaConsulta(null);
    setErrorConsulta('');

    if (!venta?.id) {
      setErrorConsulta('No se encontro el ID de la venta seleccionada.');
      return;
    }

    setConsultaCargando(true);
    try {
      const respuesta = await api.post('/hacienda/procesar-dte', { ventaId: venta.id });
      setRespuestaConsulta(respuesta.data);
      const sello = respuesta.data?.selloRecibido || respuesta.data?.selloRecepcion;
      if (sello) {
        setVentaSeleccionada((actual) => ({ ...actual, selloRecepcion: sello }));
        setVentas((actuales) => actuales.map((actual) => (
          actual.id === venta.id ? { ...actual, selloRecepcion: sello } : actual
        )));
      }
    } catch (error) {
      console.error('Error al enviar DTE a Hacienda:', error);
      setErrorConsulta(obtenerMensajeErrorConsulta(error));
    } finally {
      setConsultaCargando(false);
    }
  };

  const consultarHacienda = async (venta = ventaSeleccionada) => {
    setDialogoVisible(false);
    setOperacionHacienda('consultar');
    setConsultaVisible(true);
    setRespuestaConsulta(null);
    setErrorConsulta('');

    if (!venta?.id) {
      setErrorConsulta('No se encontro el ID de la venta seleccionada.');
      return;
    }

    setConsultaCargando(true);
    try {
      const respuesta = await api.post('/hacienda/consulta-dte', { ventaId: venta.id });
      setRespuestaConsulta(respuesta.data);
    } catch (error) {
      console.error('Error al consultar DTE en Hacienda:', error);
      setErrorConsulta(obtenerMensajeErrorConsulta(error));
    } finally {
      setConsultaCargando(false);
    }
  };

  const mensajesConfirmacion = {
    'Anular': { titulo: 'Anular DTE', cuerpo: '¿Está seguro de anular este documento? Esta acción no se puede deshacer.', icono: 'pi pi-exclamation-triangle', color: '#ef4444', btn: 'Sí, Anular' },
    'Enviar Hacienda': { titulo: 'Enviar DTE a Hacienda', cuerpo: '¿Desea firmar y enviar este DTE al ambiente fiscal configurado en la venta?', icono: 'pi pi-send', color: '#0ea5e9', btn: 'Sí, Enviar' },
    'Enviar Correo': { titulo: 'Enviar por Correo', cuerpo: '¿Desea enviar este DTE al correo electrónico del cliente?', icono: 'pi pi-envelope', color: '#8b5cf6', btn: 'Sí, Enviar' },
    'Ver PDF': { titulo: 'Ver PDF', cuerpo: '¿Desea abrir el documento PDF de este DTE?', icono: 'pi pi-file-pdf', color: '#3b82f6', btn: 'Sí, Abrir' },
    'Descargar JSON': { titulo: 'Descargar JSON', cuerpo: '¿Desea descargar el archivo JSON de este DTE?', icono: 'pi pi-download', color: '#f59e0b', btn: 'Sí, Descargar' },
    'Nota Créd/Déb': { titulo: 'Preparar Nota', cuerpo: 'Seleccione el tipo de nota que desea emitir para este DTE.', icono: 'pi pi-copy', color: '#10b981', btn: 'Continuar' }
  };

  const acciones = [
    { id: 'Enviar Hacienda', permiso: 'VENTAS_EMITIR', icono: 'pi pi-send', label: 'Enviar MH', color: '#0ea5e9' },
    { id: 'Anular', permiso: 'VENTAS_ANULAR', icono: 'pi pi-ban', label: 'Anular', color: '#ef4444' },
    { id: 'Enviar Correo', permiso: 'VENTAS_ENVIAR', icono: 'pi pi-envelope', label: 'Enviar Correo', color: '#8b5cf6' },
    { id: 'Ver PDF', permiso: 'VENTAS_DOCUMENTOS', icono: 'pi pi-file-pdf', label: 'Ver PDF', color: '#3b82f6' },
    { id: 'Consultar Hacienda', permiso: 'VENTAS_CONSULTAR', icono: 'pi pi-search', label: 'Consultar MH', color: '#06b6d4' },
    { id: 'Descargar JSON', permiso: 'VENTAS_DOCUMENTOS', icono: 'pi pi-download', label: 'Descargar JSON', color: '#f59e0b' },
    { id: 'Nota Créd/Déb', permiso: 'VENTAS_EMITIR_AJUSTES', icono: 'pi pi-copy', label: 'Nota Créd/Déb', color: '#10b981' }
  ].filter((accion) => puede(accion.permiso));

  const accionesTemplate = (fila) => acciones.length ? (
    <span className="ventas-celda-acciones">
      <Button icon="pi pi-ellipsis-h" aria-label={`Acciones para ${fila.numeroControl || 'venta'}`} tooltip="Ver acciones" className="p-button-rounded p-button-text premium-btn-secondary" onClick={() => abrirAcciones(fila)} />
    </span>
  ) : null;

  const fechaVentaTemplate = (fila) => (
    <span className="ventas-celda-fecha">{formatearFechaVenta(fila.fecha)}</span>
  );

  const tipoDteTemplate = (fila) => (
    <span
      className="ventas-celda-tipo"
      title={nombreTipoDte(fila.tipoCodigo)}
      aria-label={`${fila.tipo}: ${nombreTipoDte(fila.tipoCodigo)}`}
      style={{ cursor: 'help', textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}
    >
      {fila.tipo}
    </span>
  );

  const estadoVentaTemplate = (fila) => {
    const estado = obtenerEstadoVenta(fila);
    return (
      <span
        className="ventas-estado inline-flex align-items-center gap-2 px-2 py-1 border-round-lg text-xs font-bold"
        title={estado.titulo}
        style={{
          color: estado.color,
          background: estado.fondo
        }}
      >
        <i className={`pi ${estado.icono}`}></i>
        {estado.etiqueta}
      </span>
    );
  };

  const pieDialogo = ventaSeleccionada && (
    <div className="ventas-modal-actions flex flex-nowrap justify-content-between w-full">
      {acciones.map((accion) => {
        const esAccionNota = accion.id === 'Nota Créd/Déb';
        const esEnvioHacienda = accion.id === 'Enviar Hacienda';
        const deshabilitada = (esAccionNota && !puedeEmitirNota(ventaSeleccionada))
          || (esEnvioHacienda && Boolean(obtenerSelloRecepcion(ventaSeleccionada)));
        const tituloAccion = esAccionNota && deshabilitada
          ? motivoNotaNoDisponible(ventaSeleccionada)
          : esEnvioHacienda && deshabilitada
            ? 'El DTE ya tiene sello de recepción de Hacienda.'
            : accion.label;
        return (
          <button
            key={accion.id}
            className="flex flex-column align-items-center gap-1 p-2 border-none border-round-xl cursor-pointer transition-all transition-duration-200 min-w-0"
            style={{ background: 'transparent', opacity: deshabilitada ? 0.42 : 1 }}
            title={tituloAccion}
            disabled={deshabilitada}
            onClick={() => accion.id === 'Consultar Hacienda' ? consultarHacienda(ventaSeleccionada) : confirmarAccion(accion.id)}
            onMouseEnter={(e) => {
              if (deshabilitada) return;
              e.currentTarget.style.background = 'var(--surface-muted)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex align-items-center justify-content-center border-circle" style={{ width: '38px', height: '38px', background: `${accion.color}20` }}>
              <i className={`${accion.icono}`} style={{ color: accion.color, fontSize: '1rem' }}></i>
            </div>
            <span className="text-xs font-semibold text-center" style={{ color: 'var(--text-secondary)', lineHeight: '1.1', fontSize: '0.65rem' }}>{accion.label}</span>
          </button>
        );
      })}
    </div>
  );

  const reintentarOperacionHacienda = () => {
    if (operacionHacienda === 'enviar') return enviarHacienda(ventaSeleccionada);
    if (operacionHacienda === 'anular') return anulacionHacienda(ventaSeleccionada);
    return consultarHacienda(ventaSeleccionada);
  };

  const etiquetaOperacionHacienda = operacionHacienda === 'enviar'
    ? 'Enviando DTE a Hacienda...'
    : operacionHacienda === 'anular'
      ? 'Anulando DTE en Hacienda...'
      : 'Consultando estado del DTE en Hacienda...';

  const pieConsulta = (
    <div className="flex flex-column sm:flex-row gap-2 justify-content-end">
      <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setConsultaVisible(false)} />
      <Button label={consultaCargando ? 'Procesando...' : 'Reintentar'} icon={consultaCargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'} className="p-button-sm premium-btn" onClick={reintentarOperacionHacienda} disabled={consultaCargando || !ventaSeleccionada?.id} />
    </div>
  );

  const pieConfirmacion = accionConfirmar && (
    <div className="flex flex-column sm:flex-row gap-2 justify-content-end">
      <Button label="No" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setConfirmacionVisible(false)} />
      <Button
        label={accionCargando ? 'Procesando...' : mensajesConfirmacion[accionConfirmar].btn}
        icon={accionCargando ? 'pi pi-spin pi-spinner' : mensajesConfirmacion[accionConfirmar].icono}
        className="p-button-sm"
        style={{ background: mensajesConfirmacion[accionConfirmar].color, borderColor: mensajesConfirmacion[accionConfirmar].color }}
        disabled={accionCargando || (accionConfirmar === 'Enviar Correo' && !emailDestino)}
        onClick={ejecutarAccion}
      />
    </div>
  );

  const cuerpoConfirmacion = () => {
    if (!accionConfirmar) return null;
    const msg = mensajesConfirmacion[accionConfirmar];
    return (
      <div className="flex flex-column align-items-center gap-3 py-3">
        <div className="flex align-items-center justify-content-center border-circle" style={{ width: '60px', height: '60px', background: `${msg.color}15` }}>
          <i className={`${msg.icono} text-2xl`} style={{ color: msg.color }}></i>
        </div>
        <p className="text-center m-0 text-700" style={{ lineHeight: '1.5' }}>{msg.cuerpo}</p>

        {accionConfirmar === 'Enviar Correo' && (
          <div className="w-full premium-input-group">
            <i className="pi pi-envelope premium-input-icon"></i>
            <InputText value={emailDestino} onChange={(e) => setEmailDestino(e.target.value)} placeholder="correo@ejemplo.com" className="w-full" />
          </div>
        )}

        {accionConfirmar === 'Nota Créd/Déb' && (
          <div className="w-full flex flex-column gap-2">
            <div className="flex flex-column sm:flex-row gap-3 w-full">
              {['Crédito', 'Débito'].map((tipo) => (
                <button key={tipo} onClick={() => setTipoNota(tipo)}
                  className="flex-1 flex flex-column align-items-center gap-2 p-3 border-round-xl cursor-pointer transition-all transition-duration-200"
                  style={{
                    background: tipoNota === tipo ? `${tipo === 'Crédito' ? '#10b981' : '#ef4444'}20` : 'var(--surface-muted)',
                    border: `2px solid ${tipoNota === tipo ? (tipo === 'Crédito' ? '#10b981' : '#ef4444') : 'var(--surface-border-light)'}`,
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => { if (tipoNota !== tipo) { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = 'var(--surface-hover)'; }}}
                  onMouseLeave={(e) => { if (tipoNota !== tipo) { e.currentTarget.style.borderColor = 'var(--surface-border-light)'; e.currentTarget.style.background = 'var(--surface-muted)'; }}}>
                  <i className={`pi ${tipo === 'Crédito' ? 'pi-arrow-down' : 'pi-arrow-up'} text-xl`}
                    style={{ color: tipoNota === tipo ? (tipo === 'Crédito' ? '#10b981' : '#ef4444') : 'var(--text-icon)' }}></i>
                  <span className="text-sm font-bold" style={{ color: tipoNota === tipo ? (tipo === 'Crédito' ? '#065f46' : '#991b1b') : 'var(--text-secondary)' }}>
                    {tipo === 'Crédito' ? 'Nota de Crédito' : 'Nota de Débito'}
                  </span>
                  <span className="text-xs text-center" style={{ color: tipoNota === tipo ? (tipo === 'Crédito' ? '#065f46' : '#991b1b') : 'var(--text-icon)', lineHeight: '1.3' }}>
                    {tipo === 'Crédito' ? 'Disminuye el valor del DTE original' : 'Incrementa el valor del DTE original'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="vista-ventas p-3 md:p-4 premium-fade-in">
      <Toast ref={toast} />
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gestión de Ventas (DTE)</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Emisión de documentos electrónicos y consulta histórica de ventas.</p>
      </div>

      <div className="premium-surface-card">
        <div className="p-3 md:p-4">
          {errorCarga && (
            <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-3 p-3 mb-4 border-round-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.22)', color: '#be123c' }}>
              <span className="text-sm flex align-items-start gap-2 min-w-0"><i className="pi pi-exclamation-circle mt-1"></i><span className="overflow-wrap-anywhere">{errorCarga}</span></span>
              <Button label="Reintentar" icon="pi pi-refresh" className="p-button-sm p-button-outlined w-full sm:w-auto" onClick={cargarVentas} />
            </div>
          )}
          <div className="grid align-items-end mb-4">
            <div className="col-12 sm:col-6 xl:col-3 flex flex-column gap-2">
              <label className="premium-label">Tipo DTE</label>
              <Dropdown value={filtroTipo} options={tiposDte} onChange={(e) => { setFiltroTipo(e.value); setPagina(0); }} placeholder="Todos" className="w-full" />
            </div>
            <div className="col-12 sm:col-6 xl:col-3 flex flex-column gap-2">
              <label className="premium-label">Cliente</label>
              <div className="premium-input-group">
                <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.8rem' }}></i>
                <InputText value={filtroCliente} onChange={(e) => { setFiltroCliente(e.target.value); setPagina(0); }} placeholder="Buscar por cliente..." className="w-full" />
              </div>
            </div>
            <div className="col-12 sm:col-6 xl:col-3 flex flex-column gap-2">
              <label className="premium-label">N° Control</label>
              <div className="premium-input-group">
                <i className="pi pi-hashtag premium-input-icon" style={{ fontSize: '0.8rem' }}></i>
                <InputText value={filtroControl} onChange={(e) => { setFiltroControl(e.target.value); setPagina(0); }} placeholder="Buscar por número..." />
              </div>
            </div>
            <div className="col-12 xl:col-3 flex flex-column sm:flex-row gap-2">
              <Button icon={cargando ? "pi pi-spin pi-spinner" : "pi pi-refresh"} label={cargando ? "Cargando..." : "Actualizar"} className="premium-btn w-full" onClick={cargarVentas} disabled={cargando} />
              <Button icon="pi pi-times" label="Limpiar" className="p-button-outlined premium-btn-secondary w-full" onClick={limpiarFiltros} />
            </div>
          </div>

          <div className="ventas-mobile-controls mb-4" aria-label="Controles de tabla">
            <div className="ventas-mobile-control-field">
              <label className="premium-label" htmlFor="ventas-orden">Ordenar por</label>
              <Dropdown
                inputId="ventas-orden"
                value={orden.campo}
                options={opcionesOrden}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => { setOrden((actual) => ({ ...actual, campo: e.value })); setPagina(0); }}
                className="w-full"
              />
            </div>
            <Button
              icon={orden.direccion === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'}
              label={orden.direccion === 1 ? 'Ascendente' : 'Descendente'}
              outlined
              className="ventas-mobile-sort-button"
              aria-label={`Cambiar orden a ${orden.direccion === 1 ? 'descendente' : 'ascendente'}`}
              onClick={() => { setOrden((actual) => ({ ...actual, direccion: actual.direccion === 1 ? -1 : 1 })); setPagina(0); }}
            />
            <div className="ventas-mobile-control-field">
              <label className="premium-label" htmlFor="ventas-filas">Filas</label>
              <Dropdown
                inputId="ventas-filas"
                value={filas}
                options={opcionesFilas}
                onChange={(e) => { setFilas(e.value); setPagina(0); }}
                className="w-full"
              />
            </div>
            <span className="ventas-mobile-page-summary" aria-live="polite">
              Página {pagina + 1} de {Math.max(1, Math.ceil(totalRegistros / filas))} · {totalRegistros} ventas
            </span>
          </div>

          <div className="premium-table ventas-table">
            <DataTable value={ventas} lazy paginator first={pagina * filas} rows={filas} rowsPerPageOptions={[10, 20, 50, 100]} totalRecords={totalRegistros} onPage={(e) => { setPagina(e.page); setFilas(e.rows); }} onSort={(e) => { setOrden({ campo: e.sortField, direccion: e.sortOrder }); setPagina(0); }} sortField={orden.campo} sortOrder={orden.direccion} size="small" loading={cargando} emptyMessage={errorCarga ? "No se pudieron cargar las ventas" : "No hay ventas registradas"} responsiveLayout="stack" breakpoint="1024px">
              <Column field="fecha" header="Fecha" body={fechaVentaTemplate} sortable style={{ width: '108px', minWidth: '108px' }}></Column>
              <Column field="tipo" sortField="tipoDte" header="DTE" body={tipoDteTemplate} sortable style={{ width: '72px', minWidth: '72px' }}></Column>
              <Column field="numeroControl" header="N.º control" sortable body={(f) => <span className="ventas-celda-control">{obtenerCorrelativoNumeroControl(f.numeroControl)}</span>} style={{ width: '112px', minWidth: '112px' }}></Column>
              <Column field="cliente" header="Cliente" body={(f) => <span className="ventas-celda-cliente">{f.cliente}</span>} style={{ minWidth: '130px' }}></Column>
              <Column field="total" sortField="totalGeneral" header="Total" body={(f) => <span className="ventas-celda-total">${f.total.toFixed(2)}</span>} sortable style={{ width: '82px', minWidth: '82px' }}></Column>
              <Column header="Estado" body={estadoVentaTemplate} style={{ width: '104px', minWidth: '104px' }}></Column>
              <Column header="Acciones" body={accionesTemplate} style={{ width: '72px', minWidth: '72px' }}></Column>
            </DataTable>
          </div>
        </div>
      </div>

      <Dialog header={ventaSeleccionada ? ventaSeleccionada.numeroControl : 'Acciones'} visible={dialogoVisible} style={{ width: '580px', maxWidth: 'calc(100vw - 1rem)' }} breakpoints={{ '760px': 'calc(100vw - 1rem)' }} className="ventas-dialog" onHide={() => setDialogoVisible(false)} footer={pieDialogo} draggable={false} resizable={false}>
        {ventaSeleccionada && (
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-3 p-3 border-round-xl ventas-venta-resumen" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex align-items-center justify-content-center border-circle" style={{ width: '44px', height: '44px', minWidth: '44px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <i className="pi pi-file text-white"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold m-0" style={{ color: 'var(--text-primary)', fontSize: '1.05rem', overflowWrap: 'anywhere' }}>{ventaSeleccionada.cliente}</p>
                <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>{ventaSeleccionada.tipo} <span className="mx-2">•</span> ${ventaSeleccionada.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="col-12 flex flex-column gap-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Código de Generación</span>
                <span className="font-bold text-sm font-monospace" style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{ventaSeleccionada.codigoGeneracion}</span>
              </div>
              <div className="col-12 flex flex-column gap-1 mt-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Sello de Recepción MH</span>
                {obtenerSelloRecepcion(ventaSeleccionada) ? (
                  <div className="flex align-items-start gap-2 p-2 border-round-lg" style={{ background: 'rgba(16, 185, 129, 0.10)', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
                    <i className="pi pi-check-circle text-sm mt-1" style={{ color: '#059669' }}></i>
                    <span className="text-xs font-semibold font-monospace" style={{ color: '#047857', overflowWrap: 'anywhere' }}>{obtenerSelloRecepcion(ventaSeleccionada)}</span>
                  </div>
                ) : (
                  <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <i className="pi pi-clock text-sm" style={{ color: '#eab308' }}></i>
                    <span className="text-xs font-semibold" style={{ color: '#eab308' }}>Pendiente de recepción por el Ministerio de Hacienda</span>
                  </div>
                )}
              </div>
              <div className="col-12 flex flex-column gap-1 mt-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Fecha de Emisión</span>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{new Date(ventaSeleccionada.fecha).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>Seleccione una acción para este documento:</p>
            {!puedeEmitirNota(ventaSeleccionada) && (
              <div className="flex align-items-start gap-2 p-2 border-round-lg" style={{ color: '#b45309', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <i className="pi pi-info-circle mt-1 text-xs"></i>
                <span className="text-xs">{motivoNotaNoDisponible(ventaSeleccionada)}</span>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog header={accionConfirmar ? mensajesConfirmacion[accionConfirmar].titulo : ''} visible={confirmacionVisible} style={{ width: '440px', maxWidth: 'calc(100vw - 1rem)' }} breakpoints={{ '640px': 'calc(100vw - 1rem)' }} className="ventas-dialog" onHide={() => setConfirmacionVisible(false)} footer={pieConfirmacion} draggable={false} resizable={false}>
        {cuerpoConfirmacion()}
      </Dialog>

      <DialogoNotaVenta
        visible={notaVisible}
        tipoDte={tipoDteNota}
        ventaOrigen={ventaOrigenNota}
        lineas={lineasNota}
        setLineas={setLineasNota}
        cargando={notaCargando}
        errorCarga={errorCargaNota}
        errorEmision={errorEmisionNota}
        emitiendo={notaEmitiendo}
        onReintentar={() => cargarVentaParaNota(ventaSeleccionada, tipoDteNota)}
        onEmitir={emitirNota}
        onHide={cerrarNota}
      />

      <Dialog header="Operación con Hacienda" visible={consultaVisible} style={{ width: '560px', maxWidth: 'calc(100vw - 1rem)' }} breakpoints={{ '760px': 'calc(100vw - 1rem)' }} className="ventas-dialog" onHide={() => setConsultaVisible(false)} footer={pieConsulta} draggable={false} resizable={false}>
        <div className="flex flex-column gap-3" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {ventaSeleccionada && (
            <div className="flex align-items-center gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)', minWidth: 0 }}>
              <div className="flex align-items-center justify-content-center border-circle" style={{ width: '44px', height: '44px', minWidth: '44px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                <i className="pi pi-search text-white"></i>
              </div>
              <div className="min-w-0" style={{ overflow: 'hidden' }}>
                <p className="font-bold m-0" style={{ color: 'var(--text-primary)', fontSize: '1rem', overflowWrap: 'anywhere' }}>{ventaSeleccionada.numeroControl}</p>
                <p className="text-sm m-0" style={{ color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{ventaSeleccionada.tipo} <span className="mx-2">•</span> {ventaSeleccionada.cliente}</p>
              </div>
            </div>
          )}

          {consultaCargando && (
            <div className="flex flex-column align-items-center gap-3 py-4">
              <i className="pi pi-spin pi-spinner text-3xl" style={{ color: '#06b6d4' }}></i>
              <p className="m-0 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{etiquetaOperacionHacienda}</p>
            </div>
          )}

          {errorConsulta && !consultaCargando && (
            <div className="p-3 border-round-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.22)', color: '#be123c', maxWidth: '100%', overflow: 'hidden' }}>
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-exclamation-circle"></i>
                <span className="font-bold text-sm">No se pudo completar la consulta</span>
              </div>
              <pre className="m-0 text-xs" style={{ fontFamily: 'monospace', lineHeight: '1.45', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}>{errorConsulta}</pre>
            </div>
          )}

          {respuestaConsulta && !consultaCargando && (
            <div className="flex flex-column gap-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Respuesta de Hacienda</span>
              <pre className="m-0 p-3 border-round-xl text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', maxHeight: '320px', overflowY: 'auto', overflowX: 'hidden', fontFamily: 'monospace', lineHeight: '1.45', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}>{JSON.stringify(respuestaConsulta, null, 2)}</pre>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
