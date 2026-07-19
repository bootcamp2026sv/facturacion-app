import { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import api from '../../services/api';

const etiquetaTipoDte = (tipoDte) => ({
  '01': '01 - Factura',
  '03': '03 - Credito Fiscal',
  '05': '05 - Nota de Credito',
  '06': '06 - Nota de Debito'
}[tipoDte] || tipoDte || 'DTE');

const nombreCliente = (cliente) => {
  if (!cliente) return 'Consumidor final';
  return [cliente.nombre, cliente.nombres, cliente.apellidos]
    .filter(Boolean).join(' ').trim() || cliente.nombreComercial || 'Consumidor final';
};

const obtenerSelloRecepcion = (venta) => String(venta?.selloRecepcion || '').trim();

export default function VistaVentas() {
  const ventasSimuladas = [
    { id: 1, numeroControl: 'DTE-01-M001P001-000000000001000', codigoGeneracion: '288e60c6-aeb4-414b-9227-9b4c16d35c1e', fecha: '2026-06-07T14:30:00', cliente: 'Distribuidora Alimentos S.A.', total: 678.00, tipo: '01 - Factura' },
    { id: 2, numeroControl: 'DTE-03-M001P001-000000000000254', codigoGeneracion: '7a8b60d2-cf14-49c7-8142-2b4c16d35f4a', fecha: '2026-06-07T11:15:00', cliente: 'Juan Carlos Pérez', total: 25.50, tipo: '03 - Crédito Fiscal' }
  ];

  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const cargarVentas = async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const respuesta = await api.get('/Ventas');
      const ventasAPI = Array.isArray(respuesta.data) ? respuesta.data : [];
      setVentas(ventasAPI.map((venta) => ({
        ...venta,
        cliente: nombreCliente(venta.cliente),
        tipo: etiquetaTipoDte(venta.tipoDte),
        tipoCodigo: venta.tipoDte,
        total: Number(venta.totalGeneral || 0),
        fecha: venta.fecha || venta.createdAt,
        fechaOrden: Date.parse(venta.fecha || venta.createdAt) || 0
      })));
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setErrorCarga(error.response?.data?.message || 'No se pudieron cargar las ventas reales del servidor.');
      setVentas([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const tiposDte = [
    { label: 'Todos', value: '' },
    { label: '01 - Factura', value: '01' },
    { label: '03 - Crédito Fiscal', value: '03' }
  ];

  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroControl, setFiltroControl] = useState('');

  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState(null);
  const [emailDestino, setEmailDestino] = useState('');
  const [tipoNota, setTipoNota] = useState('Crédito');
  const [consultaVisible, setConsultaVisible] = useState(false);
  const [consultaCargando, setConsultaCargando] = useState(false);
  const [respuestaConsulta, setRespuestaConsulta] = useState(null);
  const [errorConsulta, setErrorConsulta] = useState('');

  const ventasFiltradas = ventas.filter(v => {
    if (filtroTipo && v.tipoCodigo !== filtroTipo) return false;
    if (filtroCliente && !v.cliente.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    if (filtroControl && !v.numeroControl.toLowerCase().includes(filtroControl.toLowerCase())) return false;
    return true;
  });

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroCliente('');
    setFiltroControl('');
  };

  const abrirAcciones = (venta) => {
    setVentaSeleccionada(venta);
    setDialogoVisible(true);
  };

  const confirmarAccion = (accion) => {
    setAccionConfirmar(accion);
    setEmailDestino('');
    setTipoNota('Crédito');
    setConfirmacionVisible(true);
  };

  const ejecutarAccion = () => {

    //Confirmó que si hay que anular
    if(accionConfirmar === 'Anular'){
      anulacionHacienda(ventaSeleccionada);
    }

    setConfirmacionVisible(false);
  };


  const anulacionHacienda = async (venta = ventaSeleccionada) => {
    setDialogoVisible(false);
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

  const consultarHacienda = async (venta = ventaSeleccionada) => {
    setDialogoVisible(false);
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
    'Enviar Correo': { titulo: 'Enviar por Correo', cuerpo: '¿Desea enviar este DTE al correo electrónico del cliente?', icono: 'pi pi-envelope', color: '#8b5cf6', btn: 'Sí, Enviar' },
    'Ver PDF': { titulo: 'Ver PDF', cuerpo: '¿Desea abrir el documento PDF de este DTE?', icono: 'pi pi-file-pdf', color: '#3b82f6', btn: 'Sí, Abrir' },
    'Descargar JSON': { titulo: 'Descargar JSON', cuerpo: '¿Desea descargar el archivo JSON de este DTE?', icono: 'pi pi-download', color: '#f59e0b', btn: 'Sí, Descargar' },
    'Nota Créd/Déb': { titulo: 'Generar Nota', cuerpo: '¿Desea generar una nota de crédito o débito para este DTE?', icono: 'pi pi-copy', color: '#10b981', btn: 'Sí, Generar' }
  };

  const acciones = [
    { id: 'Anular', icono: 'pi pi-ban', label: 'Anular', color: '#ef4444' },
    { id: 'Enviar Correo', icono: 'pi pi-envelope', label: 'Enviar Correo', color: '#8b5cf6' },
    { id: 'Ver PDF', icono: 'pi pi-file-pdf', label: 'Ver PDF', color: '#3b82f6' },
    { id: 'Consultar Hacienda', icono: 'pi pi-search', label: 'Consultar MH', color: '#06b6d4' },
    { id: 'Descargar JSON', icono: 'pi pi-download', label: 'Descargar JSON', color: '#f59e0b' },
    { id: 'Nota Créd/Déb', icono: 'pi pi-copy', label: 'Nota Créd/Déb', color: '#10b981' }
  ];

  const accionesTemplate = (fila) => (
    <Button icon="pi pi-ellipsis-h" className="p-button-rounded p-button-text premium-btn-secondary" onClick={() => abrirAcciones(fila)} />
  );

  const pieDialogo = ventaSeleccionada && (
    <div className="ventas-modal-actions flex flex-nowrap justify-content-between w-full">
      {acciones.map((accion) => (
        <button key={accion.id} className="flex flex-column align-items-center gap-1 p-2 border-none border-round-xl cursor-pointer transition-all transition-duration-200 min-w-0" style={{ background: 'transparent' }}
          onClick={() => accion.id === 'Consultar Hacienda' ? consultarHacienda(ventaSeleccionada) : confirmarAccion(accion.id)}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-muted)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
          <div className="flex align-items-center justify-content-center border-circle" style={{ width: '38px', height: '38px', background: `${accion.color}20` }}>
            <i className={`${accion.icono}`} style={{ color: accion.color, fontSize: '1rem' }}></i>
          </div>
          <span className="text-xs font-semibold text-center" style={{ color: 'var(--text-secondary)', lineHeight: '1.1', fontSize: '0.65rem' }}>{accion.label}</span>
        </button>
      ))}
    </div>
  );

  const pieConsulta = (
    <div className="flex flex-column sm:flex-row gap-2 justify-content-end">
      <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setConsultaVisible(false)} />
      <Button label={consultaCargando ? 'Consultando...' : 'Reintentar'} icon={consultaCargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'} className="p-button-sm premium-btn" onClick={() => consultarHacienda(ventaSeleccionada)} disabled={consultaCargando || !ventaSeleccionada?.id} />
    </div>
  );

  const pieConfirmacion = accionConfirmar && (
    <div className="flex flex-column sm:flex-row gap-2 justify-content-end">
      <Button label="No" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setConfirmacionVisible(false)} />
      {(accionConfirmar === 'Enviar Correo' || accionConfirmar === 'Nota Créd/Déb')
        ? <Button label={mensajesConfirmacion[accionConfirmar].btn} icon={mensajesConfirmacion[accionConfirmar].icono} className="p-button-sm" style={{ background: mensajesConfirmacion[accionConfirmar].color, borderColor: mensajesConfirmacion[accionConfirmar].color }}
            disabled={accionConfirmar === 'Enviar Correo' && !emailDestino}
            onClick={ejecutarAccion} />
        : <Button label={mensajesConfirmacion[accionConfirmar].btn} icon={mensajesConfirmacion[accionConfirmar].icono} className="p-button-sm" style={{ background: mensajesConfirmacion[accionConfirmar].color, borderColor: mensajesConfirmacion[accionConfirmar].color }} onClick={ejecutarAccion} />
      }
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
              <Dropdown value={filtroTipo} options={tiposDte} onChange={(e) => setFiltroTipo(e.value)} placeholder="Todos" className="w-full" />
            </div>
            <div className="col-12 sm:col-6 xl:col-3 flex flex-column gap-2">
              <label className="premium-label">Cliente</label>
              <div className="premium-input-group">
                <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.8rem' }}></i>
                <InputText value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} placeholder="Buscar por cliente..." className="w-full" />
              </div>
            </div>
            <div className="col-12 sm:col-6 xl:col-3 flex flex-column gap-2">
              <label className="premium-label">N° Control</label>
              <div className="premium-input-group">
                <i className="pi pi-hashtag premium-input-icon" style={{ fontSize: '0.8rem' }}></i>
                <InputText value={filtroControl} onChange={(e) => setFiltroControl(e.target.value)} placeholder="Buscar por número..." />
              </div>
            </div>
            <div className="col-12 xl:col-3 flex flex-column sm:flex-row gap-2">
              <Button icon={cargando ? "pi pi-spin pi-spinner" : "pi pi-refresh"} label={cargando ? "Cargando..." : "Actualizar"} className="premium-btn w-full" onClick={cargarVentas} disabled={cargando} />
              <Button icon="pi pi-times" label="Limpiar" className="p-button-outlined premium-btn-secondary w-full" onClick={limpiarFiltros} />
            </div>
          </div>

          <div className="premium-table ventas-table">
            <DataTable value={ventasFiltradas} paginator rows={5} size="small" loading={cargando} emptyMessage={errorCarga ? "No se pudieron cargar las ventas" : "No hay ventas registradas"} responsiveLayout="stack" breakpoint="1024px" sortField="fechaOrden" sortOrder={-1}>
              <Column field="fecha" sortField="fechaOrden" header="Fecha de Emisión" body={(f) => new Date(f.fecha).toLocaleString()} sortable></Column>
              <Column field="tipo" header="Tipo DTE" sortable></Column>
              <Column field="numeroControl" header="Número de Control" sortable body={(f) => f.numeroControl.split('-').pop()}></Column>
              <Column field="cliente" header="Cliente" sortable></Column>
              <Column field="total" header="Total" body={(f) => `$${f.total.toFixed(2)}`} sortable></Column>
              <Column header="Acciones" body={accionesTemplate} style={{ width: '80px' }}></Column>
            </DataTable>
          </div>
        </div>
      </div>

      <Dialog header={ventaSeleccionada ? ventaSeleccionada.numeroControl : 'Acciones'} visible={dialogoVisible} style={{ width: '580px', maxWidth: 'calc(100vw - 1rem)' }} breakpoints={{ '760px': 'calc(100vw - 1rem)' }} className="ventas-dialog" onHide={() => setDialogoVisible(false)} footer={pieDialogo} draggable={false} resizable={false}>
        {ventaSeleccionada && (
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex align-items-center justify-content-center border-circle" style={{ width: '44px', height: '44px', minWidth: '44px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <i className="pi pi-file text-white"></i>
              </div>
              <div>
                <p className="font-bold m-0" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{ventaSeleccionada.cliente}</p>
                <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>{ventaSeleccionada.tipo} <span className="mx-2">•</span> ${ventaSeleccionada.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="col-12 flex flex-column gap-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Código de Generación</span>
                <span className="font-bold text-sm font-monospace" style={{ color: 'var(--text-primary)' }}>{ventaSeleccionada.codigoGeneracion}</span>
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
          </div>
        )}
      </Dialog>

      <Dialog header={accionConfirmar ? mensajesConfirmacion[accionConfirmar].titulo : ''} visible={confirmacionVisible} style={{ width: '440px', maxWidth: 'calc(100vw - 1rem)' }} breakpoints={{ '640px': 'calc(100vw - 1rem)' }} className="ventas-dialog" onHide={() => setConfirmacionVisible(false)} footer={pieConfirmacion} draggable={false} resizable={false}>
        {cuerpoConfirmacion()}
      </Dialog>

      <Dialog header="Consulta Hacienda" visible={consultaVisible} style={{ width: '560px', maxWidth: 'calc(100vw - 1rem)' }} breakpoints={{ '760px': 'calc(100vw - 1rem)' }} className="ventas-dialog" onHide={() => setConsultaVisible(false)} footer={pieConsulta} draggable={false} resizable={false}>
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
              <p className="m-0 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Consultando estado del DTE en Hacienda...</p>
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
