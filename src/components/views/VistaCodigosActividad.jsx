import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import api from '../../services/api';

export default function VistaCodigosActividad() {
  const [codigosActividad, setCodigosActividad] = useState([]);

  // Estado del formulario
  const [datosFormulario, setDatosFormulario] = useState({
    codActividad: '',
    descActividad: '',
    activo: true
  });

  const [editando, setEditando] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [actividadAEliminar, setActividadAEliminar] = useState(null);
  const [cargando, setCargando] = useState(false);
  const toast = useRef(null);

  const cargadoRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    const cargarActividades = async () => {
      setCargando(true);
      try {
        const respuesta = await api.get('/ActividadEconomicas');
        setCodigosActividad(respuesta.data || []);
      } catch (error) {
        console.error("Error al cargar actividades de la API:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarActividades();
  }, []);

  const iniciarEdicion = (actividad) => {
    setDatosFormulario({
      codActividad: actividad.codActividad,
      descActividad: actividad.descActividad,
      activo: actividad.activo ?? true
    });
    setIdSeleccionado(actividad.id);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setDatosFormulario({ codActividad: '', descActividad: '', activo: true });
    setIdSeleccionado(null);
    setEditando(false);
  };

  const confirmarEliminarActividad = (actividad) => {
    setActividadAEliminar(actividad);
    setDialogoEliminarVisible(true);
  };

  const eliminarActividad = async () => {
    if (!actividadAEliminar) return;
    setCargando(true);
    try {
      await api.delete(`/ActividadEconomicas/${actividadAEliminar.id}`);
      setCodigosActividad(prev => prev.filter(item => item.id !== actividadAEliminar.id));
      toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Actividad económica eliminada.', life: 3000 });
      if (idSeleccionado === actividadAEliminar.id) {
        cancelarEdicion();
      }
      setDialogoEliminarVisible(false);
      setActividadAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar actividad:", error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la actividad económica.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!datosFormulario.codActividad.trim() || !datosFormulario.descActividad.trim()) return;

    setCargando(true);
    try {
      if (editando) {
        const respuesta = await api.put(`/ActividadEconomicas/${idSeleccionado}`, datosFormulario);
        setCodigosActividad(prev => prev.map(item => item.id === idSeleccionado ? respuesta.data : item));
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Actividad económica actualizada.', life: 3000 });
        cancelarEdicion();
      } else {
        const respuesta = await api.post('/ActividadEconomicas', datosFormulario);
        setCodigosActividad(prev => [...prev, respuesta.data]);
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Actividad económica registrada.', life: 3000 });
        setDatosFormulario({ codActividad: '', descActividad: '', activo: true });
      }
    } catch (error) {
      console.error("Error al registrar/modificar actividad:", error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la actividad económica.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

  const plantillaActivo = (rowData) => {
    return rowData.activo ? 'Sí' : 'No';
  };

  const plantillaAcciones = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => iniciarEdicion(rowData)}
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminarActividad(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
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
        onClick={eliminarActividad}
        loading={cargando}
      />
    </div>
  );

  return (
    <div className="p-4 premium-fade-in">
      <Toast ref={toast} />

      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Códigos de Actividad Económica</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestión de actividades comerciales.</p>
      </div>

      <div className="grid">
        
        <div className="col-12 lg:col-4">
          <div className="premium-card-static">
            <div className="p-card p-component">
              <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>
                {editando ? 'Editar Actividad Económica' : 'Nuevo Código de Actividad'}
              </div>
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
                        disabled={cargando}
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
                        disabled={cargando}
                      />
                    </div>
                  </div>

                  <div className="flex align-items-center gap-3">
                    <label htmlFor="activo" className="font-bold text-sm text-900">Activo</label>
                    <InputSwitch 
                      id="activo" 
                      checked={datosFormulario.activo} 
                      onChange={(e) => setDatosFormulario({...datosFormulario, activo: e.value})} 
                      disabled={cargando}
                    />
                  </div>

                  <div className="flex gap-2 mt-1">
                    <Button type="submit" label={editando ? "Guardar" : "Registrar Actividad"} icon={editando ? "pi pi-check" : "pi pi-briefcase"} className="premium-btn flex-grow-1" disabled={cargando} />
                    {editando && (
                      <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-secondary p-button-outlined" onClick={cancelarEdicion} disabled={cargando} />
                    )}
                  </div>
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
                  loading={cargando}
                  >
                    <Column field="codActividad" header="Código" sortable bodyClassName="font-bold"></Column>
                    <Column field="descActividad" header="Nombre" sortable></Column>
                    <Column header="Activa" body={plantillaActivo} style={{ width: '10%' }}></Column>
                    <Column body={plantillaAcciones} exportable={false} style={{ width: '120px' }}></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </div>
        </div>

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
          <span>¿Está seguro de que desea eliminar la actividad económica <b>{actividadAEliminar?.descActividad}</b>?</span>
        </div>
      </Dialog>
    </div>
  );
}