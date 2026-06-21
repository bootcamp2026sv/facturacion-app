import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import api from '../../services/api';

export default function VistaUnidadesMedida() {
  const [unidades, setUnidades] = useState([]);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const unidadVacia = {
    id: null,
    codUnidad: null,
    descUnidad: ''
  };

  const [unidad, setUnidad] = useState(unidadVacia);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const toast = useRef(null);

  useEffect(() => {
    cargarUnidades();
  }, []);

  const cargarUnidades = async () => {
    setCargando(true);
    try {
      const response = await api.get('/UnidadDeMedidas');
      setUnidades(response.data);
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las unidades de medida.',
        life: 3000
      });
    } finally {
      setCargando(false);
    }
  };

  const abrirNuevo = () => {
    setUnidad(unidadVacia);
    setDialogoVisible(true);
  };

  const ocultarDialogo = () => {
    setDialogoVisible(false);
  };

  const ocultarDialogoEliminar = () => {
    setDialogoEliminarVisible(false);
  };

  const guardarUnidad = async () => {
    if (unidad.codUnidad === null || !unidad.descUnidad.trim()) {
      toast.current.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Complete todos los campos obligatorios.',
        life: 3000
      });
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        id: unidad.id,
        codUnidad: unidad.codUnidad,
        descUnidad: unidad.descUnidad.trim()
      };

      if (unidad.id) {
        // Actualizar
        await api.put(`/UnidadDeMedidas/${unidad.id}`, payload);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Unidad de medida actualizada correctamente.',
          life: 3000
        });
      } else {
        // Crear
        await api.post('/UnidadDeMedidas', payload);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Unidad de medida creada correctamente.',
          life: 3000
        });
      }

      cargarUnidades();
      setDialogoVisible(false);
    } catch (error) {
      console.error('Error al guardar unidad de medida:', error);
      const apiMsg = error.response?.data?.message || error.response?.data?.error || '';
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: apiMsg || 'No se pudo guardar la unidad de medida.',
        life: 3000
      });
    } finally {
      setGuardando(false);
    }
  };

  const editarUnidad = (unidadSelected) => {
    setUnidad({ ...unidadSelected });
    setDialogoVisible(true);
  };

  const confirmarEliminarUnidad = (unidadSelected) => {
    setUnidad(unidadSelected);
    setDialogoEliminarVisible(true);
  };

  const eliminarUnidad = async () => {
    setCargando(true);
    try {
      await api.delete(`/UnidadDeMedidas/${unidad.id}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Unidad de medida eliminada correctamente.',
        life: 3000
      });
      cargarUnidades();
      setDialogoEliminarVisible(false);
    } catch (error) {
      console.error('Error al eliminar unidad de medida:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la unidad de medida.',
        life: 3000
      });
    } finally {
      setCargando(false);
    }
  };

  const plantillaAcciones = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editarUnidad(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminarUnidad(rowData)}
        />
      </div>
    );
  };

  const headerToolbar = () => {
    return (
      <React.Fragment>
        <div className="flex flex-wrap gap-2">
          <Button
            label="Nueva Unidad"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirNuevo}
          />
        </div>
      </React.Fragment>
    );
  };

  const footerDialogo = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={ocultarDialogo}
        disabled={guardando}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-primary"
        onClick={guardarUnidad}
        loading={guardando}
      />
    </div>
  );

  const footerDialogoEliminar = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={ocultarDialogoEliminar}
        disabled={cargando}
      />
      <Button
        label="Sí, Eliminar"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={eliminarUnidad}
        loading={cargando}
      />
    </div>
  );

  const headerTabla = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
      <h3 className="m-0">Unidades de Medida Registradas</h3>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setFiltroGlobal(e.target.value)}
          placeholder="Buscar..."
          className="w-full md:w-auto"
        />
      </IconField>
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />

      <div className="flex flex-column gap-3">
        <div>
          <h2 className="text-3xl font-bold m-0">Catálogo de Unidades de Medida</h2>
          
        </div>

        <Toolbar left={headerToolbar} />

        <DataTable
          value={unidades}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          loading={cargando}
          globalFilter={filtroGlobal}
          header={headerTabla}
          emptyMessage="No se encontraron unidades de medida."
          responsiveLayout="scroll"
        >
          <Column field="codUnidad" header="Código de Unidad (MH)" sortable bodyClassName="font-bold" style={{ width: '30%' }}></Column>
          <Column field="descUnidad" header="Descripción de la Unidad" sortable style={{ width: '50%' }}></Column>
          <Column body={plantillaAcciones} exportable={false} style={{ minWidth: '8rem', width: '20%' }}></Column>
        </DataTable>
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: '400px' }}
        header={unidad.id ? 'Modificar Unidad' : 'Crear Unidad'}
        modal
        className="p-fluid"
        footer={footerDialogo}
        onHide={ocultarDialogo}
      >
        <div className="grid">
          <div className="col-12 field mb-3">
            <label htmlFor="codUnidad" className="font-bold block mb-1">Código de Unidad (MH) *</label>
            <InputNumber
              id="codUnidad"
              value={unidad.codUnidad}
              onValueChange={(e) => setUnidad({ ...unidad, codUnidad: e.value })}
              useGrouping={false}
              placeholder="Ej. 1"
              required
              autoFocus
              disabled={guardando}
            />
          </div>

          <div className="col-12 field mb-3">
            <label htmlFor="descUnidad" className="font-bold block mb-1">Descripción de la Unidad *</label>
            <InputText
              id="descUnidad"
              value={unidad.descUnidad}
              onChange={(e) => setUnidad({ ...unidad, descUnidad: e.target.value })}
              placeholder="Ej. Unidad, Kilogramo, Servicio"
              required
              disabled={guardando}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={dialogoEliminarVisible}
        style={{ width: '400px' }}
        header="Confirmar Eliminación"
        modal
        footer={footerDialogoEliminar}
        onHide={ocultarDialogoEliminar}
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-red-500 text-3xl" />
          <span>¿Está seguro de que desea eliminar la unidad de medida <b>{unidad.descUnidad}</b>?</span>
        </div>
      </Dialog>
    </div>
  );
}