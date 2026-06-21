import React, { useState, useEffect, useRef } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';

// Importar cliente Axios para la API real
import api from '../../services/api';

// Helper para corregir la inversión de columnas de Código y Nombre en la BD del backend
const corregirCasingYInversion = (rowData) => {
  if (!rowData) return { codigo: '', nombre: '' };
  const rawCodigo = rowData.codigo || rowData.Codigo || '';
  const rawNombre = rowData.nombre || rowData.Nombre || '';
  
  const esNumero = (val) => /^\d+$/.test(String(val).replace(/[-]/g, '').trim());
  
  // Si el código es largo y contiene letras, y el nombre es numérico o muy corto, asumimos que están invertidos en la BD
  if (rawCodigo.length > 3 && isNaN(Number(rawCodigo)) && (esNumero(rawNombre) || rawNombre.length <= 2)) {
    return { codigo: rawNombre, nombre: rawCodigo };
  }
  
  return { codigo: rawCodigo, nombre: rawNombre };
};

export default function VistaGeografia() {
  const toast = useRef(null);
  const [indiceTabActivo, setIndiceTabActivo] = useState(0);
  const [cargando, setCargando] = useState(false);

  // 1. Departamentos (Catálogo completo de los 14 departamentos de El Salvador)
  const [departamentos, setDepartamentos] = useState([
    { id: 1, codigo: '01', nombre: 'Ahuachapán', municipios: [] },
    { id: 2, codigo: '02', nombre: 'Santa Ana', municipios: [] },
    { id: 3, codigo: '03', nombre: 'Sonsonate', municipios: [] },
    { id: 4, codigo: '04', nombre: 'Chalatenango', municipios: [] },
    { id: 5, codigo: '05', nombre: 'La Libertad', municipios: [
      { id: 2, codigo: '02', nombre: 'La Libertad Este' },
      { id: 3, codigo: '03', nombre: 'La Libertad Sur' }
    ] },
    { id: 6, codigo: '06', nombre: 'San Salvador', municipios: [
      { id: 1, codigo: '01', nombre: 'San Salvador Centro' }
    ] },
    { id: 7, codigo: '07', nombre: 'Cuscatlán', municipios: [] },
    { id: 8, codigo: '08', nombre: 'La Paz', municipios: [] },
    { id: 9, codigo: '09', nombre: 'Cabañas', municipios: [] },
    { id: 10, codigo: '10', nombre: 'San Vicente', municipios: [] },
    { id: 11, codigo: '11', nombre: 'Usulután', municipios: [] },
    { id: 12, codigo: '12', nombre: 'San Miguel', municipios: [] },
    { id: 13, codigo: '13', nombre: 'Morazán', municipios: [] },
    { id: 14, codigo: '14', nombre: 'La Unión', municipios: [] }
  ]);

  // 2. Municipios (Datos de prueba con relaciones para lookup local)
  const [municipios, setMunicipios] = useState([
    { 
      id: 1, 
      codigo: '01', 
      nombre: 'San Salvador Centro', 
      departamentoId: 6,
      departamento: { id: 6, codigo: '06', nombre: 'San Salvador' },
      distritos: [
        { id: 1, codigo: '01', nombre: 'San Salvador' },
        { id: 2, codigo: '02', nombre: 'Mejicanos' }
      ]
    },
    { 
      id: 2, 
      codigo: '02', 
      nombre: 'La Libertad Este', 
      departamentoId: 5,
      departamento: { id: 5, codigo: '05', nombre: 'La Libertad' },
      distritos: [
        { id: 3, codigo: '03', nombre: 'Antiguo Cuscatlán' }
      ]
    },
    { 
      id: 3, 
      codigo: '03', 
      nombre: 'La Libertad Sur', 
      departamentoId: 5,
      departamento: { id: 5, codigo: '05', nombre: 'La Libertad' },
      distritos: [
        { id: 4, codigo: '04', nombre: 'Santa Tecla' }
      ]
    }
  ]);

  // 3. Distritos (Datos de prueba)
  const [distritos, setDistritos] = useState([
    { id: 1, codigo: '01', nombre: 'San Salvador', municipioId: 1, municipio: { id: 1, codigo: '01', nombre: 'San Salvador Centro' } },
    { id: 2, codigo: '02', nombre: 'Mejicanos', municipioId: 1, municipio: { id: 1, codigo: '01', nombre: 'San Salvador Centro' } },
    { id: 3, codigo: '03', nombre: 'Antiguo Cuscatlán', municipioId: 2, municipio: { id: 2, codigo: '02', nombre: 'La Libertad Este' } },
    { id: 4, codigo: '04', nombre: 'Santa Tecla', municipioId: 3, municipio: { id: 3, codigo: '03', nombre: 'La Libertad Sur' } }
  ]);

  // Estados de formularios individuales
  const [nuevoDepto, setNuevoDepto] = useState({ codigo: '', nombre: '' });
  const [nuevoMuni, setNuevoMuni] = useState({ codigo: '', nombre: '', departamentoId: 6 });
  const [nuevoDist, setNuevoDist] = useState({ codigo: '', nombre: '', municipioId: 1 });

  // --- EFECTO PARA CONECTAR A LA API EN PRODUCCIÓN ---
  // Para cargar datos reales de la base de datos, descomenta este bloque:
  /*
  useEffect(() => {
    const cargarGeografiaAPI = async () => {
      setCargando(true);

      // 1. Cargar Departamentos
      try {
        const resDeptos = await api.get('/departamentos');
        setDepartamentos(resDeptos.data || []);
      } catch (error) {
        console.error("Error al cargar departamentos:", error);
        toast.current.show({ 
          severity: 'error', 
          summary: 'Error Departamentos', 
          detail: 'No se pudieron cargar los departamentos desde el servidor.', 
          life: 3000 
        });
      }

      // 2. Cargar Municipios
      try {
        const resMunis = await api.get('/municipios');
        setMunicipios(resMunis.data || []);
      } catch (error) {
        console.error("Error al cargar municipios:", error);
      }

      // 3. Cargar Distritos
      try {
        const resDists = await api.get('/distritos');
        setDistritos(resDists.data || []);
      } catch (error) {
        console.error("Error al cargar distritos:", error);
      }

      setCargando(false);
    };

    cargarGeografiaAPI();
  }, []);
  */
  

  // Mapeos para Dropdowns del formulario (corrige inversión y casing)
  const deptoOpciones = departamentos.map(d => {
    const corregido = corregirCasingYInversion(d);
    return { label: corregido.nombre, value: d.id };
  });
  const muniOpciones = municipios.map(m => {
    const corregido = corregirCasingYInversion(m);
    return { label: corregido.nombre, value: m.id };
  });

  // --- MÉTODOS DE REGISTRO ---

  // Guardar Departamento
  const guardarDepto = async (e) => {
    e.preventDefault();
    if (!nuevoDepto.codigo || !nuevoDepto.nombre) return;
    setCargando(true);

    try {
      // --- CONEXIÓN  A LA API ---
      // 
      /*
      const respuesta = await api.post('/departamentos', nuevoDepto);
      setDepartamentos(prev => [...prev, respuesta.data]);
      toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Departamento registrado en el sistema.', life: 3000 });
      */

      // --- SIMULACIÓN
      // Comentar en produccion
      const nuevoId = Date.now();
      const nuevoDeptoMock = { id: nuevoId, ...nuevoDepto };
      setDepartamentos(prev => [...prev, nuevoDeptoMock]);
      toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Departamento registrado localmente.', life: 3000 });
      // -----------------------------------------------------------

      setNuevoDepto({ codigo: '', nombre: '' });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el departamento.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  // Guardar Municipio
  const guardarMuni = async (e) => {
    e.preventDefault();
    if (!nuevoMuni.codigo || !nuevoMuni.nombre) return;
    setCargando(true);

    try {
      const deptoSeleccionado = departamentos.find(d => d.id === nuevoMuni.departamentoId);

      // --- CONEXIÓN A LA API ---
      // 
      /*
      const payload = {
        codigo: nuevoMuni.codigo,
        nombre: nuevoMuni.nombre,
        departamento: { id: nuevoMuni.departamentoId }
      };
      const respuesta = await api.post('/municipios', payload);
      setMunicipios(prev => [...prev, respuesta.data]);
      toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Municipio registrado en el sistema.', life: 3000 });
      */

      // --- SIMULACIÓN  ---
      // Comentar en produccion
      const nuevoId = Date.now();
      const nuevoMuniMock = { 
        id: nuevoId, 
        codigo: nuevoMuni.codigo, 
        nombre: nuevoMuni.nombre, 
        departamentoId: nuevoMuni.departamentoId,
        departamento: deptoSeleccionado,
        distritos: [] // Inicializar array para búsqueda inversa local
      };
      setMunicipios(prev => [...prev, nuevoMuniMock]);

      // Actualizar departamento para la búsqueda inversa local
      setDepartamentos(prev => prev.map(d => {
        if (d.id === nuevoMuni.departamentoId) {
          const listM = d.municipios || d.Municipios || [];
          return { ...d, municipios: [...listM, nuevoMuniMock] };
        }
        return d;
      }));

      toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Municipio registrado localmente.', life: 3000 });
      // -----------------------------------------------------------

      setNuevoMuni({ codigo: '', nombre: '', departamentoId: deptoOpciones[0]?.value || 1 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el municipio.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  // Guardar Distrito
  const guardarDist = async (e) => {
    e.preventDefault();
    if (!nuevoDist.codigo || !nuevoDist.nombre) return;
    setCargando(true);

    try {
      const muniSeleccionado = municipios.find(m => m.id === nuevoDist.municipioId);

      // --- CONEXIÓN A LA API ---
      // 
      /*
      const payload = {
        codigo: nuevoDist.codigo,
        nombre: nuevoDist.nombre,
        municipio: { id: nuevoDist.municipioId }
      };
      const respuesta = await api.post('/distritos', payload);
      setDistritos(prev => [...prev, respuesta.data]);
      toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Distrito registrado en el sistema.', life: 3000 });
      */

      // --- SIMULACIÓN ---
      // Comentar en produccion
      const nuevoId = Date.now();
      const nuevoDistMock = { 
        id: nuevoId, 
        codigo: nuevoDist.codigo, 
        nombre: nuevoDist.nombre, 
        municipioId: nuevoDist.municipioId,
        municipio: muniSeleccionado
      };
      setDistritos(prev => [...prev, nuevoDistMock]);

      // Actualizar municipio para la búsqueda inversa local
      setMunicipios(prev => prev.map(m => {
        if (m.id === nuevoDist.municipioId) {
          const listD = m.distritos || m.Distritos || [];
          return { ...m, distritos: [...listD, nuevoDistMock] };
        }
        return m;
      }));

      toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Distrito registrado localmente.', life: 3000 });
      // -----------------------------------------------------------

      setNuevoDist({ codigo: '', nombre: '', municipioId: muniOpciones[0]?.value || 1 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el distrito.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  // Renderizadores de columnas (resuelven relaciones y corrigen inversión)
  const deptoColumnTemplate = (rowData) => {
    // 1. Intentar lookup inverso por ID en el catálogo de departamentos de React
    const deptoEncontrado = departamentos.find(d => {
      const listaMunis = d.municipios || d.Municipios || [];
      return listaMunis.some(m => m.id === rowData.id);
    });
    
    if (deptoEncontrado) {
      return corregirCasingYInversion(deptoEncontrado).nombre;
    }

    // 2. Si no se encuentra, usar el objeto anidado
    const depto = rowData.departamento || rowData.Departamento;
    if (depto) {
      return corregirCasingYInversion(depto).nombre;
    }
    return rowData.departamentoNombre || 'Desconocido';
  };

  const muniColumnTemplate = (rowData) => {
    // 1. Intentar lookup inverso por ID en el catálogo de municipios de React
    const muniEncontrado = municipios.find(m => {
      const listaDists = m.distritos || m.Distritos || [];
      return listaDists.some(d => d.id === rowData.id);
    });
    
    if (muniEncontrado) {
      return corregirCasingYInversion(muniEncontrado).nombre;
    }

    // 2. Si no se encuentra, usar el objeto anidado
    const muni = rowData.municipio || rowData.Municipio;
    if (muni) {
      return corregirCasingYInversion(muni).nombre;
    }
    return rowData.municipioNombre || 'Desconocido';
  };

  return (
    <div className="p-4 premium-fade-in">
      <Toast ref={toast} />

      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Catálogo de departamentos, municipios y distritos
        </h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          
        </p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs" activeIndex={indiceTabActivo} onTabChange={(e) => setIndiceTabActivo(e.index)}>
          
          {/* TABS 1: DEPARTAMENTOS */}
          <TabPanel header="Departamentos" leftIcon="pi pi-map">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Añadir Departamento</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarDepto} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText value={nuevoDepto.codigo} onChange={(e) => setNuevoDepto({...nuevoDepto, codigo: e.target.value})} placeholder="Ej. 06" required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Departamento</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map premium-input-icon"></i>
                            <InputText value={nuevoDepto.nombre} onChange={(e) => setNuevoDepto({...nuevoDepto, nombre: e.target.value})} placeholder="Ej. San Salvador" required />
                          </div>
                        </div>
                        <Button type="submit" label="Registrar" icon="pi pi-plus" className="premium-btn mt-1" disabled={cargando} />
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={departamentos} size="small" paginator rows={10} loading={cargando} emptyMessage="No hay departamentos registrados">
                    <Column body={(rowData) => corregirCasingYInversion(rowData).codigo} header="Código MH" className="font-bold" style={{ width: '120px' }}></Column>
                    <Column body={(rowData) => corregirCasingYInversion(rowData).nombre} header="Departamento" sortable></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* TABS 2: MUNICIPIOS */}
          <TabPanel header="Municipios" leftIcon="pi pi-map-marker">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Añadir Municipio</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarMuni} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Departamento Padre</label>
                          <Dropdown value={nuevoMuni.departamentoId} options={deptoOpciones} onChange={(e) => setNuevoMuni({...nuevoMuni, departamentoId: e.value})} placeholder="Seleccione..." />
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText value={nuevoMuni.codigo} onChange={(e) => setNuevoMuni({...nuevoMuni, codigo: e.target.value})} placeholder="Ej. 01" required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Municipio</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map-marker premium-input-icon"></i>
                            <InputText value={nuevoMuni.nombre} onChange={(e) => setNuevoMuni({...nuevoMuni, nombre: e.target.value})} placeholder="Ej. San Salvador Centro" required />
                          </div>
                        </div>
                        <Button type="submit" label="Registrar" icon="pi pi-plus" className="premium-btn mt-1" disabled={cargando} />
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={municipios} size="small" paginator rows={10} loading={cargando} emptyMessage="No hay municipios registrados">
                    <Column body={(rowData) => corregirCasingYInversion(rowData).codigo} header="Código MH" className="font-bold" style={{ width: '120px' }}></Column>
                    <Column body={(rowData) => corregirCasingYInversion(rowData).nombre} header="Municipio" sortable></Column>
                    <Column body={deptoColumnTemplate} header="Departamento" sortable></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* TABS 3: DISTRITOS */}
          <TabPanel header="Distritos" leftIcon="pi pi-compass">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Añadir Distrito</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarDist} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Municipio Padre</label>
                          <Dropdown value={nuevoDist.municipioId} options={muniOpciones} onChange={(e) => setNuevoDist({...nuevoDist, municipioId: e.value})} placeholder="Seleccione..." />
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText value={nuevoDist.codigo} onChange={(e) => setNuevoDist({...nuevoDist, codigo: e.target.value})} placeholder="Ej. 02" required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Distrito</label>
                          <div className="premium-input-group">
                            <i className="pi pi-compass premium-input-icon"></i>
                            <InputText value={nuevoDist.nombre} onChange={(e) => setNuevoDist({...nuevoDist, nombre: e.target.value})} placeholder="Ej. Antiguo Cuscatlán" required />
                          </div>
                        </div>
                        <Button type="submit" label="Registrar" icon="pi pi-plus" className="premium-btn mt-1" disabled={cargando} />
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={distritos} size="small" paginator rows={10} loading={cargando} emptyMessage="No hay distritos registrados">
                    <Column body={(rowData) => corregirCasingYInversion(rowData).codigo} header="Código MH" className="font-bold" style={{ width: '120px' }}></Column>
                    <Column body={(rowData) => corregirCasingYInversion(rowData).nombre} header="Distrito" sortable></Column>
                    <Column body={muniColumnTemplate} header="Municipio" sortable></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </TabPanel>

        </TabView>
      </div>
    </div>
  );
}