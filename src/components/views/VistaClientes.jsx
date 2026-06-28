import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';

// Importar cliente Axios para la API real
import api from '../../services/api';

// Tipos de documento
const TIPO_DOC_OPCIONES = [
  { label: 'DUI (Documento Único de Identidad)', value: 13 },
  { label: 'NIT (Número de Identificación Tributaria)', value: 36 },
  { label: 'Pasaporte', value: 3 },
  { label: 'Carnet de Residente', value: 2 },
  { label: 'Otro / Extranjero', value: 37 }
];

const MAPA_DOCUMENTOS = {
  13: 'DUI',
  36: 'NIT',
  3: 'Pasaporte',
  2: 'Carnet Residente',
  37: 'Otro/Extranjero'
};

// Datos de prueba
const DISTRITOS_SIMULADOS = [
  { id: 1, nombre: 'San Salvador (San Salvador Centro)' },
  { id: 2, nombre: 'Antiguo Cuscatlán (La Libertad Este)' },
  { id: 3, nombre: 'Santa Ana (Santa Ana Centro)' },
  { id: 4, nombre: 'San Miguel (San Miguel Centro)' },
  { id: 5, nombre: 'Santa Tecla (La Libertad Sur)' }
];

const ACTIVIDADES_SIMULADAS = [
  { id: 1, codActividad: '620100', descActividad: 'Desarrollo de Software y Aplicaciones' },
  { id: 2, codActividad: '620200', descActividad: 'Consultoría e Intermediación Informática' },
  { id: 3, codActividad: '47002', descActividad: 'Venta de otros productos ncp' },
  { id: 4, codActividad: '731000', descActividad: 'Servicios de Publicidad y Relaciones Públicas' }
];

export default function VistaClientes() {
  const toast = useRef(null);
  const [indiceTabActivo, setIndiceTabActivo] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [distritos, setDistritos] = useState(DISTRITOS_SIMULADOS);
  const [actividades, setActividades] = useState(ACTIVIDADES_SIMULADAS);

  // Clientes de ejemplo
  const [clientes, setClientes] = useState([
    {
      id: 1,
      tipoDocumento: 13,
      numDocumento: '06012435-9',
      nrc: '254120-3',
      nombre: 'Distribuidora Alimentos',
      apellidos: 'S.A. de C.V.',
      nombreComercial: 'DistAlimentos',
      telefono: '2234-5678',
      correo: 'contacto@distalimentos.com.sv',
      granContribuyente: true,
      activo: true,
      complementoDireccion: 'Paseo General Escalón #3500, San Salvador',
      distrito_id: 1,
      actividadEconomica_id: 3,
      distrito: { id: 1, nombre: 'San Salvador' },
      actividadEconomica: { id: 3, codActividad: '47002', descActividad: 'Venta de otros productos ncp' }
    },
    {
      id: 2,
      tipoDocumento: 13,
      numDocumento: '01234567-8',
      nrc: '',
      nombre: 'Juan Carlos',
      apellidos: 'Pérez',
      nombreComercial: 'Consultores Pérez',
      telefono: '7123-4567',
      correo: 'juan.perez@gmail.com',
      granContribuyente: false,
      activo: true,
      complementoDireccion: 'Colonia Flor Blanca, Calle El Progreso #45',
      distrito_id: 2,
      actividadEconomica_id: 2,
      distrito: { id: 2, nombre: 'Antiguo Cuscatlán' },
      actividadEconomica: { id: 2, codActividad: '620200', descActividad: 'Consultoría e Intermediación Informática' }
    }
  ]);

  // Estado del formulario
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    apellidos: '',
    nombreComercial: '',
    tipoDocumento: 13,
    numDocumento: '',
    nrc: '',
    telefono: '',
    correo: '',
    granContribuyente: false,
    activo: true,
    complementoDireccion: '',
    distrito_id: 1,
    actividadEconomica_id: 1
  });

  // Descomentar para conectar con la API
  /*
  useEffect(() => {
    const cargarDatosAPI = async () => {
      setCargando(true);
      try {
        // 1. Obtener listado de distritos desde el API
        const respuestaDistritos = await api.get('/distritos');
        setDistritos(respuestaDistritos.data || []);

        // 2. Obtener listado de actividades económicas desde el API
        const respuestaActividades = await api.get('/ActividadEconomicas');
        setActividades(respuestaActividades.data || []);

        // 3. Obtener listado de clientes registrados
        const respuestaClientes = await api.get('/Clientes');
        setClientes(respuestaClientes.data || []);

        toast.current.show({ 
          severity: 'success', 
          summary: 'Sincronizado', 
          detail: 'Datos sincronizados con el servidor exitosamente.', 
          life: 3000 
        });
      } catch (error) {
        console.error("Error al sincronizar con la API:", error);
        toast.current.show({ 
          severity: 'error', 
          summary: 'Error de Sincronización', 
          detail: 'No se pudieron descargar los catálogos o los clientes del servidor.', 
          life: 4000 
        });
      } finally {
        setCargando(false);
      }
    };
    cargarDatosAPI();
  }, []);
  */

  const resetearFormulario = () => {
    setDatosFormulario({
      nombre: '',
      apellidos: '',
      nombreComercial: '',
      tipoDocumento: 13,
      numDocumento: '',
      nrc: '',
      telefono: '',
      correo: '',
      granContribuyente: false,
      activo: true,
      complementoDireccion: '',
      distrito_id: 1,
      actividadEconomica_id: 1
    });
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (!datosFormulario.nombre.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Validación', detail: 'El nombre o razón social es requerido.', life: 3000 });
      return;
    }

    setCargando(true);

    try {
      // Descomentar para guardar en la API
      /*
      const respuesta = await api.post('/Clientes', datosFormulario); 
      
      const clienteGuardado = respuesta.data;
      setClientes(prev => [...prev, clienteGuardado]);
      toast.current.show({ 
        severity: 'success', 
        summary: 'Registrado', 
        detail: `Cliente guardado con ID ${clienteGuardado.id || 'N/A'} en la base de datos.`, 
        life: 3000 
      });
      */

      // Simulación local (comentar al conectar API)
      const nuevoId = Math.floor(Math.random() * 900) + 100;
      
      const distritoSeleccionado = distritos.find(d => d.id === datosFormulario.distrito_id);
      const actividadSeleccionada = actividades.find(a => a.id === datosFormulario.actividadEconomica_id);
      
      const nuevoClienteSimulado = {
        ...datosFormulario,
        id: nuevoId,
        distrito: distritoSeleccionado ? {
          id: distritoSeleccionado.id,
          nombre: distritoSeleccionado.nombre || distritoSeleccionado.Nombre
        } : null,
        actividadEconomica: actividadSeleccionada ? {
          id: actividadSeleccionada.id,
          codActividad: actividadSeleccionada.codActividad || actividadSeleccionada.CodActividad,
          descActividad: actividadSeleccionada.descActividad || actividadSeleccionada.DescActividad
        } : null
      };

      setClientes(prev => [...prev, nuevoClienteSimulado]);
      toast.current.show({ 
        severity: 'success', 
        summary: 'Guardado', 
        detail: `Cliente registrado localmente con ID temporal ${nuevoId}.`, 
        life: 3000 
      });
      // -----------------------------------------------------------

      resetearFormulario();
      setIndiceTabActivo(1); // Cambiar a la pestaña de Clientes Registrados
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      toast.current.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error.response?.data?.message || 'Error de conexión con la API.', 
        life: 4000 
      });
    } finally {
      setCargando(false);
    }
  };

  // Templates para la tabla
  const documentoTemplate = (rowData) => {
    const tipoDoc = rowData.tipoDocumento || rowData.TipoDocumento || 13;
    const numDoc = rowData.numDocumento || rowData.NumDocumento || 'S/N';
    const tipo = MAPA_DOCUMENTOS[tipoDoc] || 'Otro';
    return (
      <div className="flex flex-column">
        <span className="font-semibold text-sm">{numDoc}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tipo} ({tipoDoc})</span>
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    const nombre = rowData.nombre || rowData.Nombre || '';
    const apellidos = rowData.apellidos || rowData.Apellidos || '';
    const nombreComercial = rowData.nombreComercial || rowData.NombreComercial || '';
    const apellidosStr = apellidos ? ` ${apellidos}` : '';
    return (
      <div className="flex flex-column">
        <span className="font-semibold text-sm text-900">{nombre}{apellidosStr}</span>
        {nombreComercial && (
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Comercial: {nombreComercial}
          </span>
        )}
      </div>
    );
  };

  const localizacionTemplate = (rowData) => {
    const distrito = rowData.distrito || rowData.Distrito;
    const distritoId = rowData.distrito_id || rowData.Distrito_id || rowData.distritoId || rowData.DistritoId;
    const complemento = rowData.complementoDireccion || rowData.ComplementoDireccion || 'Sin dirección';
    const distritoNombre = distrito?.nombre || distrito?.Nombre || distritos.find(d => d.id === distritoId)?.nombre || 'Desconocido';
    return (
      <div className="flex flex-column" style={{ maxWidth: '220px' }}>
        <span className="text-xs font-semibold">{distritoNombre}</span>
        <span className="text-xs text-truncate overflow-hidden white-space-nowrap" style={{ color: 'var(--text-muted)' }} title={complemento}>
          {complemento}
        </span>
      </div>
    );
  };

  const actividadTemplate = (rowData) => {
    const actividad = rowData.actividadEconomica || rowData.ActividadEconomica;
    const actividadId = rowData.actividadEconomica_id || rowData.ActividadEconomica_id || rowData.actividadEconomicaId || rowData.ActividadEconomicaId;
    
    const actividadObj = actividad || actividades.find(a => a.id === actividadId);
    const actividadDesc = actividadObj?.descActividad || actividadObj?.DescActividad || 'Desconocido';
    const codigo = actividadObj?.codActividad || actividadObj?.CodActividad || '';
    
    return (
      <div className="flex flex-column">
        <span className="text-xs font-semibold">{actividadDesc}</span>
        <span className="text-xs text-500" style={{ color: 'var(--text-muted)' }}>Cód: {codigo}</span>
      </div>
    );
  };

  const contribuyenteTemplate = (rowData) => {
    const granContribuyente = rowData.granContribuyente !== undefined ? rowData.granContribuyente : rowData.GranContribuyente;
    const isGranContribuyente = granContribuyente || false;
    const nrc = rowData.nrc || rowData.Nrc || '';
    return (
      <div className="flex flex-column align-items-center">
        {isGranContribuyente ? 
          <Tag value="Gran Contribuyente" severity="warning" style={{ fontSize: '10px' }} /> :
          <Tag value="Estándar" severity="info" style={{ fontSize: '10px' }} />
        }
        {nrc && <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>NRC: {nrc}</span>}
      </div>
    );
  };

  const estadoTemplate = (rowData) => {
    const activo = rowData.activo !== undefined ? rowData.activo : rowData.Activo;
    const estaActivo = activo !== undefined ? activo : true;
    return (
      <Tag 
        value={estaActivo ? "Activo" : "Inactivo"} 
        severity={estaActivo ? "success" : "danger"} 
        style={{ fontSize: '10px' }} 
      />
    );
  };

  return (
    <div className="p-4 premium-fade-in">
      <Toast ref={toast} />

      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Gestión de Clientes
        </h2>
        <p className="mt-1 m-0" style={{ color: 'var(--text-muted)' }}>
          Registra nuevos clientes y gestiona el catálogo de cuentas de facturación del sistema.
        </p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs" activeIndex={indiceTabActivo} onTabChange={(e) => setIndiceTabActivo(e.index)}>
          
          <TabPanel header="Registrar Cliente" leftIcon="pi pi-user-plus" headerClassName="mr-2">
            <div className="pt-3" style={{ maxWidth: '850px', margin: '0 auto' }}>
              <form onSubmit={manejarEnvio} className="p-fluid flex flex-column gap-4">
                
                {/* 1. Sección Identificación Tributaria */}
                <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
                  <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="pi pi-id-card text-primary"></i> 1. Datos fiscales
                  </h3>
                  <div className="grid">
                    <div className="col-12 md:col-6 flex flex-column gap-2">
                      <label htmlFor="tipoDocumento" className="font-bold text-xs text-800">Tipo de Documento</label>
                      <Dropdown 
                        id="tipoDocumento" 
                        value={datosFormulario.tipoDocumento} 
                        options={TIPO_DOC_OPCIONES} 
                        onChange={(e) => setDatosFormulario({ ...datosFormulario, tipoDocumento: e.value })} 
                      />
                    </div>
                    <div className="col-12 md:col-6 flex flex-column gap-2">
                      <label htmlFor="numDocumento" className="font-bold text-xs text-800">Número de Documento</label>
                      <div className="premium-input-group">
                        <i className="pi pi-hashtag premium-input-icon"></i>
                        <InputText 
                          id="numDocumento" 
                          value={datosFormulario.numDocumento} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, numDocumento: e.target.value })} 
                          placeholder={datosFormulario.tipoDocumento === 13 ? "Ej. 01234567-8" : "Ej. 0614-200595-101-5"} 
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                      <label htmlFor="nrc" className="font-bold text-xs text-800">NRC (Registro de Contribuyente)</label>
                      <div className="premium-input-group">
                        <i className="pi pi-percentage premium-input-icon"></i>
                        <InputText 
                          id="nrc" 
                          value={datosFormulario.nrc} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, nrc: e.target.value })} 
                          placeholder="Ej. 123456-7" 
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6 flex align-items-center justify-content-between mt-3 p-2 bg-transparent">
                      <div className="flex flex-column">
                        <span className="font-bold text-xs text-800">¿Gran Contribuyente?</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Activa retención del 1% del IVA</span>
                      </div>
                      <InputSwitch 
                        checked={datosFormulario.granContribuyente} 
                        onChange={(e) => setDatosFormulario({ ...datosFormulario, granContribuyente: e.value })} 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Sección Información del Cliente */}
                <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
                  <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="pi pi-user text-primary"></i> 2. Razón Social o Nombre Completo
                  </h3>
                  <div className="flex flex-column gap-3">
                    <div className="flex flex-column gap-2">
                      <label htmlFor="nombre" className="font-bold text-xs text-800">Nombre / Razón Social <span className="text-red-500">*</span></label>
                      <div className="premium-input-group">
                        <i className="pi pi-user premium-input-icon"></i>
                        <InputText 
                          id="nombre" 
                          value={datosFormulario.nombre} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, nombre: e.target.value })} 
                          placeholder="Nombre comercial o social de la persona jurídica/natural" 
                          required 
                        />
                      </div>
                    </div>
                    <div className="grid">
                      <div className="col-12 md:col-6 flex flex-column gap-2">
                        <label htmlFor="apellidos" className="font-bold text-xs text-800">Apellidos (Opcional)</label>
                        <div className="premium-input-group">
                          <i className="pi pi-users premium-input-icon"></i>
                          <InputText 
                            id="apellidos" 
                            value={datosFormulario.apellidos} 
                            onChange={(e) => setDatosFormulario({ ...datosFormulario, apellidos: e.target.value })} 
                            placeholder="Apellidos para personas naturales" 
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6 flex flex-column gap-2">
                        <label htmlFor="nombreComercial" className="font-bold text-xs text-800">Nombre Comercial (Opcional)</label>
                        <div className="premium-input-group">
                          <i className="pi pi-briefcase premium-input-icon"></i>
                          <InputText 
                            id="nombreComercial" 
                            value={datosFormulario.nombreComercial} 
                            onChange={(e) => setDatosFormulario({ ...datosFormulario, nombreComercial: e.target.value })} 
                            placeholder="Nombre público del establecimiento" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Sección Contacto y Ubicación */}
                <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
                  <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="pi pi-map-marker text-primary"></i> 3. Dirección, Contacto y Actividad Comercial
                  </h3>
                  <div className="grid">
                    <div className="col-12 md:col-6 flex flex-column gap-2">
                      <label htmlFor="telefono" className="font-bold text-xs text-800">Teléfono</label>
                      <div className="premium-input-group">
                        <i className="pi pi-phone premium-input-icon"></i>
                        <InputText 
                          id="telefono" 
                          value={datosFormulario.telefono} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, telefono: e.target.value })} 
                          placeholder="Ej. +503 2222-3333" 
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6 flex flex-column gap-2">
                      <label htmlFor="correo" className="font-bold text-xs text-800">Correo Electrónico</label>
                      <div className="premium-input-group">
                        <i className="pi pi-envelope premium-input-icon"></i>
                        <InputText 
                          id="correo" 
                          type="email"
                          value={datosFormulario.correo} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, correo: e.target.value })} 
                          placeholder="correo@ejemplo.com" 
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                      <label htmlFor="distrito_id" className="font-bold text-xs text-800">Distrito</label>
                      <Dropdown 
                        id="distrito_id" 
                        value={datosFormulario.distrito_id} 
                        options={distritos.map(d => ({ label: d.nombre || d.Nombre || '', value: d.id }))} 
                        onChange={(e) => setDatosFormulario({ ...datosFormulario, distrito_id: e.value })} 
                      />
                    </div>
                    <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                      <label htmlFor="actividadEconomica_id" className="font-bold text-xs text-800">Actividad Económica</label>
                      <Dropdown 
                        id="actividadEconomica_id" 
                        value={datosFormulario.actividadEconomica_id} 
                        options={actividades.map(a => ({ label: `${a.codActividad || a.CodActividad || ''} - ${a.descActividad || a.DescActividad || ''}`, value: a.id }))} 
                        onChange={(e) => setDatosFormulario({ ...datosFormulario, actividadEconomica_id: e.value })} 
                      />
                    </div>
                    <div className="col-12 flex flex-column gap-2 mt-2">
                      <label htmlFor="complementoDireccion" className="font-bold text-xs text-800">Dirección (Complemento de Dirección)</label>
                      <div className="premium-input-group">
                        <i className="pi pi-compass premium-input-icon"></i>
                        <InputText 
                          id="complementoDireccion" 
                          value={datosFormulario.complementoDireccion} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, complementoDireccion: e.target.value })} 
                          placeholder="Calle, avenida, pasaje, número de casa, colonia..." 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Switch de Estado Activo */}
                <div className="flex align-items-center justify-content-between p-2">
                  <div className="flex flex-column">
                    <span className="font-bold text-sm text-800">Estado del Cliente</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Los clientes inactivos no aparecerán en el POS</span>
                  </div>
                  <InputSwitch 
                    checked={datosFormulario.activo} 
                    onChange={(e) => setDatosFormulario({ ...datosFormulario, activo: e.value })} 
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-3 justify-content-end mt-2">
                  <Button 
                    type="button" 
                    label="Limpiar Campos" 
                    icon="pi pi-refresh" 
                    className="p-button-outlined p-button-secondary" 
                    style={{ width: '170px' }}
                    onClick={resetearFormulario}
                    disabled={cargando}
                  />
                  <Button 
                    type="submit" 
                    label={cargando ? "Guardando..." : "Guardar Cliente"} 
                    icon={cargando ? "pi pi-spin pi-spinner" : "pi pi-save"} 
                    className="premium-btn" 
                    style={{ width: '220px' }}
                    disabled={cargando}
                  />
                </div>

              </form>
            </div>
          </TabPanel>

          <TabPanel header="Clientes Registrados" leftIcon="pi pi-users">
            <div className="pt-2">
              <div className="mb-3 flex align-items-center justify-content-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Total de registros en base de datos: {clientes.length}
                </span>
              </div>
              
              <div className="premium-table">
                <DataTable 
                  value={clientes} 
                  paginator 
                  rows={10} 
                  loading={cargando}
                  size="small" 
                  emptyMessage="No se encontraron registros de clientes" 
                  responsiveLayout="scroll"
                  className="p-datatable-sm"
                >
                  <Column header="ID" field="id" sortable style={{ width: '70px' }}></Column>
                  <Column header="DUI/NIT" body={documentoTemplate} sortable></Column>
                  <Column header="Cliente / Razón Social" body={clienteTemplate} sortable></Column>
                  <Column header="Ubicación" body={localizacionTemplate}></Column>
                  <Column header="Actividad Económica" body={actividadTemplate}></Column>
                  <Column header="Contribuyente" body={contribuyenteTemplate} style={{ width: '160px' }}></Column>
                  <Column header="Estado" body={estadoTemplate} style={{ width: '100px' }} className="text-center"></Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>

        </TabView>
      </div>
    </div>
  );
}