import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useAuth } from '../../context/AuthContext';
import { auditoriaService, rolesService, usuariosService } from '../../services/rbac';
import {
  actualizarUltimoCorrelativo,
  listarCorrelativos,
  obtenerCorrelativo,
  registrarCorrelativo,
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
  TIPOS_DTE_CORRELATIVO,
  validarFormularioCorrelativo,
} from '../../utils/correlativos';

const usuarioVacio = { id: null, nombreUsuario: '', correo: '', contrasena: '', rolId: null };
const rolVacio = { id: null, nombre: '', descripcion: '', permisos: new Set(), editable: true };

const mensajeApi = (error, respaldo) =>
  error?.response?.data?.message || error?.response?.data?.error || respaldo;

export default function VistaControlSistema() {
  const toast = useRef(null);
  const cargaInicialRealizada = useRef(false);
  const { usuario: sesion, puede } = useAuth();

  const [correlativos, setCorrelativos] = useState([]);
  const [cargandoCorrelativos, setCargandoCorrelativos] = useState(false);
  const [detalleCorrelativoId, setDetalleCorrelativoId] = useState(null);
  const [dialogoCorrelativoVisible, setDialogoCorrelativoVisible] = useState(false);
  const [guardandoCorrelativo, setGuardandoCorrelativo] = useState(false);
  const [formularioCorrelativo, setFormularioCorrelativo] = useState(crearFormularioCorrelativoInicial);
  const [erroresCorrelativo, setErroresCorrelativo] = useState({});

  const [usuarios, setUsuarios] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [paginaUsuarios, setPaginaUsuarios] = useState(0);
  const [filasUsuarios, setFilasUsuarios] = useState(20);
  const [roles, setRoles] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [dialogoUsuario, setDialogoUsuario] = useState(false);
  const [formUsuario, setFormUsuario] = useState(usuarioVacio);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [usuarioPassword, setUsuarioPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');

  const [gruposPermisos, setGruposPermisos] = useState([]);
  const [dialogoRol, setDialogoRol] = useState(false);
  const [formRol, setFormRol] = useState(rolVacio);
  const [guardandoRol, setGuardandoRol] = useState(false);

  const [auditoria, setAuditoria] = useState([]);
  const [totalAuditoria, setTotalAuditoria] = useState(0);
  const [paginaAuditoria, setPaginaAuditoria] = useState(0);
  const [filtroAuditoria, setFiltroAuditoria] = useState({ tipo: '', actor: '' });
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);

  const notificarError = useCallback((error, respaldo) => {
    toast.current?.show({ severity: 'error', summary: 'No se pudo completar', detail: mensajeApi(error, respaldo), life: 5000 });
  }, []);

  const cargarCorrelativos = useCallback(async (mostrarError = true) => {
    if (!puede('CORRELATIVOS_VER')) return;
    setCargandoCorrelativos(true);
    try {
      setCorrelativos(await listarCorrelativos());
    } catch (error) {
      if (mostrarError) notificarError(error, 'No fue posible obtener los correlativos configurados.');
    } finally {
      setCargandoCorrelativos(false);
    }
  }, [notificarError, puede]);

  const cargarRoles = useCallback(async () => {
    if (!puede('ROLES_VER') && !puede('USUARIOS_VER')) return;
    try {
      setRoles(await rolesService.listar());
    } catch (error) {
      notificarError(error, 'No fue posible cargar los roles.');
    }
  }, [notificarError, puede]);

  const cargarUsuarios = useCallback(async (pagina = paginaUsuarios, filas = filasUsuarios) => {
    if (!puede('USUARIOS_VER')) return;
    setCargandoUsuarios(true);
    try {
      const datos = await usuariosService.listar({ page: pagina, size: filas });
      setUsuarios(datos.content || []);
      setTotalUsuarios(datos.totalElements || 0);
      setPaginaUsuarios(pagina);
      setFilasUsuarios(filas);
    } catch (error) {
      notificarError(error, 'No fue posible cargar los usuarios.');
    } finally {
      setCargandoUsuarios(false);
    }
  }, [filasUsuarios, notificarError, paginaUsuarios, puede]);

  const cargarPermisos = useCallback(async () => {
    if (!puede('ROLES_VER')) return;
    try {
      setGruposPermisos(await rolesService.permisos());
    } catch (error) {
      notificarError(error, 'No fue posible cargar la matriz de permisos.');
    }
  }, [notificarError, puede]);

  const cargarAuditoria = useCallback(async (pagina = 0) => {
    if (!puede('AUDITORIA_VER')) return;
    setCargandoAuditoria(true);
    try {
      const datos = await auditoriaService.listar({ page: pagina, size: 20, ...filtroAuditoria });
      setAuditoria(datos.content || []);
      setTotalAuditoria(datos.totalElements || 0);
      setPaginaAuditoria(pagina);
    } catch (error) {
      notificarError(error, 'No fue posible cargar la auditoría.');
    } finally {
      setCargandoAuditoria(false);
    }
  }, [filtroAuditoria, notificarError, puede]);

  useEffect(() => {
    if (cargaInicialRealizada.current) return;
    cargaInicialRealizada.current = true;
    queueMicrotask(() => {
      cargarCorrelativos();
      cargarRoles();
      cargarUsuarios();
      cargarPermisos();
      cargarAuditoria(0);
    });
  }, [cargarCorrelativos, cargarRoles, cargarUsuarios, cargarPermisos, cargarAuditoria]);

  const abrirNuevoCorrelativo = () => {
    setFormularioCorrelativo(crearFormularioCorrelativoInicial());
    setErroresCorrelativo({});
    setDialogoCorrelativoVisible(true);
  };

  const abrirEdicionCorrelativo = async (fila) => {
    setDetalleCorrelativoId(fila.id);
    try {
      setFormularioCorrelativo(convertirCorrelativoAFormulario(await obtenerCorrelativo(fila.id)));
      setErroresCorrelativo({});
      setDialogoCorrelativoVisible(true);
    } catch (error) {
      notificarError(error, 'No fue posible obtener el correlativo.');
    } finally {
      setDetalleCorrelativoId(null);
    }
  };

  const cambiarCampoCorrelativo = (campo, valor) => {
    setFormularioCorrelativo((actual) => ({ ...actual, [campo]: valor }));
    setErroresCorrelativo((actual) => ({ ...actual, [campo]: undefined }));
  };

  const guardarCorrelativo = async (evento) => {
    evento.preventDefault();
    const esEdicion = formularioCorrelativo.id !== null;
    const errores = validarFormularioCorrelativo(formularioCorrelativo, esEdicion);
    if (Object.keys(errores).length) return setErroresCorrelativo(errores);
    setGuardandoCorrelativo(true);
    try {
      if (esEdicion) {
        await actualizarUltimoCorrelativo(formularioCorrelativo.id, Number(formularioCorrelativo.ultimoValor));
      } else {
        await registrarCorrelativo(construirSolicitudCorrelativo(formularioCorrelativo));
      }
      await cargarCorrelativos(false);
      setDialogoCorrelativoVisible(false);
      toast.current?.show({ severity: 'success', summary: esEdicion ? 'Correlativo actualizado' : 'Correlativo registrado', life: 3000 });
    } catch (error) {
      notificarError(error, 'No fue posible guardar el correlativo.');
    } finally {
      setGuardandoCorrelativo(false);
    }
  };

  const abrirUsuario = (fila = null) => {
    setFormUsuario(fila ? {
      id: fila.id, nombreUsuario: fila.nombreUsuario, correo: fila.correo,
      contrasena: '', rolId: fila.rol?.id,
    } : { ...usuarioVacio, rolId: roles.find((rol) => rol.nombre === 'VENDEDOR')?.id || roles[0]?.id });
    setDialogoUsuario(true);
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();
    setGuardandoUsuario(true);
    try {
      const datos = { nombreUsuario: formUsuario.nombreUsuario.trim(), correo: formUsuario.correo.trim(), rolId: formUsuario.rolId };
      if (formUsuario.id) await usuariosService.editar(formUsuario.id, datos);
      else await usuariosService.crear({ ...datos, contrasena: formUsuario.contrasena });
      await cargarUsuarios();
      await cargarRoles();
      setDialogoUsuario(false);
      toast.current?.show({ severity: 'success', summary: formUsuario.id ? 'Usuario actualizado' : 'Usuario creado', life: 3000 });
    } catch (error) {
      notificarError(error, 'No fue posible guardar el usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const cambiarEstadoUsuario = async (fila) => {
    try {
      await usuariosService.cambiarEstado(fila.id, !fila.habilitado);
      await cargarUsuarios();
      toast.current?.show({ severity: 'success', summary: fila.habilitado ? 'Usuario deshabilitado' : 'Usuario habilitado', life: 3000 });
    } catch (error) {
      notificarError(error, 'No fue posible cambiar el estado.');
    }
  };

  const restablecerPassword = async (evento) => {
    evento.preventDefault();
    try {
      await usuariosService.restablecerContrasena(usuarioPassword.id, nuevaPassword);
      setUsuarioPassword(null);
      setNuevaPassword('');
      toast.current?.show({ severity: 'success', summary: 'Contraseña restablecida', detail: 'Las sesiones anteriores quedaron revocadas.', life: 3500 });
    } catch (error) {
      notificarError(error, 'No fue posible restablecer la contraseña.');
    }
  };

  const abrirRol = (rol = null) => {
    setFormRol(rol ? { ...rol, permisos: new Set(rol.permisos || []) } : { ...rolVacio, permisos: new Set() });
    setDialogoRol(true);
  };

  const alternarPermiso = (codigo, modulo, seleccionado) => {
    if (!formRol.editable) return;
    setFormRol((actual) => {
      const permisos = new Set(actual.permisos);
      if (seleccionado) {
        permisos.add(codigo);
        if (!codigo.endsWith('_VER')) permisos.add(`${modulo}_VER`);
      } else {
        permisos.delete(codigo);
        if (codigo.endsWith('_VER')) {
          [...permisos].filter((item) => item.startsWith(`${modulo}_`)).forEach((item) => permisos.delete(item));
        }
      }
      return { ...actual, permisos };
    });
  };

  const guardarRol = async (evento) => {
    evento.preventDefault();
    setGuardandoRol(true);
    try {
      const datos = { nombre: formRol.nombre, descripcion: formRol.descripcion, permisos: [...formRol.permisos] };
      if (formRol.id) await rolesService.editar(formRol.id, datos);
      else await rolesService.crear(datos);
      await cargarRoles();
      setDialogoRol(false);
      toast.current?.show({ severity: 'success', summary: 'Rol guardado', detail: 'Las sesiones afectadas fueron revocadas.', life: 3500 });
    } catch (error) {
      notificarError(error, 'No fue posible guardar el rol.');
    } finally {
      setGuardandoRol(false);
    }
  };

  const eliminarRol = async (rol) => {
    try {
      await rolesService.eliminar(rol.id);
      await cargarRoles();
      toast.current?.show({ severity: 'success', summary: 'Rol eliminado', life: 3000 });
    } catch (error) {
      notificarError(error, 'Solo pueden eliminarse roles personalizados sin usuarios.');
    }
  };

  const opcionesRoles = useMemo(() => roles.map((rol) => ({ label: rol.nombre, value: rol.id })), [roles]);
  const permisosReservados = (codigo) => codigo.startsWith('USUARIOS_') || codigo.startsWith('ROLES_') || codigo === 'AUDITORIA_VER';

  const accionesUsuario = (fila) => puede('USUARIOS_EDITAR') ? (
    <div className="flex gap-1 flex-wrap">
      <Button icon="pi pi-pencil" aria-label={`Editar usuario ${fila.nombreUsuario}`} text rounded tooltip="Editar" onClick={() => abrirUsuario(fila)} />
      <Button icon="pi pi-key" text rounded severity="secondary" tooltip="Restablecer contraseña" onClick={() => { setUsuarioPassword(fila); setNuevaPassword(''); }} />
      <Button icon={fila.habilitado ? 'pi pi-ban' : 'pi pi-check'} text rounded severity={fila.habilitado ? 'danger' : 'success'}
        tooltip={fila.habilitado ? 'Deshabilitar' : 'Habilitar'} disabled={fila.id === sesion?.id} onClick={() => cambiarEstadoUsuario(fila)} />
    </div>
  ) : null;

  const accionesRol = (rol) => (
    <div className="flex gap-1">
      <Button icon={rol.editable ? 'pi pi-pencil' : 'pi pi-eye'} text rounded tooltip={rol.editable ? 'Editar' : 'Ver'} onClick={() => abrirRol(rol)} />
      {puede('ROLES_ELIMINAR') && !rol.sistema && rol.usuarios === 0 && (
        <Button icon="pi pi-trash" text rounded severity="danger" tooltip="Eliminar" onClick={() => eliminarRol(rol)} />
      )}
    </div>
  );

  return (
    <div className="p-3 md:p-4 premium-fade-in control-sistema">
      <Toast ref={toast} position="top-right" />
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0 premium-page-header">Control y parámetros del sistema</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Configure series DTE y administre accesos con permisos claros por módulo.</p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs">
          {puede('CORRELATIVOS_VER') && (
            <TabPanel header="Correlativos DTE" leftIcon="pi pi-hashtag">
              <div className="pt-3">
                <div className="correlativos-toolbar mb-3">
                  <div>
                    <h3 className="text-xl font-bold m-0">Series configuradas</h3>
                    <p className="text-sm mt-1 mb-0" style={{ color: 'var(--text-muted)' }}>El incremento ocurre únicamente al emitir un DTE.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap correlativos-toolbar-actions">
                    <Button icon="pi pi-refresh" label="Actualizar" outlined onClick={() => cargarCorrelativos()} loading={cargandoCorrelativos} />
                    {puede('CORRELATIVOS_CREAR') && <Button icon="pi pi-plus" label="Nuevo correlativo" className="premium-btn" onClick={abrirNuevoCorrelativo} />}
                  </div>
                </div>
                <DataTable value={correlativos} loading={cargandoCorrelativos} size="small" paginator rows={10}
                  emptyMessage="No hay correlativos configurados" className="premium-table correlativos-table" scrollable>
                  <Column field="tipoDte" header="Tipo DTE" body={(fila) => <strong>{obtenerEtiquetaTipoDte(fila.tipoDte)}</strong>} />
                  <Column field="ambiente" header="Ambiente" body={(fila) => <Tag value={obtenerEtiquetaAmbiente(fila.ambiente)} severity={fila.ambiente === '01' ? 'warning' : 'info'} />} />
                  <Column field="anio" header="Año" />
                  <Column field="codEstable" header="Establecimiento" />
                  <Column field="codPuntoVenta" header="Punto de venta" />
                  <Column field="ultimoValor" header="Último utilizado" body={(fila) => <span className="correlativo-numero">{formatearCorrelativoDte(fila.ultimoValor)}</span>} />
                  {puede('CORRELATIVOS_EDITAR') && <Column header="Acciones" body={(fila) => <Button icon="pi pi-pencil" label="Editar" size="small" outlined loading={detalleCorrelativoId === fila.id} onClick={() => abrirEdicionCorrelativo(fila)} />} />}
                </DataTable>
              </div>
            </TabPanel>
          )}

          {puede('USUARIOS_VER') && (
            <TabPanel header="Usuarios" leftIcon="pi pi-users">
              <div className="pt-3">
                <div className="flex justify-content-between align-items-start gap-3 mb-3 flex-wrap">
                  <div><h3 className="text-xl font-bold m-0">Cuentas del sistema</h3><p className="text-sm mt-1 mb-0" style={{ color: 'var(--text-muted)' }}>Cada persona tiene un único rol. Las cuentas se deshabilitan; no se eliminan.</p></div>
                  {puede('USUARIOS_CREAR') && <Button icon="pi pi-user-plus" label="Nuevo usuario" className="premium-btn" onClick={() => abrirUsuario()} />}
                </div>
                <DataTable value={usuarios} loading={cargandoUsuarios} lazy paginator first={paginaUsuarios * filasUsuarios} rows={filasUsuarios} totalRecords={totalUsuarios} rowsPerPageOptions={[10, 20, 50, 100]} onPage={(e) => cargarUsuarios(e.page, e.rows)} size="small" className="premium-table" emptyMessage="No hay usuarios">
                  <Column field="nombreUsuario" header="Usuario" body={(fila) => <div><strong>{fila.nombreUsuario}</strong>{fila.id === sesion?.id && <small className="block text-primary">Sesión actual</small>}</div>} />
                  <Column field="correo" header="Correo" />
                  <Column header="Rol" body={(fila) => <Tag value={fila.rol?.nombre || 'Sin rol'} severity="info" />} />
                  <Column header="Estado" body={(fila) => <Tag value={fila.bloqueado ? 'Bloqueado' : fila.habilitado ? 'Activo' : 'Inactivo'} severity={fila.bloqueado ? 'warning' : fila.habilitado ? 'success' : 'danger'} />} />
                  {puede('USUARIOS_EDITAR') && <Column header="Acciones" body={accionesUsuario} />}
                </DataTable>
              </div>
            </TabPanel>
          )}

          {puede('ROLES_VER') && (
            <TabPanel header="Roles y permisos" leftIcon="pi pi-shield">
              <div className="pt-3">
                <div className="flex justify-content-between align-items-start gap-3 mb-3 flex-wrap">
                  <div><h3 className="text-xl font-bold m-0">Roles del sistema</h3><p className="text-sm mt-1 mb-0" style={{ color: 'var(--text-muted)' }}>Editar, crear o eliminar activa automáticamente el permiso para ver.</p></div>
                  {puede('ROLES_CREAR') && <Button icon="pi pi-plus" label="Nuevo rol" className="premium-btn" onClick={() => abrirRol()} />}
                </div>
                <DataTable value={roles} size="small" className="premium-table" emptyMessage="No hay roles">
                  <Column field="nombre" header="Rol" body={(rol) => <div><strong>{rol.nombre}</strong>{rol.nombre === 'ADMIN' && <small className="block text-primary">Protegido</small>}</div>} />
                  <Column field="descripcion" header="Descripción" />
                  <Column field="usuarios" header="Usuarios" />
                  <Column header="Permisos" body={(rol) => <Tag value={`${rol.permisos?.length || 0} asignados`} severity="info" />} />
                  <Column header="Acciones" body={accionesRol} />
                </DataTable>
              </div>
            </TabPanel>
          )}

          {puede('AUDITORIA_VER') && (
            <TabPanel header="Auditoría" leftIcon="pi pi-history">
              <div className="pt-3">
                <div className="flex gap-2 align-items-end flex-wrap mb-3">
                  <div><label className="premium-label block mb-1">Evento</label><InputText value={filtroAuditoria.tipo} onChange={(e) => setFiltroAuditoria((f) => ({ ...f, tipo: e.target.value }))} placeholder="Ej. LOGIN" /></div>
                  <div><label className="premium-label block mb-1">Actor</label><InputText value={filtroAuditoria.actor} onChange={(e) => setFiltroAuditoria((f) => ({ ...f, actor: e.target.value }))} placeholder="Usuario" /></div>
                  <Button icon="pi pi-search" label="Filtrar" onClick={() => cargarAuditoria(0)} />
                </div>
                <DataTable value={auditoria} loading={cargandoAuditoria} lazy paginator rows={20} totalRecords={totalAuditoria}
                  first={paginaAuditoria * 20} onPage={(e) => cargarAuditoria(e.page)} size="small" className="premium-table" emptyMessage="No hay eventos">
                  <Column field="creadoEn" header="Fecha" body={(fila) => new Date(fila.creadoEn).toLocaleString('es-SV')} />
                  <Column field="tipo" header="Evento" body={(fila) => <strong>{fila.tipo}</strong>} />
                  <Column field="resultado" header="Resultado" body={(fila) => <Tag value={fila.resultado} severity={fila.resultado === 'EXITO' ? 'success' : 'warning'} />} />
                  <Column field="actor" header="Actor" />
                  <Column field="objetivo" header="Objetivo" />
                  <Column field="ip" header="IP" />
                  <Column field="detalle" header="Detalle" />
                </DataTable>
              </div>
            </TabPanel>
          )}
        </TabView>
      </div>

      <Dialog visible={dialogoCorrelativoVisible} onHide={() => !guardandoCorrelativo && setDialogoCorrelativoVisible(false)}
        header={formularioCorrelativo.id ? 'Editar correlativo DTE' : 'Registrar correlativo DTE'} style={{ width: '620px', maxWidth: 'calc(100vw - 1rem)' }} className="correlativo-dialog" draggable={false}>
        <form onSubmit={guardarCorrelativo} className="grid pt-2 correlativo-form">
          {!formularioCorrelativo.id && <>
            <div className="col-12 md:col-7"><label className="premium-label block mb-2">Tipo DTE</label><Dropdown value={formularioCorrelativo.tipoDte} options={TIPOS_DTE_CORRELATIVO} onChange={(e) => cambiarCampoCorrelativo('tipoDte', e.value)} editable className="w-full" />{erroresCorrelativo.tipoDte && <small className="p-error">{erroresCorrelativo.tipoDte}</small>}</div>
            <div className="col-12 md:col-5"><label className="premium-label block mb-2">Ambiente</label><Dropdown value={formularioCorrelativo.ambiente} options={AMBIENTES_CORRELATIVO} onChange={(e) => cambiarCampoCorrelativo('ambiente', e.value)} className="w-full" /></div>
            <div className="col-12 md:col-4"><label className="premium-label block mb-2">Año</label><InputNumber value={formularioCorrelativo.anio} onValueChange={(e) => cambiarCampoCorrelativo('anio', e.value)} useGrouping={false} min={2000} max={2100} className="w-full" /></div>
            <div className="col-12 md:col-4"><label className="premium-label block mb-2">Establecimiento</label><InputText value={formularioCorrelativo.codEstable} onChange={(e) => cambiarCampoCorrelativo('codEstable', e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase())} maxLength={4} className="w-full" /></div>
            <div className="col-12 md:col-4"><label className="premium-label block mb-2">Punto de venta</label><InputText value={formularioCorrelativo.codPuntoVenta} onChange={(e) => cambiarCampoCorrelativo('codPuntoVenta', e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase())} maxLength={4} className="w-full" /></div>
          </>}
          <div className="col-12"><label className="premium-label block mb-2">Último valor utilizado</label><InputNumber value={formularioCorrelativo.ultimoValor} onValueChange={(e) => cambiarCampoCorrelativo('ultimoValor', e.value)} useGrouping={false} min={0} max={MAXIMO_CORRELATIVO_DTE} className="w-full" />{erroresCorrelativo.ultimoValor && <small className="p-error">{erroresCorrelativo.ultimoValor}</small>}</div>
          <div className="col-12"><Message severity="info" text="Esta pantalla solo registra o edita la serie. El siguiente número se consume al emitir el DTE." className="w-full" /></div>
          <div className="col-12 flex justify-content-end gap-2"><Button type="button" label="Cancelar" text onClick={() => setDialogoCorrelativoVisible(false)} /><Button type="submit" label="Guardar" icon="pi pi-check" loading={guardandoCorrelativo} /></div>
        </form>
      </Dialog>

      <Dialog visible={dialogoUsuario} onHide={() => !guardandoUsuario && setDialogoUsuario(false)} header={formUsuario.id ? 'Editar usuario' : 'Nuevo usuario'} style={{ width: '520px', maxWidth: 'calc(100vw - 1rem)' }} draggable={false}>
        <form onSubmit={guardarUsuario} className="p-fluid flex flex-column gap-3 pt-2">
          <div><label className="premium-label block mb-2">Nombre de usuario</label><InputText value={formUsuario.nombreUsuario} onChange={(e) => setFormUsuario((f) => ({ ...f, nombreUsuario: e.target.value }))} required minLength={3} /></div>
          <div><label className="premium-label block mb-2">Correo</label><InputText type="email" value={formUsuario.correo} onChange={(e) => setFormUsuario((f) => ({ ...f, correo: e.target.value }))} required /></div>
          {!formUsuario.id && <div><label className="premium-label block mb-2">Contraseña inicial</label><Password value={formUsuario.contrasena} onChange={(e) => setFormUsuario((f) => ({ ...f, contrasena: e.target.value }))} toggleMask feedback required minLength={10} /></div>}
          <div><label className="premium-label block mb-2">Rol único</label><Dropdown value={formUsuario.rolId} options={opcionesRoles} onChange={(e) => setFormUsuario((f) => ({ ...f, rolId: e.value }))} placeholder="Seleccione un rol" required /></div>
          <small style={{ color: 'var(--text-muted)' }}>La contraseña requiere al menos 10 caracteres, una letra y un número.</small>
          <div className="flex justify-content-end gap-2"><Button type="button" label="Cancelar" text onClick={() => setDialogoUsuario(false)} /><Button type="submit" label="Guardar usuario" icon="pi pi-check" loading={guardandoUsuario} /></div>
        </form>
      </Dialog>

      <Dialog visible={Boolean(usuarioPassword)} onHide={() => setUsuarioPassword(null)} header={`Restablecer contraseña · ${usuarioPassword?.nombreUsuario || ''}`} style={{ width: '460px', maxWidth: 'calc(100vw - 1rem)' }} draggable={false}>
        <form onSubmit={restablecerPassword} className="p-fluid flex flex-column gap-3 pt-2">
          <Message severity="warn" text="La cuenta deberá iniciar sesión nuevamente en todos sus dispositivos." />
          <Password value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Nueva contraseña" toggleMask feedback required minLength={10} />
          <div className="flex justify-content-end gap-2"><Button type="button" label="Cancelar" text onClick={() => setUsuarioPassword(null)} /><Button type="submit" label="Restablecer" icon="pi pi-key" /></div>
        </form>
      </Dialog>

      <Dialog visible={dialogoRol} onHide={() => !guardandoRol && setDialogoRol(false)} header={formRol.id ? `Rol · ${formRol.nombre}` : 'Nuevo rol'} style={{ width: '780px', maxWidth: 'calc(100vw - 1rem)' }} draggable={false}>
        <form onSubmit={guardarRol} className="pt-2">
          <div className="grid">
            <div className="col-12 md:col-5"><label className="premium-label block mb-2">Código del rol</label><InputText value={formRol.nombre} onChange={(e) => setFormRol((f) => ({ ...f, nombre: e.target.value }))} disabled={formRol.sistema} required className="w-full" /></div>
            <div className="col-12 md:col-7"><label className="premium-label block mb-2">Descripción</label><InputText value={formRol.descripcion || ''} onChange={(e) => setFormRol((f) => ({ ...f, descripcion: e.target.value }))} disabled={!formRol.editable} className="w-full" /></div>
          </div>
          {!formRol.editable && <Message severity="info" text="Administrador siempre tiene todos los permisos y no puede modificarse." className="w-full my-3" />}
          <div className="permission-matrix mt-3">
            {gruposPermisos.map((grupo) => (
              <section className="permission-module" key={grupo.modulo}>
                <h4>{grupo.etiqueta}</h4>
                <div className="permission-actions">
                  {grupo.permisos.map((permiso) => {
                    const reservado = permisosReservados(permiso.codigo) && formRol.nombre !== 'ADMIN';
                    return <label key={permiso.codigo} className={`permission-option ${reservado ? 'is-reserved' : ''}`}>
                      <Checkbox checked={formRol.permisos.has(permiso.codigo)} onChange={(e) => alternarPermiso(permiso.codigo, grupo.modulo, e.checked)} disabled={!formRol.editable || reservado} />
                      <span><strong>{permiso.accion.replaceAll('_', ' ')}</strong><small>{permiso.etiqueta}</small></span>
                    </label>;
                  })}
                </div>
              </section>
            ))}
          </div>
          <div className="flex justify-content-end gap-2 mt-4"><Button type="button" label="Cerrar" text onClick={() => setDialogoRol(false)} />{formRol.editable && puede(formRol.id ? 'ROLES_EDITAR' : 'ROLES_CREAR') && <Button type="submit" label="Guardar rol" icon="pi pi-check" loading={guardandoRol} />}</div>
        </form>
      </Dialog>
    </div>
  );
}
