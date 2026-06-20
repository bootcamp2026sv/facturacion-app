import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function VistaGeografia() {
  const [departamentos, setDepartamentos] = useState([
    { id: 1, codigo: '01', nombre: 'San Salvador' },
    { id: 2, codigo: '02', nombre: 'La Libertad' },
    { id: 3, codigo: '03', nombre: 'Santa Ana' }
  ]);

  const [municipios, setMunicipios] = useState([
    { id: 1, codigo: '01', nombre: 'San Salvador Centro', departamentoId: 1, departamentoNombre: 'San Salvador' },
    { id: 2, codigo: '02', nombre: 'La Libertad Este', departamentoId: 2, departamentoNombre: 'La Libertad' }
  ]);

  const [distritos, setDistritos] = useState([
    { id: 1, codigo: '01', nombre: 'San Salvador', municipioId: 1, municipioNombre: 'San Salvador Centro' },
    { id: 2, codigo: '02', nombre: 'Antiguo Cuscatlán', municipioId: 2, municipioNombre: 'La Libertad Este' }
  ]);

  const [nuevoDepto, setNuevoDepto] = useState({ codigo: '', nombre: '' });
  const [nuevoMuni, setNuevoMuni] = useState({ codigo: '', nombre: '', departamentoId: 1 });
  const [nuevoDist, setNuevoDist] = useState({ codigo: '', nombre: '', municipioId: 1 });

  const [indiceTabActivo, setIndiceTabActivo] = useState(0);

  const deptoOpciones = departamentos.map(d => ({ label: d.nombre, value: d.id }));
  const muniOpciones = municipios.map(m => ({ label: m.nombre, value: m.id }));

  const guardarDepto = (e) => {
    e.preventDefault();
    if (!nuevoDepto.codigo || !nuevoDepto.nombre) return;
    setDepartamentos([...departamentos, { id: Date.now(), ...nuevoDepto }]);
    setNuevoDepto({ codigo: '', nombre: '' });
  };

  const guardarMuni = (e) => {
    e.preventDefault();
    if (!nuevoMuni.codigo || !nuevoMuni.nombre) return;
    const depto = departamentos.find(d => d.id === nuevoMuni.departamentoId);
    setMunicipios([...municipios, { 
      id: Date.now(), 
      codigo: nuevoMuni.codigo, 
      nombre: nuevoMuni.nombre, 
      departamentoId: nuevoMuni.departamentoId,
      departamentoNombre: depto ? depto.nombre : 'Desconocido'
    }]);
    setNuevoMuni({ codigo: '', nombre: '', departamentoId: 1 });
  };

  const guardarDist = (e) => {
    e.preventDefault();
    if (!nuevoDist.codigo || !nuevoDist.nombre) return;
    const muni = municipios.find(m => m.id === nuevoDist.municipioId);
    setDistritos([...distritos, { 
      id: Date.now(), 
      codigo: nuevoDist.codigo, 
      nombre: nuevoDist.nombre, 
      municipioId: nuevoDist.municipioId,
      municipioNombre: muni ? muni.nombre : 'Desconocido'
    }]);
    setNuevoDist({ codigo: '', nombre: '', municipioId: 1 });
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Catálogo Geográfico (El Salvador)</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Estructura territorial del país homologada para la emisión de DTEs de exportación e internos.</p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs" activeIndex={indiceTabActivo} onTabChange={(e) => setIndiceTabActivo(e.index)}>
          
          <TabPanel header="Departamentos" leftIcon="pi pi-map">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Añadir Departamento</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarDepto} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText value={nuevoDepto.codigo} onChange={(e) => setNuevoDepto({...nuevoDepto, codigo: e.target.value})} placeholder="Ej. 01" required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Departamento</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map premium-input-icon"></i>
                            <InputText value={nuevoDepto.nombre} onChange={(e) => setNuevoDepto({...nuevoDepto, nombre: e.target.value})} placeholder="Ej. San Salvador" required />
                          </div>
                        </div>
                        <Button type="submit" label="Agregar Departamento" icon="pi pi-plus" className="premium-btn mt-1" />
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={departamentos} size="small" emptyMessage="No hay departamentos registrados">
                    <Column field="codigo" header="Código MH" className="font-bold"></Column>
                    <Column field="nombre" header="Departamento"></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Municipios" leftIcon="pi pi-map-marker">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Añadir Municipio</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarMuni} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Departamento Padre</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map premium-input-icon"></i>
                            <Dropdown value={nuevoMuni.departamentoId} options={deptoOpciones} onChange={(e) => setNuevoMuni({...nuevoMuni, departamentoId: e.value})} />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText value={nuevoMuni.codigo} onChange={(e) => setNuevoMuni({...nuevoMuni, codigo: e.target.value})} placeholder="Ej. 02" required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Municipio</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map-marker premium-input-icon"></i>
                            <InputText value={nuevoMuni.nombre} onChange={(e) => setNuevoMuni({...nuevoMuni, nombre: e.target.value})} placeholder="Ej. Santa Tecla" required />
                          </div>
                        </div>
                        <Button type="submit" label="Agregar Municipio" icon="pi pi-plus" className="premium-btn mt-1" />
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={municipios} size="small" emptyMessage="No hay municipios registrados">
                    <Column field="codigo" header="Código MH" className="font-bold"></Column>
                    <Column field="nombre" header="Municipio"></Column>
                    <Column field="departamentoNombre" header="Departamento"></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Distritos" leftIcon="pi pi-compass">
            <div className="grid pt-3">
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Añadir Distrito</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <form onSubmit={guardarDist} className="p-fluid flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Municipio Padre</label>
                          <div className="premium-input-group">
                            <i className="pi pi-map premium-input-icon"></i>
                            <Dropdown value={nuevoDist.municipioId} options={muniOpciones} onChange={(e) => setNuevoDist({...nuevoDist, municipioId: e.value})} />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Código Oficial (MH)</label>
                          <div className="premium-input-group">
                            <i className="pi pi-hashtag premium-input-icon"></i>
                            <InputText value={nuevoDist.codigo} onChange={(e) => setNuevoDist({...nuevoDist, codigo: e.target.value})} placeholder="Ej. 01" required />
                          </div>
                        </div>
                        <div className="flex flex-column gap-1">
                          <label className="premium-label">Nombre del Distrito</label>
                          <div className="premium-input-group">
                            <i className="pi pi-compass premium-input-icon"></i>
                            <InputText value={nuevoDist.nombre} onChange={(e) => setNuevoDist({...nuevoDist, nombre: e.target.value})} placeholder="Ej. San Salvador" required />
                          </div>
                        </div>
                        <Button type="submit" label="Agregar Distrito" icon="pi pi-plus" className="premium-btn mt-1" />
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={distritos} size="small" emptyMessage="No hay distritos registrados">
                    <Column field="codigo" header="Código MH" className="font-bold"></Column>
                    <Column field="nombre" header="Distrito"></Column>
                    <Column field="municipioNombre" header="Municipio"></Column>
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