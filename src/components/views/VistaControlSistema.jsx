import { useEffect, useRef, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import {
  actualizarUltimoCorrelativo,
  listarCorrelativos,
  obtenerCorrelativo,
  registrarCorrelativo
} from '../../services/correlativos';
import {
  AMBIENTES_CORRELATIVO,
  construirSolicitudCorrelativo,
  convertirCorrelativoAFormulario,
  crearFormularioCorrelativoInicial,
  formatearCorrelativoDte,
  MAXIMO_CORRELATIVO_DTE,
  obtenerEtiquetaAmbiente,
  obtenerEtiquetaTipoDte,
  obtenerMensajeErrorApi,
  TIPOS_DTE_CORRELATIVO,
  validarFormularioCorrelativo
} from '../../utils/correlativos';

export default function VistaControlSistema() {
  const toast = useRef(null);

  // Datos de prueba de la pestaña de usuarios
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombreUsuario: 'admin', correo: 'admin@facturacion.com', habilitado: true, rol: 'Administrador' },
    { id: 2, nombreUsuario: 'facturador1', correo: 'facturas@facturacion.com', habilitado: true, rol: 'Facturador' }
  ]);

  const [correlativos, setCorrelativos] = useState([]);
  const [cargandoCorrelativos, setCargandoCorrelativos] = useState(true);
  const [detalleCorrelativoId, setDetalleCorrelativoId] = useState(null);
  const [dialogoCorrelativoVisible, setDialogoCorrelativoVisible] = useState(false);
  const [guardandoCorrelativo, setGuardandoCorrelativo] = useState(false);
  const [formularioCorrelativo, setFormularioCorrelativo] = useState(crearFormularioCorrelativoInicial);
  const [erroresCorrelativo, setErroresCorrelativo] = useState({});

  // Estado del formulario
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombreUsuario: '', correo: '', contrasena: '', rol: 'Facturador' });
  const [successUsuario, setSuccessUsuario] = useState(false);

  const rolesOpciones = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Facturador', value: 'Facturador' },
    { label: 'Auditor', value: 'Auditor' }
  ];

  const cargarCorrelativos = async (mostrarError = true) => {
    setCargandoCorrelativos(true);
    try {
      setCorrelativos(await listarCorrelativos());
    } catch (error) {
      console.error('Error al cargar correlativos:', error);
      if (mostrarError) {
        toast.current?.show({
          severity: 'error',
          summary: 'No se pudieron cargar',
          detail: obtenerMensajeErrorApi(error, 'No fue posible obtener los correlativos configurados.'),
          life: 4500
        });
      }
    } finally {
      setCargandoCorrelativos(false);
    }
  };

  useEffect(() => {
    let vistaActiva = true;

    listarCorrelativos()
      .then((lista) => {
        if (vistaActiva) setCorrelativos(lista);
      })
      .catch((error) => {
        console.error('Error al cargar correlativos:', error);
        if (vistaActiva) {
          toast.current?.show({
            severity: 'error',
            summary: 'No se pudieron cargar',
            detail: obtenerMensajeErrorApi(error, 'No fue posible obtener los correlativos configurados.'),
            life: 4500
          });
        }
      })
      .finally(() => {
        if (vistaActiva) setCargandoCorrelativos(false);
      });

    return () => {
      vistaActiva = false;
    };
  }, []);

  const abrirNuevoCorrelativo = () => {
    setFormularioCorrelativo(crearFormularioCorrelativoInicial());
    setErroresCorrelativo({});
    setDialogoCorrelativoVisible(true);
  };

  const abrirEdicionCorrelativo = async (fila) => {
    setDetalleCorrelativoId(fila.id);
    try {
      const correlativoActual = await obtenerCorrelativo(fila.id);
      setFormularioCorrelativo(convertirCorrelativoAFormulario(correlativoActual));
      setErroresCorrelativo({});
      setDialogoCorrelativoVisible(true);
    } catch (error) {
      console.error('Error al obtener el correlativo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'No se pudo abrir',
        detail: obtenerMensajeErrorApi(error, 'No fue posible obtener el detalle del correlativo.'),
        life: 4500
      });
    } finally {
      setDetalleCorrelativoId(null);
    }
  };

  const cambiarCampoCorrelativo = (campo, valor) => {
    setFormularioCorrelativo((actual) => ({ ...actual, [campo]: valor }));
    setErroresCorrelativo((actual) => ({ ...actual, [campo]: undefined }));
  };

  const cambiarCodigoCorrelativo = (campo, valor) => {
    const codigo = valor.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
    cambiarCampoCorrelativo(campo, codigo);
  };

  const cerrarDialogoCorrelativo = () => {
    if (guardandoCorrelativo) return;
    setDialogoCorrelativoVisible(false);
    setErroresCorrelativo({});
  };

  const guardarCorrelativo = async (evento) => {
    evento.preventDefault();
    const esEdicion = formularioCorrelativo.id !== null;
    const errores = validarFormularioCorrelativo(formularioCorrelativo, esEdicion);

    if (Object.keys(errores).length > 0) {
      setErroresCorrelativo(errores);
      return;
    }

    setGuardandoCorrelativo(true);
    try {
      if (esEdicion) {
        await actualizarUltimoCorrelativo(formularioCorrelativo.id, Number(formularioCorrelativo.ultimoValor));
      } else {
        await registrarCorrelativo(construirSolicitudCorrelativo(formularioCorrelativo));
      }

      await cargarCorrelativos(false);
      setDialogoCorrelativoVisible(false);
      toast.current?.show({
        severity: 'success',
        summary: esEdicion ? 'Correlativo actualizado' : 'Correlativo registrado',
        detail: esEdicion
          ? 'El último valor utilizado se actualizó correctamente.'
          : 'La nueva serie DTE quedó disponible para emitir documentos.',
        life: 3500
      });
    } catch (error) {
      console.error('Error al guardar el correlativo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'No se pudo guardar',
        detail: obtenerMensajeErrorApi(error, esEdicion
          ? 'No fue posible actualizar el correlativo.'
          : 'No fue posible registrar la serie. Verifique que no esté duplicada.'),
        life: 5000
      });
    } finally {
      setGuardandoCorrelativo(false);
    }
  };

  // Descomentar para conectar con la API
  /*
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const respuesta = await api.get('/usuarios');
        const listaUsuarios = (respuesta.data || []).map(u => ({
          id: u.id,
          nombreUsuario: u.nombreUsuario || u.username,
          correo: u.correo,
          habilitado: u.habilitado !== undefined ? u.habilitado : true,
          rol: u.roles && u.roles[0] ? u.roles[0].nombre : 'Facturador'
        }));
        setUsuarios(listaUsuarios);
      } catch (error) {
        console.error("Error al cargar usuarios de la API:", error);
      }
    };
    cargarUsuarios();
  }, []);
  */

  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.nombreUsuario || !nuevoUsuario.correo || !nuevoUsuario.contrasena) return;

    // Descomentar para guardar en la API
    /*
    try {
      const payload = {
        nombreUsuario: nuevoUsuario.nombreUsuario,
        correo: nuevoUsuario.correo,
        contrasena: nuevoUsuario.contrasena,
        habilitado: true
      };
      const respuesta = await api.post('/usuarios', payload);
      const usuarioCreado = respuesta.data;
      
      setUsuarios(prev => [...prev, {
        id: usuarioCreado.id,
        nombreUsuario: usuarioCreado.nombreUsuario,
        correo: usuarioCreado.correo,
        habilitado: usuarioCreado.habilitado !== undefined ? usuarioCreado.habilitado : true,
        rol: nuevoUsuario.rol
      }]);
      setNuevoUsuario({ nombreUsuario: '', correo: '', contrasena: '', rol: 'Facturador' });
      setSuccessUsuario(true);
      setTimeout(() => setSuccessUsuario(false), 2000);
      return;
    } catch (error) {
      console.error("Error al guardar usuario en la API:", error);
      return;
    }
    */

    // Simulación local (comentar al conectar API)
    const nuevo = {
      id: Date.now(),
      nombreUsuario: nuevoUsuario.nombreUsuario,
      correo: nuevoUsuario.correo,
      habilitado: true,
      rol: nuevoUsuario.rol
    };
    setUsuarios([...usuarios, nuevo]);
    setNuevoUsuario({ nombreUsuario: '', correo: '', contrasena: '', rol: 'Facturador' });
    setSuccessUsuario(true);
    setTimeout(() => setSuccessUsuario(false), 2000);
  };

  const tipoDteTemplate = (fila) => (
    <div className="correlativo-tipo-cell">
      <span className="correlativo-tipo-codigo">{fila.tipoDte}</span>
      <span>{obtenerEtiquetaTipoDte(fila.tipoDte).replace(/^\d{2} · /, '')}</span>
    </div>
  );

  const ambienteTemplate = (fila) => (
    <Tag
      value={obtenerEtiquetaAmbiente(fila.ambiente)}
      severity={fila.ambiente === '01' ? 'warning' : 'info'}
      className="premium-tag correlativo-ambiente-tag"
    />
  );

  const ultimoValorTemplate = (fila) => (
    <span className="correlativo-numero">{formatearCorrelativoDte(fila.ultimoValor)}</span>
  );

  const accionesCorrelativoTemplate = (fila) => (
    <Button
      label="Editar"
      icon="pi pi-pencil"
      className="p-button-sm p-button-outlined premium-btn-secondary"
      onClick={() => abrirEdicionCorrelativo(fila)}
      loading={detalleCorrelativoId === fila.id}
      disabled={detalleCorrelativoId !== null}
      aria-label={`Editar correlativo DTE ${fila.tipoDte}`}
    />
  );

  const pieDialogoCorrelativo = (
    <div className="flex justify-content-end gap-2">
      <Button
        type="button"
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text premium-btn-secondary"
        onClick={cerrarDialogoCorrelativo}
        disabled={guardandoCorrelativo}
      />
      <Button
        type="submit"
        form="formulario-correlativo"
        label={formularioCorrelativo.id !== null ? 'Guardar cambio' : 'Registrar correlativo'}
        icon={formularioCorrelativo.id !== null ? 'pi pi-check' : 'pi pi-plus'}
        className="premium-btn"
        loading={guardandoCorrelativo}
      />
    </div>
  );

  return (
    <div className="p-4 premium-fade-in control-sistema">
      <Toast ref={toast} position="top-right" />
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control y Parámetros del Sistema</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestión de correlativos DTE autorizados y control de accesos.</p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs">
          
          <TabPanel header="Correlativos DTE" leftIcon="pi pi-hashtag" headerClassName="mr-2">
            <div className="pt-2">
              <div className="correlativos-toolbar mb-3">
                <div>
                  <div className="flex align-items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>Series configuradas</h3>
                    {!cargandoCorrelativos && (
                      <span className="correlativos-total">{correlativos.length}</span>
                    )}
                  </div>
                  <p className="text-sm mt-1 mb-0" style={{ color: 'var(--text-muted)' }}>
                    Registre las series autorizadas y ajuste el último valor utilizado cuando sea necesario.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap correlativos-toolbar-actions">
                  <Button
                    icon="pi pi-refresh"
                    label="Actualizar"
                    className="p-button-outlined premium-btn-secondary"
                    onClick={() => cargarCorrelativos()}
                    loading={cargandoCorrelativos}
                    aria-label="Actualizar lista de correlativos"
                  />
                  <Button
                    icon="pi pi-plus"
                    label="Nuevo correlativo"
                    className="premium-btn"
                    onClick={abrirNuevoCorrelativo}
                  />
                </div>
              </div>

              <div className="premium-table correlativos-table">
                <DataTable
                  value={correlativos}
                  size="small"
                  loading={cargandoCorrelativos}
                  emptyMessage="No hay correlativos configurados. Registre la primera serie para comenzar."
                  scrollable
                  sortField="tipoDte"
                  sortOrder={1}
                >
                  <Column field="tipoDte" header="Tipo DTE" body={tipoDteTemplate} sortable></Column>
                  <Column field="ambiente" header="Ambiente" body={ambienteTemplate} sortable></Column>
                  <Column field="anio" header="Año" sortable></Column>
                  <Column field="codEstable" header="Establecimiento" className="font-monospace font-semibold"></Column>
                  <Column field="codPuntoVenta" header="Punto de Venta" className="font-monospace font-semibold"></Column>
                  <Column field="ultimoValor" header="Último Valor Usado" body={ultimoValorTemplate} sortable></Column>
                  <Column header="Acciones" body={accionesCorrelativoTemplate} frozen alignFrozen="right"></Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Gestión de Usuarios" leftIcon="pi pi-users">
            <div className="grid pt-3">
              
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Nuevo Usuario</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <div className="p-fluid">
                        {successUsuario && (
                          <Message severity="success" text="Usuario registrado exitosamente." className="mb-3 w-full" />
                        )}
                        <form onSubmit={guardarUsuario} className="flex flex-column gap-3">
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Nombre de Usuario</label>
                            <div className="premium-input-group">
                              <i className="pi pi-user premium-input-icon"></i>
                              <InputText value={nuevoUsuario.nombreUsuario} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombreUsuario: e.target.value})} placeholder="Ej. jperez" required />
                            </div>
                          </div>
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Correo Electrónico</label>
                            <div className="premium-input-group">
                              <i className="pi pi-envelope premium-input-icon"></i>
                              <InputText type="email" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario({...nuevoUsuario, correo: e.target.value})} placeholder="jperez@correo.com" required />
                            </div>
                          </div>
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Contraseña</label>
                            <div className="premium-input-group">
                              <i className="pi pi-lock premium-input-icon"></i>
                              <InputText type="password" value={nuevoUsuario.contrasena} onChange={(e) => setNuevoUsuario({...nuevoUsuario, contrasena: e.target.value})} placeholder="Ingrese contraseña..." required />
                            </div>
                          </div>
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Rol asignado</label>
                            <div className="premium-input-group">
                              <i className="pi pi-shield premium-input-icon"></i>
                              <Dropdown value={nuevoUsuario.rol} options={rolesOpciones} onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.value})} />
                            </div>
                          </div>
                          <Button type="submit" label="Registrar Cuenta" icon="pi pi-user-plus" className="premium-btn mt-1" />
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={usuarios} size="small" emptyMessage="No hay usuarios registrados">
                    <Column field="nombreUsuario" header="Usuario" className="font-bold"></Column>
                    <Column field="correo" header="Correo Electrónico"></Column>
                    <Column field="rol" header="Rol"></Column>
                    <Column field="habilitado" header="Estado" body={(f) => <Tag severity={f.habilitado ? "success" : "danger"} value={f.habilitado ? 'Activo' : 'Inactivo'} className="premium-tag"></Tag>}></Column>
                  </DataTable>
                </div>
              </div>

            </div>
          </TabPanel>

        </TabView>
      </div>

      <Dialog
        visible={dialogoCorrelativoVisible}
        header={formularioCorrelativo.id !== null ? 'Editar correlativo DTE' : 'Registrar correlativo DTE'}
        footer={pieDialogoCorrelativo}
        onHide={cerrarDialogoCorrelativo}
        style={{ width: '620px', maxWidth: 'calc(100vw - 1.5rem)' }}
        breakpoints={{ '700px': 'calc(100vw - 1rem)' }}
        className="correlativo-dialog"
        draggable={false}
        resizable={false}
      >
        <form id="formulario-correlativo" onSubmit={guardarCorrelativo} className="correlativo-form" noValidate>
          {formularioCorrelativo.id !== null ? (
            <div className="correlativo-edit-summary">
              <div className="correlativo-edit-icon">
                <i className="pi pi-hashtag" aria-hidden="true"></i>
              </div>
              <div className="correlativo-edit-content">
                <span className="correlativo-edit-eyebrow">Serie seleccionada</span>
                <strong>{obtenerEtiquetaTipoDte(formularioCorrelativo.tipoDte)}</strong>
                <div className="correlativo-edit-meta">
                  <span><i className="pi pi-server"></i>{obtenerEtiquetaAmbiente(formularioCorrelativo.ambiente)}</span>
                  <span><i className="pi pi-calendar"></i>{formularioCorrelativo.anio}</span>
                  <span><i className="pi pi-building"></i>{formularioCorrelativo.codEstable} / {formularioCorrelativo.codPuntoVenta}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid correlativo-form-grid">
              <div className="col-12 md:col-7">
                <label className="premium-label block mb-2" htmlFor="correlativo-tipo">Tipo DTE</label>
                <div className="premium-input-group">
                  <i className="pi pi-file premium-input-icon" aria-hidden="true"></i>
                  <Dropdown
                    inputId="correlativo-tipo"
                    value={formularioCorrelativo.tipoDte}
                    options={TIPOS_DTE_CORRELATIVO}
                    onChange={(e) => cambiarCampoCorrelativo('tipoDte', e.value)}
                    editable
                    className={`w-full ${erroresCorrelativo.tipoDte ? 'p-invalid' : ''}`}
                  />
                </div>
                {erroresCorrelativo.tipoDte && <small className="p-error block mt-1">{erroresCorrelativo.tipoDte}</small>}
              </div>

              <div className="col-12 md:col-5">
                <label className="premium-label block mb-2" htmlFor="correlativo-ambiente">Ambiente</label>
                <div className="premium-input-group">
                  <i className="pi pi-cloud premium-input-icon" aria-hidden="true"></i>
                  <Dropdown
                    inputId="correlativo-ambiente"
                    value={formularioCorrelativo.ambiente}
                    options={AMBIENTES_CORRELATIVO}
                    onChange={(e) => cambiarCampoCorrelativo('ambiente', e.value)}
                    className={`w-full ${erroresCorrelativo.ambiente ? 'p-invalid' : ''}`}
                  />
                </div>
                {erroresCorrelativo.ambiente && <small className="p-error block mt-1">{erroresCorrelativo.ambiente}</small>}
              </div>

              <div className="col-12 md:col-4">
                <label className="premium-label block mb-2" htmlFor="correlativo-anio">Año</label>
                <div className="premium-input-group">
                  <i className="pi pi-calendar premium-input-icon" aria-hidden="true"></i>
                  <InputNumber
                    inputId="correlativo-anio"
                    value={formularioCorrelativo.anio}
                    onValueChange={(e) => cambiarCampoCorrelativo('anio', e.value)}
                    useGrouping={false}
                    min={2000}
                    max={2100}
                    minFractionDigits={0}
                    maxFractionDigits={0}
                    className="w-full"
                    inputClassName={`w-full ${erroresCorrelativo.anio ? 'p-invalid' : ''}`}
                  />
                </div>
                {erroresCorrelativo.anio && <small className="p-error block mt-1">{erroresCorrelativo.anio}</small>}
              </div>

              <div className="col-12 md:col-4">
                <label className="premium-label block mb-2" htmlFor="correlativo-establecimiento">Establecimiento</label>
                <div className="premium-input-group">
                  <i className="pi pi-building premium-input-icon" aria-hidden="true"></i>
                  <InputText
                    id="correlativo-establecimiento"
                    value={formularioCorrelativo.codEstable}
                    onChange={(e) => cambiarCodigoCorrelativo('codEstable', e.target.value)}
                    maxLength={4}
                    placeholder="M001"
                    className={`w-full font-monospace ${erroresCorrelativo.codEstable ? 'p-invalid' : ''}`}
                  />
                </div>
                {erroresCorrelativo.codEstable && <small className="p-error block mt-1">{erroresCorrelativo.codEstable}</small>}
              </div>

              <div className="col-12 md:col-4">
                <label className="premium-label block mb-2" htmlFor="correlativo-punto-venta">Punto de venta</label>
                <div className="premium-input-group">
                  <i className="pi pi-map-marker premium-input-icon" aria-hidden="true"></i>
                  <InputText
                    id="correlativo-punto-venta"
                    value={formularioCorrelativo.codPuntoVenta}
                    onChange={(e) => cambiarCodigoCorrelativo('codPuntoVenta', e.target.value)}
                    maxLength={4}
                    placeholder="P001"
                    className={`w-full font-monospace ${erroresCorrelativo.codPuntoVenta ? 'p-invalid' : ''}`}
                  />
                </div>
                {erroresCorrelativo.codPuntoVenta && <small className="p-error block mt-1">{erroresCorrelativo.codPuntoVenta}</small>}
              </div>
            </div>
          )}

          <div className={formularioCorrelativo.id !== null ? 'mt-4' : 'mt-2'}>
            <label className="premium-label block mb-2" htmlFor="correlativo-ultimo-valor">Último valor utilizado</label>
            <div className="premium-input-group">
              <i className="pi pi-sort-numeric-up premium-input-icon" aria-hidden="true"></i>
              <InputNumber
                inputId="correlativo-ultimo-valor"
                value={formularioCorrelativo.ultimoValor}
                onValueChange={(e) => cambiarCampoCorrelativo('ultimoValor', e.value)}
                useGrouping={false}
                min={0}
                max={MAXIMO_CORRELATIVO_DTE}
                minFractionDigits={0}
                maxFractionDigits={0}
                className="w-full"
                inputClassName={`w-full font-monospace ${erroresCorrelativo.ultimoValor ? 'p-invalid' : ''}`}
                placeholder="0"
              />
            </div>
            {erroresCorrelativo.ultimoValor ? (
              <small className="p-error block mt-1">{erroresCorrelativo.ultimoValor}</small>
            ) : (
              <small className="correlativo-field-help block mt-2">
                El próximo DTE utilizará {formatearCorrelativoDte(Number(formularioCorrelativo.ultimoValor || 0) + 1)}.
              </small>
            )}
          </div>

          <Message
            severity="info"
            text={formularioCorrelativo.id !== null
              ? 'La API permite editar únicamente el último valor utilizado; los datos que identifican la serie no cambiarán.'
              : 'Use 0 si todavía no se ha emitido ningún documento con esta serie.'}
            className="w-full mt-4 correlativo-form-message"
          />
        </form>
      </Dialog>
    </div>
  );
}
