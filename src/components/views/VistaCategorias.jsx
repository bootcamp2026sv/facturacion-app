import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import api from '../../services/api';

export default function VistaCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const categoriaVacia = {
    id: null,
    nombre: '',
    descripcion: '',
    activo: true
  };

  const [categoria, setCategoria] = useState(categoriaVacia);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const toast = useRef(null);

  const cargadoRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setCargando(true);
    try {
      const response = await api.get('/Categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las categorías.',
        life: 3000
      });
    } finally {
      setCargando(false);
    }
  };

  const abrirNuevo = () => {
    setCategoria(categoriaVacia);
    setDialogoVisible(true);
  };

  const ocultarDialogo = () => {
    setDialogoVisible(false);
  };

  const ocultarDialogoEliminar = () => {
    setDialogoEliminarVisible(false);
  };

  const guardarCategoria = async () => {
    if (!categoria.nombre.trim()) {
      toast.current.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El nombre de la categoría es obligatorio.',
        life: 3000
      });
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        id: categoria.id,
        nombre: categoria.nombre.trim(),
        descripcion: categoria.descripcion ? categoria.descripcion.trim() : '',
        activo: categoria.activo
      };

      if (categoria.id) {
        // Actualizar
        await api.put(`/Categorias/${categoria.id}`, payload);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Categoría actualizada correctamente.',
          life: 3000
        });
      } else {
        // Crear
        await api.post('/Categorias', payload);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Categoría creada correctamente.',
          life: 3000
        });
      }

      cargarCategorias();
      setDialogoVisible(false);
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      const apiMsg = error.response?.data?.message || error.response?.data?.error || '';
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: apiMsg || 'No se pudo guardar la categoría.',
        life: 3000
      });
    } finally {
      setGuardando(false);
    }
  };

  const editarCategoria = (categoriaSelected) => {
    setCategoria({ ...categoriaSelected });
    setDialogoVisible(true);
  };

  const confirmarEliminarCategoria = (categoriaSelected) => {
    setCategoria(categoriaSelected);
    setDialogoEliminarVisible(true);
  };

  const eliminarCategoria = async () => {
    setCargando(true);
    try {
      await api.delete(`/Categorias/${categoria.id}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Categoría eliminada correctamente.',
        life: 3000
      });
      cargarCategorias();
      setDialogoEliminarVisible(false);
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la categoría.',
        life: 3000
      });
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
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editarCategoria(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminarCategoria(rowData)}
        />
      </div>
    );
  };

  const headerToolbar = () => {
    return (
      <React.Fragment>
        <div className="flex flex-wrap gap-2">
          <Button
            label="Nueva Categoría"
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
        onClick={guardarCategoria}
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
        onClick={eliminarCategoria}
        loading={cargando}
      />
    </div>
  );

  const headerTabla = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
      <h3 className="m-0">Categorías de Producto</h3>
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
          <h2 className="text-3xl font-bold m-0">Catálogo de Categorías</h2>
          <p className="text-color-secondary mt-1">Clasificación y segmentación de productos.</p>
        </div>

        <Toolbar left={headerToolbar} />

        <DataTable
          value={categorias}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          loading={cargando}
          globalFilter={filtroGlobal}
          header={headerTabla}
          emptyMessage="No se encontraron categorías."
          responsiveLayout="scroll"
        >
          <Column field="nombre" header="Nombre de Categoría" sortable bodyClassName="font-bold" style={{ width: '30%' }}></Column>
          <Column field="descripcion" header="Descripción" sortable style={{ width: '45%' }}></Column>
          <Column header="Activa" body={plantillaActivo} style={{ width: '10%' }}></Column>
          <Column body={plantillaAcciones} exportable={false} style={{ minWidth: '8rem', width: '15%' }}></Column>
        </DataTable>
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: '400px' }}
        header={categoria.id ? 'Modificar Categoría' : 'Crear Categoría'}
        modal
        className="p-fluid"
        footer={footerDialogo}
        onHide={ocultarDialogo}
      >
        <div className="grid">
          <div className="col-12 field mb-3">
            <label htmlFor="nombre" className="font-bold block mb-1">Nombre de la Categoría *</label>
            <InputText
              id="nombre"
              value={categoria.nombre}
              onChange={(e) => setCategoria({ ...categoria, nombre: e.target.value })}
              placeholder="Ej. Electrónica, Lácteos"
              required
              autoFocus
              disabled={guardando}
            />
          </div>

          <div className="col-12 field mb-3">
            <label htmlFor="descripcion" className="font-bold block mb-1">Descripción</label>
            <InputTextarea
              id="descripcion"
              value={categoria.descripcion}
              onChange={(e) => setCategoria({ ...categoria, descripcion: e.target.value })}
              placeholder="Descripción de la categoría..."
              rows={3}
              autoResize
              disabled={guardando}
            />
          </div>

          <div className="col-12 field mb-3 flex align-items-center gap-3">
            <label htmlFor="activo" className="font-bold">Categoría Activa</label>
            <InputSwitch
              inputId="activo"
              checked={categoria.activo}
              onChange={(e) => setCategoria({ ...categoria, activo: e.value })}
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
          <span>¿Está seguro de que desea eliminar la categoría <b>{categoria.nombre}</b>?</span>
        </div>
      </Dialog>
    </div>
  );
}
