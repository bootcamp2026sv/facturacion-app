import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import api from '../../services/api';

export default function VistaCodigosActividad() {
  // Datos de prueba
  const [codigosActividad, setCodigosActividad] = useState([]);

  // Estado del formulario
  const [datosFormulario, setDatosFormulario] = useState({
    codActividad: '',
    descActividad: '',
    activo: true
  });


  // Descomentar para conectar con la API
 
  useEffect(() => {
    const cargarActividades = async () => {
      try {
        const respuesta = await api.get('/ActividadEconomicas');
        setCodigosActividad(respuesta.data || []);
      } catch (error) {
        console.error("Error al cargar actividades de la API:", error);
      }
    };
    cargarActividades();
  }, []);
  

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!datosFormulario.codActividad.trim() || !datosFormulario.descActividad.trim()) return;

    // Descomentar para guardar en la API
    
    try {
      const respuesta = await api.post('/ActividadEconomicas', datosFormulario);
      setCodigosActividad([...codigosActividad, respuesta.data]);
      setDatosFormulario({ codActividad: '', descActividad: '', activo: true });
      return;
    } catch (error) {
      console.error("Error al registrar actividad:", error);
    }

  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Códigos de Actividad Económica</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestión de actividades comerciales.</p>
      </div>

      <div className="grid">
        
        <div className="col-12 lg:col-4">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Nuevo Código de Actividad</div>
              <div className="p-card-content" style={{ padding: '1.25rem' }}>
                <form onSubmit={manejarEnvio} className="flex flex-column gap-4 p-fluid">
                  <div className="flex flex-column gap-2">
                    <label htmlFor="codActividad" className="font-bold text-sm text-900">Código</label>
                    <div className="premium-input-group">
                      <i className="pi pi-hashtag premium-input-icon"></i>
                      <InputText 
                        id="codActividad" 
                        value={datosFormulario.codActividad} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, codActividad: e.target.value})} 
                        placeholder="Ej. 620100" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="descActividad" className="font-bold text-sm text-900">Nombre / Descripción</label>
                    <div className="premium-input-group">
                      <i className="pi pi-briefcase premium-input-icon"></i>
                      <InputText 
                        id="descActividad" 
                        value={datosFormulario.descActividad} 
                        onChange={(e) => setDatosFormulario({...datosFormulario, descActividad: e.target.value})} 
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
                  <DataTable 
                  value={codigosActividad} 
                  paginator rows={5} 
                  size="small" 
                  emptyMessage="No hay códigos registrados" 
                  responsiveLayout="scroll"
                  >
                    <Column field="codActividad" header="Código" sortable bodyClassName="font-bold"></Column>
                    <Column field="descActividad" header="Nombre" sortable></Column>
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