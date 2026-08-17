import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';

// Importar cliente Axios para la API real
import api from '../../services/api';
import { obtenerErrorFormatoCliente, soloDigitos } from '../../utils/validacionesCliente';
import { useAuth } from '../../context/AuthContext';

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


export default function VistaClientes() {
  const { puede } = useAuth();
  const toast = useRef(null);
  const [indiceTabActivo, setIndiceTabActivo] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [distritos, setDistritos] = useState([]);
  const [actividades, setActividades] = useState([]);

  // Clientes de ejemplo
  const [clientes, setClientes] = useState([]);

  // Estados de filtros y búsqueda
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filtroGranContribuyente, setFiltroGranContribuyente] = useState('TODOS');
  const [filtroDistrito, setFiltroDistrito] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [filas, setFilas] = useState(20);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [orden, setOrden] = useState({ campo: 'nombre', direccion: 1 });
  const [recarga, setRecarga] = useState(0);

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
    actividadEconomica_id: null
  });

  const [editando, setEditando] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);

  const iniciarEdicion = (cliente) => {
    const distId = cliente.distrito?.id || cliente.distrito_id || cliente.distritoId || (distritos[0]?.id || 1);
    const actId = cliente.actividadEconomica?.id || cliente.actividadEconomica_id || cliente.actividadEconomicaId || null;
    setDatosFormulario({
      nombre: cliente.nombre || '',
      apellidos: cliente.apellidos || '',
      nombreComercial: cliente.nombreComercial || '',
      tipoDocumento: cliente.tipoDocumento || 13,
      numDocumento: soloDigitos(cliente.numDocumento || ''),
      nrc: soloDigitos(cliente.nrc || ''),
      telefono: soloDigitos(cliente.telefono || ''),
      correo: cliente.correo || '',
      granContribuyente: cliente.granContribuyente ?? false,
      activo: cliente.activo ?? true,
      complementoDireccion: cliente.complementoDireccion || '',
      distrito_id: distId,
      actividadEconomica_id: actId
    });
    setIdSeleccionado(cliente.id);
    setEditando(true);
    setIndiceTabActivo(0); // Cambiar a la pestaña de formulario
  };

  const cancelarEdicion = () => {
    resetearFormulario();
    setIdSeleccionado(null);
    setEditando(false);
    setIndiceTabActivo(1); // Volver a la pestaña del listado
  };

  const confirmarEliminarCliente = (cliente) => {
    setClienteAEliminar(cliente);
    setDialogoEliminarVisible(true);
  };

  const eliminarCliente = async () => {
    if (!clienteAEliminar) return;
    setCargando(true);
    try {
      await api.delete(`/Clientes/${clienteAEliminar.id}`);
      setRecarga((actual) => actual + 1);
      toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado correctamente.', life: 3000 });
      if (idSeleccionado === clienteAEliminar.id) {
        cancelarEdicion();
      }
      setDialogoEliminarVisible(false);
      setClienteAEliminar(null);
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el cliente.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  const plantillaAcciones = (rowData) => {
    return (
      <div className="flex gap-2 justify-content-center">
        {puede('CLIENTES_EDITAR') && <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => iniciarEdicion(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />}
        {puede('CLIENTES_ELIMINAR') && <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminarCliente(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />}
      </div>
    );
  };

  // Descomentar para conectar con la API
  
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    const cargarDatosAPI = async () => {
      setCargando(true);
      try {
        const [respuestaGeografia, respuestaActividades] = await Promise.all([
          api.get('/geografia'),
          api.get('/ActividadEconomicas')
        ]);
        setDistritos(respuestaGeografia.data?.distritos || []);
        setActividades(respuestaActividades.data || []);
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
        setCargandoInicial(false);
      }
    };
    cargarDatosAPI();
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const { data } = await api.get('/Clientes', {
          signal: controlador.signal,
          params: {
            page: pagina,
            size: filas,
            q: filtroGlobal.trim(),
            granContribuyente: filtroGranContribuyente === 'TODOS' ? undefined : filtroGranContribuyente === 'GC',
            distritoId: filtroDistrito || undefined,
            sortBy: orden.campo,
            sortDir: orden.direccion === 1 ? 'asc' : 'desc'
          }
        });
        setClientes(Array.isArray(data?.content) ? data.content : []);
        setTotalRegistros(Number(data?.totalElements || 0));
      } catch (error) {
        if (error.code === 'ERR_CANCELED') return;
        console.error('Error al cargar clientes:', error);
        setClientes([]);
        setTotalRegistros(0);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes.', life: 4000 });
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }, filtroGlobal ? 300 : 0);
    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [pagina, filas, filtroGlobal, filtroGranContribuyente, filtroDistrito, orden, recarga]);
  

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
      actividadEconomica_id: null
    });
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (!datosFormulario.nombre.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Validación', detail: 'El nombre o razón social es requerido.', life: 3000 });
      return;
    }

    const errorFormato = obtenerErrorFormatoCliente(datosFormulario);
    if (errorFormato) {
      toast.current.show({ severity: 'warn', summary: 'Validación', detail: errorFormato, life: 4000 });
      return;
    }

    setCargando(true);

    try {
      if (editando) {
        await api.put(`/Clientes/${idSeleccionado}`, datosFormulario);
        setRecarga((actual) => actual + 1);
        toast.current.show({ 
          severity: 'success', 
          summary: 'Actualizado', 
          detail: 'Cliente actualizado correctamente.', 
          life: 3000 
        });
        cancelarEdicion();
      } else {
        const respuesta = await api.post('/Clientes', datosFormulario); 
        const clienteGuardado = respuesta.data;
        setPagina(0);
        setRecarga((actual) => actual + 1);
        toast.current.show({ 
          severity: 'success', 
          summary: 'Registrado', 
          detail: `Cliente guardado con ID ${clienteGuardado.id || 'N/A'} en la base de datos.`, 
          life: 3000 
        });
        resetearFormulario();
        setIndiceTabActivo(1); // Cambiar a la pestaña de Clientes Registrados
      }
    } catch (error) {
      console.error("Error al registrar/actualizar cliente:", error);
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
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tipo}</span>
      </div>
    );
  };

  const clienteTemplate = (rowData) => {
    const nombre = rowData.nombre || rowData.Nombre || '';
    const apellidos = rowData.apellidos || rowData.Apellidos || '';
    const nombreComercial = rowData.nombreComercial || rowData.NombreComercial || '';
    const apellidosStr = apellidos ? ` ${apellidos}` : '';
    
    const granContribuyente = rowData.granContribuyente !== undefined ? rowData.granContribuyente : rowData.GranContribuyente;
    const isGranContribuyente = granContribuyente || false;
    const nrc = rowData.nrc || rowData.Nrc || '';

    return (
      <div className="flex flex-column">
        <div className="flex align-items-center gap-2">
          <span className="font-semibold text-sm text-900">{nombre}{apellidosStr}</span>
          {isGranContribuyente && (
            <Tag 
              value="GC" 
              severity="warning" 
              style={{ fontSize: '9px', padding: '1px 4px', lineHeight: '1' }} 
              tooltip="Gran Contribuyente" 
              tooltipOptions={{ position: 'top' }} 
            />
          )}
        </div>
        {(nombreComercial || nrc) && (
          <div className="flex flex-column gap-1 text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            {nombreComercial && <span>Comercial: {nombreComercial}</span>}
            {nrc && <span style={{ color: 'var(--text-muted)' }}>NRC: {nrc}</span>}
          </div>
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
        <span className="text-xs overflow-wrap-anywhere" style={{ color: 'var(--text-muted)' }} title={complemento}>
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

  const footerDialogoEliminar = (
    <div className="flex justify-content-end gap-2">
      <Button
        type="button"
        label="No"
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={() => setDialogoEliminarVisible(false)}
        disabled={cargando}
      />
      <Button
        type="button"
        label="Sí, Eliminar"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={eliminarCliente}
        loading={cargando}
      />
    </div>
  );

  const opcionesGC = [
    { label: 'Todos los Clientes', value: 'TODOS' },
    { label: 'Grandes Contribuyentes (GC)', value: 'GC' },
    { label: 'Contribuyentes Regulares', value: 'REGULAR' }
  ];

  const headerTabla = (
    <div className="flex flex-column gap-3 p-2">
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
        <h3 className="m-0 text-base font-bold" style={{ color: 'var(--text-primary)' }}>Listado de Clientes</h3>
        <span className="text-xs text-500" style={{ color: 'var(--text-muted)' }}>
          Mostrando {clientes.length} de {totalRegistros} registros
        </span>
      </div>
      <div className="grid">
        <div className="col-12 md:col-4">
          <div className="premium-input-group w-full">
            <i className="pi pi-search premium-input-icon"></i>
            <InputText
              type="search"
              value={filtroGlobal}
              onChange={(e) => { setFiltroGlobal(e.target.value); setPagina(0); }}
              placeholder="Buscar por nombre, DUI/NIT, correo..."
              className="w-full"
            />
          </div>
        </div>
        <div className="col-12 md:col-4">
          <Dropdown
            value={filtroGranContribuyente}
            options={opcionesGC}
            onChange={(e) => { setFiltroGranContribuyente(e.value); setPagina(0); }}
            placeholder="Clasificación Tributaria"
            className="w-full"
          />
        </div>
        <div className="col-12 md:col-4">
          <Dropdown
            value={filtroDistrito}
            options={[{ label: 'Todos los Distritos', value: null }, ...distritos.map(d => ({ label: d.nombre || d.Nombre || 'Distrito', value: d.id }))]}
            onChange={(e) => { setFiltroDistrito(e.value); setPagina(0); }}
            placeholder="Filtrar por Distrito"
            className="w-full"
            filter
            showClear
          />
        </div>
      </div>
    </div>
  );

  if (cargandoInicial) {
    return (
      <div className="p-4 premium-fade-in flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="premium-surface-card text-center p-6 flex flex-column align-items-center justify-content-center border-round-xl border-1 border-300 dark:border-slate-700" style={{ maxWidth: '400px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
          <i className="pi pi-spin pi-spinner text-primary text-5xl mb-4"></i>
          <h3 className="text-xl font-bold m-0 mb-2" style={{ color: 'var(--text-primary)' }}>Cargando Clientes</h3>
          <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>Obteniendo listado de clientes y catálogos geográficos...</p>
        </div>
      </div>
    );
  }

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
          
          <TabPanel visible={puede('CLIENTES_CREAR') || puede('CLIENTES_EDITAR')} header={editando ? "Editar Cliente" : "Registrar Cliente"} leftIcon={editando ? "pi pi-user-edit" : "pi pi-user-plus"} headerClassName="mr-2">
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
                      <label htmlFor="numDocumento" className="font-bold text-xs text-800">Número de Documento <span className="text-red-500">*</span></label>
                      <div className="premium-input-group">
                        <i className="pi pi-hashtag premium-input-icon"></i>
                        <InputText 
                          id="numDocumento" 
                          value={datosFormulario.numDocumento} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, numDocumento: soloDigitos(e.target.value).slice(0, 14) })}
                          inputMode="numeric"
                          maxLength={14}
                          placeholder={datosFormulario.tipoDocumento === 13 ? "Ej. 012345678" : "Ej. 06142005951015"}
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
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, nrc: soloDigitos(e.target.value) })}
                          inputMode="numeric"
                          placeholder="Ej. 1234567"
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
                      <label htmlFor="telefono" className="font-bold text-xs text-800">Teléfono <span className="text-red-500">*</span></label>
                      <div className="premium-input-group">
                        <i className="pi pi-phone premium-input-icon"></i>
                        <InputText 
                          id="telefono" 
                          value={datosFormulario.telefono} 
                          onChange={(e) => setDatosFormulario({ ...datosFormulario, telefono: soloDigitos(e.target.value) })}
                          inputMode="numeric"
                          placeholder="Ej. 22223333"
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
                        placeholder="Seleccione una actividad económica"
                        showClear
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
                <div className="flex gap-3 justify-content-end mt-2 clientes-form-actions">
                  {editando ? (
                    <Button 
                      type="button" 
                      label="Cancelar" 
                      icon="pi pi-times" 
                      className="p-button-outlined p-button-secondary" 
                      style={{ width: '170px' }}
                      onClick={cancelarEdicion}
                      disabled={cargando}
                    />
                  ) : (
                    <Button 
                      type="button" 
                      label="Limpiar Campos" 
                      icon="pi pi-refresh" 
                      className="p-button-outlined p-button-secondary" 
                      style={{ width: '170px' }}
                      onClick={resetearFormulario}
                      disabled={cargando}
                    />
                  )}
                  {(editando ? puede('CLIENTES_EDITAR') : puede('CLIENTES_CREAR')) && <Button
                    type="submit" 
                    label={cargando ? "Guardando..." : (editando ? "Guardar Cambios" : "Guardar Cliente")} 
                    icon={cargando ? "pi pi-spin pi-spinner" : (editando ? "pi pi-check" : "pi pi-save")} 
                    className="premium-btn" 
                    style={{ width: '220px' }}
                    disabled={cargando}
                  />}
                </div>

              </form>
            </div>
          </TabPanel>

          <TabPanel header="Clientes Registrados" leftIcon="pi pi-users">
            <div className="pt-2">
              <div className="premium-table">
                <DataTable 
                  value={clientes}
                  lazy
                  paginator 
                  first={pagina * filas}
                  rows={filas}
                  totalRecords={totalRegistros}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  onPage={(e) => { setPagina(e.page); setFilas(e.rows); }}
                  onSort={(e) => { setOrden({ campo: e.sortField, direccion: e.sortOrder }); setPagina(0); }}
                  sortField={orden.campo}
                  sortOrder={orden.direccion}
                  loading={cargando}
                  header={headerTabla}
                  size="small" 
                  emptyMessage="No se encontraron registros de clientes con los filtros aplicados" 
                  responsiveLayout="scroll"
                  className="p-datatable-sm"
                >
                  <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '70px' }} className="text-center"></Column>
                  <Column header="DUI/NIT" field="numDocumento" body={documentoTemplate} sortable></Column>
                  <Column header="Cliente / Razón Social" field="nombre" body={clienteTemplate} sortable></Column>
                  <Column header="Actividad Económica" field="actividadEconomica.descActividad" body={actividadTemplate}></Column>
                  <Column header="Ubicación" field="distrito.nombre" body={localizacionTemplate}></Column>
                  <Column header="Acciones" body={plantillaAcciones} exportable={false} style={{ width: '120px' }} className="text-center"></Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>

        </TabView>
      </div>

      <Dialog
        visible={dialogoEliminarVisible}
        style={{ width: '400px' }}
        header="Confirmar Eliminación"
        modal
        footer={footerDialogoEliminar}
        onHide={() => setDialogoEliminarVisible(false)}
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-red-500 text-3xl" />
          <span>¿Está seguro de que desea eliminar al cliente <b>{clienteAEliminar ? (clienteAEliminar.nombre + (clienteAEliminar.apellidos ? ' ' + clienteAEliminar.apellidos : '')) : ''}</b>?</span>
        </div>
      </Dialog>
    </div>
  );
}
