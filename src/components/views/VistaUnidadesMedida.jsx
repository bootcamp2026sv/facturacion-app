import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function VistaUnidadesMedida() {
  const [unidades, setUnidades] = useState([
    { id: 1, codigo: '01', nombre: 'metro' },
    { id: 2, codigo: '02', nombre: 'yarda' },
    { id: 3, codigo: '59', nombre: 'unidad' }
  ]);

  const [datosFormulario, setDatosFormulario] = useState({
    codigo: '',
    nombre: ''
  });

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    if (!datosFormulario.codigo || !datosFormulario.nombre) return;

    const nuevaUnidad = {
      id: Date.now(),
      ...datosFormulario
    };

    setUnidades([...unidades, nuevaUnidad]);
    setDatosFormulario({ codigo: '', nombre: '' });
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Unidades de Medida</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Módulo maqueta para definir las magnitudes físicas o comerciales de facturación.</p>
      </div>

      <div className="grid">
        
        <div className="col-12 md:col-4">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Nueva Unidad de Medida</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <form onSubmit={manejarEnvio} className="p-fluid flex flex-column gap-4">
                  <div className="flex flex-column gap-2">
                    <label htmlFor="codigo" className="font-bold text-sm text-900">Código</label>
                    <div className="premium-input-group">
                      <i className="pi pi-hashtag premium-input-icon"></i>
                      <InputText 
                        id="codigo" 
                        value={datosFormulario.codigo} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, codigo: e.target.value})} 
                        placeholder="Ej. kg, L, und, srv" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="nombre" className="font-bold text-sm text-900">Nombre</label>
                    <div className="premium-input-group">
                      <i className="pi pi-calculator premium-input-icon"></i>
                      <InputText 
                        id="nombre" 
                        value={datosFormulario.nombre} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, nombre: e.target.value})} 
                        placeholder="Ej. Kilogramo, Litro" 
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" label="Registrar Unidad" icon="pi pi-tag" className="premium-btn mt-1" />
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 md:col-8">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Unidades Registradas</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <div className="premium-table">
                  <DataTable value={unidades} paginator rows={5} size="small" emptyMessage="No hay unidades registradas" responsiveLayout="scroll">
                    <Column field="codigo" header="Código" sortable className="font-bold"></Column>
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