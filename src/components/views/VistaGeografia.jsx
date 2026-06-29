import React, { useState, useEffect, useRef } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

import api from '../../services/api';

// Corrige inversión de código y nombre en BD
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

  // Departamentos
  const [departamentos, setDepartamentos] = useState([]);

  // Municipios (lookup local)
  const [municipios, setMunicipios] = useState([]);

  // Distritos
  const [distritos, setDistritos] = useState([]);

  // Estados de formularios y edición
  const [nuevoDepto, setNuevoDepto] = useState({ codigo: '', nombre: '' });
  const [editandoDepto, setEditandoDepto] = useState(false);
  const [idDeptoSeleccionado, setIdDeptoSeleccionado] = useState(null);

  const [nuevoMuni, setNuevoMuni] = useState({ codigo: '', nombre: '', departamentoId: 0 });
  const [editandoMuni, setEditandoMuni] = useState(false);
  const [idMuniSeleccionado, setIdMuniSeleccionado] = useState(null);

  const [nuevoDist, setNuevoDist] = useState({ codigo: '', nombre: '', municipioId: 0 });
  const [editandoDist, setEditandoDist] = useState(false);
  const [idDistSeleccionado, setIdDistSeleccionado] = useState(null);

  // Estados para eliminación
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [tipoEliminacion, setTipoEliminacion] = useState(null); // 'depto', 'muni', 'dist'
  const [itemAEliminar, setItemAEliminar] = useState(null);

  // Descomentar para conectar con la API
  
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
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
  
  

  // Opciones para Dropdowns
  const deptoOpciones = departamentos.map(d => {
    const corregido = corregirCasingYInversion(d);
    return { label: corregido.nombre, value: d.id };
  });
  const muniOpciones = municipios.map(m => {
    const corregido = corregirCasingYInversion(m);
    return { label: corregido.nombre, value: m.id };
  });

  // --- MÉTODOS DE EDICIÓN Y CANCELACIÓN ---

  const iniciarEdicionDepto = (depto) => {
    const corregido = corregirCasingYInversion(depto);
    setNuevoDepto({
      codigo: corregido.codigo,
      nombre: corregido.nombre
    });
    setIdDeptoSeleccionado(depto.id);
    setEditandoDepto(true);
  };

  const cancelarEdicionDepto = () => {
    setNuevoDepto({ codigo: '', nombre: '' });
    setIdDeptoSeleccionado(null);
    setEditandoDepto(false);
  };

  const iniciarEdicionMuni = (muni) => {
    const corregido = corregirCasingYInversion(muni);
    const depto = muni.departamento || muni.Departamento;
    setNuevoMuni({
      codigo: corregido.codigo,
      nombre: corregido.nombre,
      departamentoId: depto?.id || (deptoOpciones[0]?.value || 0)
    });
    setIdMuniSeleccionado(muni.id);
    setEditandoMuni(true);
  };

  const cancelarEdicionMuni = () => {
    setNuevoMuni({ codigo: '', nombre: '', departamentoId: deptoOpciones[0]?.value || 0 });
    setIdMuniSeleccionado(null);
    setEditandoMuni(false);
  };

  const iniciarEdicionDist = (dist) => {
    const corregido = corregirCasingYInversion(dist);
    const muni = dist.municipio || dist.Municipio;
    setNuevoDist({
      codigo: corregido.codigo,
      nombre: corregido.nombre,
      municipioId: muni?.id || (muniOpciones[0]?.value || 0)
    });
    setIdDistSeleccionado(dist.id);
    setEditandoDist(true);
  };

  const cancelarEdicionDist = () => {
    setNuevoDist({ codigo: '', nombre: '', municipioId: muniOpciones[0]?.value || 0 });
    setIdDistSeleccionado(null);
    setEditandoDist(false);
  };

  // --- MÉTODOS DE ELIMINACIÓN ---

  const confirmarEliminar = (tipo, item) => {
    setTipoEliminacion(tipo);
    setItemAEliminar(item);
    setDialogoEliminarVisible(true);
  };

  const ejecutarEliminacion = async () => {
    if (!itemAEliminar || !tipoEliminacion) return;
    setCargando(true);
    try {
      if (tipoEliminacion === 'depto') {
        await api.delete(`/departamentos/${itemAEliminar.id}`);
        setDepartamentos(prev => prev.filter(d => d.id !== itemAEliminar.id));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Departamento eliminado correctamente.', life: 3000 });
        if (idDeptoSeleccionado === itemAEliminar.id) {
          cancelarEdicionDepto();
        }
      } else if (tipoEliminacion === 'muni') {
        await api.delete(`/municipios/${itemAEliminar.id}`);
        setMunicipios(prev => prev.filter(m => m.id !== itemAEliminar.id));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Municipio eliminado correctamente.', life: 3000 });
        if (idMuniSeleccionado === itemAEliminar.id) {
          cancelarEdicionMuni();
        }
      } else if (tipoEliminacion === 'dist') {
        await api.delete(`/distritos/${itemAEliminar.id}`);
        setDistritos(prev => prev.filter(d => d.id !== itemAEliminar.id));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Distrito eliminado correctamente.', life: 3000 });
        if (idDistSeleccionado === itemAEliminar.id) {
          cancelarEdicionDist();
        }
      }
      setDialogoEliminarVisible(false);
      setItemAEliminar(null);
      setTipoEliminacion(null);
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el elemento.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  const accionesDeptoTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => iniciarEdicionDepto(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminar('depto', rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const accionesMuniTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => iniciarEdicionMuni(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminar('muni', rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const accionesDistTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => iniciarEdicionDist(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminar('dist', rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  // --- MÉTODOS DE REGISTRO ---

  // Guardar Departamento
  const guardarDepto = async (e) => {
    e.preventDefault();
    if (!nuevoDepto.codigo || !nuevoDepto.nombre) return;
    setCargando(true);

    try {
      if (editandoDepto) {
        const respuesta = await api.put(`/departamentos/${idDeptoSeleccionado}`, nuevoDepto);
        setDepartamentos(prev => prev.map(d => d.id === idDeptoSeleccionado ? respuesta.data : d));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Departamento actualizado correctamente.', life: 3000 });
        cancelarEdicionDepto();
      } else {
        const respuesta = await api.post('/departamentos', nuevoDepto);
        setDepartamentos(prev => [...prev, respuesta.data]);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Departamento registrado en el sistema.', life: 3000 });
        setNuevoDepto({ codigo: '', nombre: '' });
      }
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
      const payload = {
        codigo: nuevoMuni.codigo,
        nombre: nuevoMuni.nombre,
        departamento: { 
          id: nuevoMuni.departamentoId 
        }
      };

      if (editandoMuni) {
        const respuesta = await api.put(`/municipios/${idMuniSeleccionado}`, payload);
        setMunicipios(prev => prev.map(m => m.id === idMuniSeleccionado ? respuesta.data : m));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Municipio actualizado correctamente.', life: 3000 });
        cancelarEdicionMuni();
      } else {
        const respuesta = await api.post('/municipios', payload);
        setMunicipios(prev => [...prev, respuesta.data]);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Municipio registrado en el sistema.', life: 3000 });
        
        // Actualizar departamento para búsqueda local
        setDepartamentos(prev => prev.map(d => {
          if (d.id === nuevoMuni.departamentoId) {
            const listM = d.municipios || d.Municipios || [];
            return { ...d, municipios: [...listM, respuesta.data] };
          }
          return d;
        }));

        setNuevoMuni({ codigo: '', nombre: '', departamentoId: deptoOpciones[0]?.value || 1 });
      }
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
      const payload = {
        codigo: nuevoDist.codigo,
        nombre: nuevoDist.nombre,
        municipio: { id: nuevoDist.municipioId }
      };

      if (editandoDist) {
        const respuesta = await api.put(`/distritos/${idDistSeleccionado}`, payload);
        setDistritos(prev => prev.map(d => d.id === idDistSeleccionado ? respuesta.data : d));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Distrito actualizado correctamente.', life: 3000 });
        cancelarEdicionDist();
      } else {
        const respuesta = await api.post('/distritos', payload);
        setDistritos(prev => [...prev, respuesta.data]);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Distrito registrado en el sistema.', life: 3000 });
        
        // Actualizar municipio para búsqueda local
        setMunicipios(prev => prev.map(m => {
          if (m.id === nuevoDist.municipioId) {
            const listD = m.distritos || m.Distritos || [];
            return { ...m, distritos: [...listD, respuesta.data] };
          }
          return m;
        }));

        setNuevoDist({ codigo: '', nombre: '', municipioId: muniOpciones[0]?.value || 1 });
      }
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
        onClick={ejecutarEliminacion}
        loading={cargando}
      />
    </div>
  );

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
          <TabPanel header="Departamentos " leftIcon="pi pi-map">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {editandoDepto ? 'Editar Departamento' : 'Añadir Departamento'}
                    </div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarDepto} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText 
                            value={nuevoDepto.codigo} 
                            onChange={(e) => setNuevoDepto({...nuevoDepto, codigo: e.target.value})} 
                            placeholder="Ej. 06" 
                            required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Departamento</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map premium-input-icon"></i>
                            <InputText 
                            value={nuevoDepto.nombre} 
                            onChange={(e) => setNuevoDepto({...nuevoDepto, nombre: e.target.value})} 
                            placeholder="Ej. San Salvador" required />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Button type="submit" label={editandoDepto ? "Guardar" : "Registrar"} icon={editandoDepto ? "pi pi-check" : "pi pi-plus"} className="premium-btn flex-grow-1" disabled={cargando} />
                          {editandoDepto && (
                            <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-secondary p-button-outlined" onClick={cancelarEdicionDepto} disabled={cargando} />
                          )}
                        </div>
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
                    <Column body={accionesDeptoTemplate} exportable={false} style={{ width: '120px' }}></Column>
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
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {editandoMuni ? 'Editar Municipio' : 'Añadir Municipio'}
                    </div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarMuni} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Departamento Padre</label>
                          <Dropdown 
                          value={nuevoMuni.departamentoId} 
                          options={deptoOpciones} 
                          onChange={(e) => setNuevoMuni({...nuevoMuni, departamentoId: e.value})} 
                          placeholder="Seleccione..." 
                          />
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText 
                            value={nuevoMuni.codigo} 
                            onChange={(e) => setNuevoMuni({...nuevoMuni, codigo: e.target.value})} 
                            placeholder="Ej. 01" required 
                            />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Municipio</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map-marker premium-input-icon"></i>
                            <InputText value={nuevoMuni.nombre} onChange={(e) => setNuevoMuni({...nuevoMuni, nombre: e.target.value})} placeholder="Ej. San Salvador Centro" required />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Button type="submit" label={editandoMuni ? "Guardar" : "Registrar"} icon={editandoMuni ? "pi pi-check" : "pi pi-plus"} className="premium-btn flex-grow-1" disabled={cargando} />
                          {editandoMuni && (
                            <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-secondary p-button-outlined" onClick={cancelarEdicionMuni} disabled={cargando} />
                          )}
                        </div>
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
                    <Column body={accionesMuniTemplate} exportable={false} style={{ width: '120px' }}></Column>
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
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {editandoDist ? 'Editar Distrito' : 'Añadir Distrito'}
                    </div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarDist} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Municipio Padre</label>
                          <Dropdown 
                          value={nuevoDist.municipioId} 
                          options={muniOpciones} 
                          onChange={(e) => setNuevoDist({...nuevoDist, municipioId: e.value})} 
                          placeholder="Seleccione..." 
                          />
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
                        <div className="flex gap-2 mt-1">
                          <Button type="submit" label={editandoDist ? "Guardar" : "Registrar"} icon={editandoDist ? "pi pi-check" : "pi pi-plus"} className="premium-btn flex-grow-1" disabled={cargando} />
                          {editandoDist && (
                            <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-secondary p-button-outlined" onClick={cancelarEdicionDist} disabled={cargando} />
                          )}
                        </div>
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
                    <Column body={accionesDistTemplate} exportable={false} style={{ width: '120px' }}></Column>
                  </DataTable>
                </div>
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
          <span>
            ¿Está seguro de que desea eliminar{' '}
            {tipoEliminacion === 'depto' && 'el departamento'}
            {tipoEliminacion === 'muni' && 'el municipio'}
            {tipoEliminacion === 'dist' && 'el distrito'}{' '}
            <b>{itemAEliminar ? corregirCasingYInversion(itemAEliminar).nombre : ''}</b>?
          </span>
        </div>
      </Dialog>
    </div>
  );
}