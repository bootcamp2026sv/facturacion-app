import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';

export default function VistaClientes() {
  const [clientes, setClientes] = useState([
    { id: 1, nitDui: '0614-150882-101-1', nombre: 'Distribuidora Alimentos S.A. de C.V.', correo: 'contacto@distalimentos.com.sv', telefono: '+503 2234-5678', direccion: 'Paseo General Escalón #3500, San Salvador' },
    { id: 2, nitDui: '01234567-8', nombre: 'Juan Carlos Pérez', correo: 'juan.perez@gmail.com', telefono: '+503 7123-4567', direccion: 'Colonia Flor Blanca, Calle El Progreso #45, San Salvador' }
  ]);

  const [datosFormulario, setDatosFormulario] = useState({
    nitDui: '',
    nombre: '',
    correo: '',
    telefono: '',
    direccion: ''
  });

  const [indiceTabActivo, setIndiceTabActivo] = useState(0);

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    if (!datosFormulario.nitDui || !datosFormulario.nombre || !datosFormulario.correo) return;

    const nuevoCliente = {
      id: Date.now(),
      ...datosFormulario
    };

    setClientes([...clientes, nuevoCliente]);
    setDatosFormulario({ nitDui: '', nombre: '', correo: '', telefono: '', direccion: '' });
    
    setIndiceTabActivo(1);
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Registrar Clientes</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Módulo maqueta para gestión de cuentas de clientes y facturación.</p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs" activeIndex={indiceTabActivo} onTabChange={(e) => setIndiceTabActivo(e.index)}>
          
          <TabPanel header="Registrar Cliente" leftIcon="pi pi-user-plus" headerClassName="mr-2">
            <div className="pt-2 p-fluid" style={{ maxWidth: '600px' }}>
              <form onSubmit={manejarEnvio} className="flex flex-column gap-4">
                <div className="flex flex-column gap-2">
                  <label htmlFor="nitDui" className="font-bold text-sm text-900">NIT / DUI</label>
                  <div className="premium-input-group">
                    <i className="pi pi-id-card premium-input-icon"></i>
                    <InputText 
                      id="nitDui" 
                      value={datosFormulario.nitDui} 
                      onChange={(e) => setDatosFormulario({...datosFormulario, nitDui: e.target.value})} 
                      placeholder="Ej. 0614-150882-101-1 o 01234567-8" 
                      required 
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label htmlFor="nombre" className="font-bold text-sm text-900">Nombre o Razón Social</label>
                  <div className="premium-input-group">
                    <i className="pi pi-user premium-input-icon"></i>
                    <InputText 
                      id="nombre" 
                      value={datosFormulario.nombre} 
                      onChange={(e) => setDatosFormulario({...datosFormulario, nombre: e.target.value})} 
                      placeholder="Ej. Juan Pérez S.A. de C.V." 
                      required 
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label htmlFor="correo" className="font-bold text-sm text-900">Correo Electrónico</label>
                  <div className="premium-input-group">
                    <i className="pi pi-envelope premium-input-icon"></i>
                    <InputText 
                      id="correo" 
                      type="email"
                      value={datosFormulario.correo} 
                      onChange={(e) => setDatosFormulario({...datosFormulario, correo: e.target.value})} 
                      placeholder="Ej. cliente@empresa.com.sv" 
                      required 
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label htmlFor="telefono" className="font-bold text-sm text-900">Teléfono</label>
                  <div className="premium-input-group">
                    <i className="pi pi-phone premium-input-icon"></i>
                    <InputText 
                      id="telefono" 
                      value={datosFormulario.telefono} 
                      onChange={(e) => setDatosFormulario({...datosFormulario, telefono: e.target.value})} 
                      placeholder="Ej. +503 2255-1234" 
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label htmlFor="direccion" className="font-bold text-sm text-900">Dirección</label>
                  <div className="premium-input-group">
                    <i className="pi pi-map-marker premium-input-icon"></i>
                    <InputText 
                      id="direccion" 
                      value={datosFormulario.direccion} 
                      onChange={(e) => setDatosFormulario({...datosFormulario, direccion: e.target.value})} 
                      placeholder="Ej. Col. Escalón, San Salvador" 
                    />
                  </div>
                </div>

                <Button type="submit" label="Registrar Cliente" icon="pi pi-user-plus" className="premium-btn" style={{ width: '200px' }} />
              </form>
            </div>
          </TabPanel>

          <TabPanel header="Clientes Registrados" leftIcon="pi pi-users">
            <div className="pt-2 premium-table">
              <DataTable value={clientes} paginator rows={5} size="small" emptyMessage="No hay clientes registrados" responsiveLayout="scroll">
                <Column field="nitDui" header="NIT / DUI" sortable bodyClassName="font-bold"></Column>
                <Column field="nombre" header="Nombre" sortable></Column>
                <Column field="correo" header="Correo"></Column>
                <Column field="telefono" header="Teléfono"></Column>
                <Column field="direccion" header="Dirección"></Column>
              </DataTable>
            </div>
          </TabPanel>

        </TabView>
      </div>
    </div>
  );
}