import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';

export default function VistaProductos() {
  const [productos, setProductos] = useState([
    { id: 1, codigo: 'PROD001', nombre: 'Laptop Pro 15', precio: 1200.00, stock: 15, unidad: 'Unidad', codigoImpuesto: '6201' },
    { id: 2, codigo: 'PROD002', nombre: 'Mouse Inalámbrico', precio: 25.50, stock: 120, unidad: 'Unidad', codigoImpuesto: '6201' },
    { id: 3, codigo: 'PROD003', nombre: 'Servicio Consultoría TI', precio: 85.00, stock: 999, unidad: 'Hora', codigoImpuesto: '6202' }
  ]);

  const [datosFormulario, setDatosFormulario] = useState({
    codigo: '',
    nombre: '',
    precio: null,
    stock: null,
    unidad: 'Unidad',
    codigoImpuesto: '6201'
  });

  const opcionesUnidades = [
    { label: 'Unidad (und)', value: 'Unidad' },
    { label: 'Hora (hr)', value: 'Hora' },
    { label: 'Kilogramo (kg)', value: 'Kilogramo' },
    { label: 'Servicio (srv)', value: 'Servicio' }
  ];

  const opcionesImpuestos = [
    { label: '6201 - Desarrollo de Software', value: '6201' },
    { label: '6202 - Consultoría Informática', value: '6202' },
    { label: '7020 - Administración Empresarial', value: '7020' }
  ];

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    if (!datosFormulario.codigo || !datosFormulario.nombre || !datosFormulario.precio) return;

    const nuevoProducto = {
      id: Date.now(),
      ...datosFormulario,
      precio: datosFormulario.precio || 0,
      stock: datosFormulario.stock || 0
    };

    setProductos([...productos, nuevoProducto]);
    setDatosFormulario({ codigo: '', nombre: '', precio: null, stock: null, unidad: 'Unidad', codigoImpuesto: '6201' });
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Registrar Productos</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Módulo maqueta para gestión de inventario y servicios.</p>
      </div>

      <div className="grid">
        
        {/* Formulario */}
        <div className="col-12 lg:col-4">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Nuevo Producto</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <form onSubmit={manejarEnvio} className="flex flex-column gap-4 p-fluid">
                  <div className="flex flex-column gap-2">
                    <label htmlFor="codigo" className="font-bold text-sm text-900">Código</label>
                    <div className="premium-input-group">
                      <i className="pi pi-tag premium-input-icon"></i>
                      <InputText 
                        id="codigo" 
                        value={datosFormulario.codigo} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, codigo: e.target.value})} 
                        placeholder="Ej. PROD004" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="nombre" className="font-bold text-sm text-900">Nombre</label>
                    <div className="premium-input-group">
                      <i className="pi pi-box premium-input-icon"></i>
                      <InputText 
                        id="nombre" 
                        value={datosFormulario.nombre} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, nombre: e.target.value})} 
                        placeholder="Ej. Teclado Mecánico" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex flex-column sm:flex-row gap-3">
                    <div className="flex flex-column gap-2 flex-1">
                      <label htmlFor="precio" className="font-bold text-sm text-900">Precio</label>
                      <div className="premium-input-group">
                        <i className="pi pi-dollar premium-input-icon"></i>
                        <InputNumber 
                          id="precio" 
                          value={datosFormulario.precio} 
                          onValueChange={(e) => setDatosFormulario({...datosFormulario, precio: e.value})} 
                          mode="currency" 
                          currency="USD" 
                          locale="en-US" 
                          placeholder="$0.00"
                          required 
                        />
                      </div>
                    </div>

                    <div className="flex flex-column gap-2 flex-1">
                      <label htmlFor="stock" className="font-bold text-sm text-900">Stock Inicial</label>
                      <div className="premium-input-group">
                        <i className="pi pi-database premium-input-icon"></i>
                        <InputNumber 
                          id="stock" 
                          value={datosFormulario.stock} 
                          onValueChange={(e) => setDatosFormulario({...datosFormulario, stock: e.value})} 
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="unidad" className="font-bold text-sm text-900">Unidad de Medida</label>
                    <div className="premium-input-group">
                      <i className="pi pi-calculator premium-input-icon"></i>
                      <Dropdown 
                        id="unidad" 
                        value={datosFormulario.unidad} 
                        options={opcionesUnidades} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, unidad: e.value})} 
                        placeholder="Seleccione Unidad" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="codigoImpuesto" className="font-bold text-sm text-900">Actividad Económica</label>
                    <div className="premium-input-group">
                      <i className="pi pi-briefcase premium-input-icon"></i>
                      <Dropdown 
                        id="codigoImpuesto" 
                        value={datosFormulario.codigoImpuesto} 
                        options={opcionesImpuestos} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, codigoImpuesto: e.value})} 
                        placeholder="Seleccione Actividad" 
                      />
                    </div>
                  </div>

                  <Button type="submit" label="Registrar Producto" icon="pi pi-plus" className="premium-btn mt-1" />
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Listado en Tabla */}
        <div className="col-12 lg:col-8">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Productos Registrados</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <div className="premium-table">
                  <DataTable value={productos} paginator rows={5} size="small" emptyMessage="No hay productos registrados" responsiveLayout="scroll">
                    <Column field="codigo" header="Código" sortable bodyClassName="font-bold"></Column>
                    <Column field="nombre" header="Nombre" sortable></Column>
                    <Column field="precio" header="Precio" body={(fila) => `$${fila.precio.toFixed(2)}`} sortable></Column>
                    <Column field="stock" header="Stock" sortable></Column>
                    <Column field="unidad" header="Unidad"></Column>
                    <Column field="codigoImpuesto" header="Act. Econ."></Column>
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