import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function VistaCodigosActividad() {
  const [codigosActividad, setCodigosActividad] = useState([
    { id: 1, codigo: '47002', nombre: 'Venta de otros productos ncp' },
    { id: 2, codigo: '620100', nombre: 'Desarrollo de Software y Aplicaciones' },
    { id: 3, codigo: '620200', nombre: 'Consultoría e Intermediación Informática' }
  ]);

  const [datosFormulario, setDatosFormulario] = useState({
    codigo: '',
    nombre: ''
  });

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    if (!datosFormulario.codigo || !datosFormulario.nombre) return;

    const nuevoCodigo = {
      id: Date.now(),
      ...datosFormulario
    };

    setCodigosActividad([...codigosActividad, nuevoCodigo]);
    setDatosFormulario({ codigo: '', nombre: '' });
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Códigos de Actividad Económica</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Módulo maqueta para clasificar actividades comerciales.</p>
      </div>

      <div className="grid">
        
        <div className="col-12 lg:col-4">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Nuevo Código de Actividad</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <form onSubmit={manejarEnvio} className="flex flex-column gap-4 p-fluid">
                  <div className="flex flex-column gap-2">
                    <label htmlFor="codigo" className="font-bold text-sm text-900">Código</label>
                    <div className="premium-input-group">
                      <i className="pi pi-hashtag premium-input-icon"></i>
                      <InputText 
                        id="codigo" 
                        value={datosFormulario.codigo} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, codigo: e.target.value})} 
                        placeholder="Ej. 620100" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="nombre" className="font-bold text-sm text-900">Nombre / Descripción</label>
                    <div className="premium-input-group">
                      <i className="pi pi-briefcase premium-input-icon"></i>
                      <InputText 
                        id="nombre" 
                        value={datosFormulario.nombre} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, nombre: e.target.value})} 
                        placeholder="Ej. Servicios de Consultoría en TI" 
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" label="Registrar Actividad" icon="pi pi-briefcase" className="premium-btn mt-1" />
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 lg:col-8">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Códigos Registrados</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <div className="premium-table">
                  <DataTable value={codigosActividad} paginator rows={5} size="small" emptyMessage="No hay códigos registrados" responsiveLayout="scroll">
                    <Column field="codigo" header="Código" sortable bodyClassName="font-bold"></Column>
                    <Column field="nombre" header="Nombre" sortable></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}