import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputSwitch } from 'primereact/inputswitch';
import { InputTextarea } from 'primereact/inputtextarea';
import api from '../../services/api';

export default function VistaProductos() {
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const productoVacio = {
    id: null,
    codigo: '',
    nombre: '',
    costo: 0,
    precioConIVA: 0,
    precioSinIVA: 0,
    precioRebajado: 0,
    existencia: 0,
    consignacion: false,
    marca: '',
    categoriaId: null,
    tipoTributacion: 'GRAVADO',
    descripcion: '',
    stockMinimo: 0,
    activo: true,
    unimedidaId: null
  };

  const [producto, setProducto] = useState(productoVacio);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const toast = useRef(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarProductos();
    cargarUnidadesMedida();
    cargarCategorias();
  }, []);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const response = await api.get('/Productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los productos.',
        life: 3000
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await api.get('/Categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarUnidadesMedida = async () => {
    try {
      const response = await api.get('/UnidadDeMedidas');
      setUnidadesMedida(response.data);
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
    }
  };

  const abrirNuevo = () => {
    setProducto(productoVacio);
    setDialogoVisible(true);
  };

  const ocultarDialogo = () => {
    setDialogoVisible(false);
  };

  const ocultarDialogoEliminar = () => {
    setDialogoEliminarVisible(false);
  };

  const manejarCambioPrecios = (valor, campo) => {
    const IVA = 0.13;
    let nuevoProducto = { ...producto };

    if (campo === 'precioSinIVA') {
      const precioSin = valor || 0;
      nuevoProducto.precioSinIVA = precioSin;
      nuevoProducto.precioConIVA = Number((precioSin * (1 + IVA)).toFixed(4));
    } else if (campo === 'precioConIVA') {
      const precioCon = valor || 0;
      nuevoProducto.precioConIVA = precioCon;
      nuevoProducto.precioSinIVA = Number((precioCon / (1 + IVA)).toFixed(4));
    }
    setProducto(nuevoProducto);
  };

  const guardarProducto = async () => {
    if (!producto.codigo || !producto.nombre || producto.unimedidaId === null || producto.precioConIVA <= 0) {
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
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        costo: producto.costo || 0,
        precioConIVA: producto.precioConIVA,
        precioSinIVA: producto.precioSinIVA,
        precioRebajado: producto.precioRebajado || 0,
        existencia: producto.existencia || 0,
        consignacion: producto.consignacion,
        marca: producto.marca || '',
        categoriaId: producto.categoriaId,
        tipoTributacion: producto.tipoTributacion || 'GRAVADO',
        descripcion: producto.descripcion || '',
        stockMinimo: producto.stockMinimo || 0,
        activo: producto.activo,
        unimedidaId: producto.unimedidaId
      };

      if (producto.id) {
        // Actualizar
        await api.put(`/Productos/${producto.id}`, payload);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto actualizado correctamente.',
          life: 3000
        });
      } else {
        // Crear
        await api.post('/Productos', payload);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto creado correctamente.',
          life: 3000
        });
      }

      cargarProductos();
      setDialogoVisible(false);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      const apiMsg = error.response?.data?.message || error.response?.data?.error || '';
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: apiMsg || 'No se pudo guardar el producto.',
        life: 3000
      });
    } finally {
      setGuardando(false);
    }
  };

  const editarProducto = (prodSelected) => {
    // Mapear uniMedida object a unimedidaId y categoria a categoriaId
    setProducto({
      ...prodSelected,
      unimedidaId: prodSelected.uniMedida?.id || null,
      categoriaId: prodSelected.categoria?.id || null,
      tipoTributacion: prodSelected.tipoTributacion || 'GRAVADO'
    });
    setDialogoVisible(true);
  };

  const confirmarEliminarProducto = (prodSelected) => {
    setProducto(prodSelected);
    setDialogoEliminarVisible(true);
  };

  const eliminarProducto = async () => {
    setCargando(true);
    try {
      await api.delete(`/Productos/${producto.id}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Producto eliminado correctamente.',
        life: 3000
      });
      cargarProductos();
      setDialogoEliminarVisible(false);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el producto.',
        life: 3000
      });
    } finally {
      setCargando(false);
    }
  };

  // Plantillas de columnas
  const plantillaPrecioConIVA = (rowData) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rowData.precioConIVA);
  };

  const plantillaPrecioSinIVA = (rowData) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rowData.precioSinIVA);
  };

  const plantillaUnidadMedida = (rowData) => {
    return rowData.uniMedida?.descUnidad || '';
  };

  const plantillaConsignacion = (rowData) => {
    return rowData.consignacion ? 'Sí' : 'No';
  };

  const plantillaAcciones = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editarProducto(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminarProducto(rowData)}
        />
      </div>
    );
  };

  const headerToolbar = () => {
    return (
      <React.Fragment>
        <div className="flex flex-wrap gap-2">
          <Button
            label="Nuevo Producto"
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
        onClick={guardarProducto}
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
        onClick={eliminarProducto}
        loading={cargando}
      />
    </div>
  );

  const headerTabla = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
      <h3 className="m-0">Productos Registrados</h3>
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
          <h2 className="text-3xl font-bold m-0">Catálogo de Productos</h2>
          <p className="text-color-secondary mt-1">Administración de inventario y tarifas de servicios.</p>
        </div>

        <Toolbar left={headerToolbar} />

        <DataTable
          value={productos}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          loading={cargando}
          globalFilter={filtroGlobal}
          header={headerTabla}
          emptyMessage="No se encontraron productos."
          responsiveLayout="scroll"
        >
          <Column field="codigo" header="Código" sortable bodyClassName="font-bold"></Column>
          <Column field="nombre" header="Nombre" sortable></Column>
          <Column field="categoria.nombre" header="Categoría" sortable></Column>
          <Column field="marca" header="Marca" sortable></Column>
          <Column field="precioSinIVA" header="Precio sin IVA" body={plantillaPrecioSinIVA} sortable></Column>
          <Column field="precioConIVA" header="Precio con IVA" body={plantillaPrecioConIVA} sortable></Column>
          <Column field="tipoTributacion" header="Tributación" sortable></Column>
          <Column field="existencia" header="Existencia" sortable></Column>
          <Column header="U. Medida" body={plantillaUnidadMedida}></Column>
          <Column header="Consignación" body={plantillaConsignacion}></Column>
          <Column body={plantillaAcciones} exportable={false} style={{ minWidth: '8rem' }}></Column>
        </DataTable>
      </div>

      <Dialog
        visible={dialogoVisible}
        style={{ width: '600px' }}
        header={producto.id ? 'Modificar Producto' : 'Crear Producto'}
        modal
        className="p-fluid"
        footer={footerDialogo}
        onHide={ocultarDialogo}
      >
        <TabView>
          <TabPanel header="Información General" leftIcon="pi pi-info-circle mr-2">
            <div className="grid mt-2">
              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="codigo" className="font-bold block mb-1">Código *</label>
                <InputText
                  id="codigo"
                  value={producto.codigo}
                  onChange={(e) => setProducto({ ...producto, codigo: e.target.value.trim() })}
                  required
                  autoFocus
                  disabled={guardando}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="nombre" className="font-bold block mb-1">Nombre *</label>
                <InputText
                  id="nombre"
                  value={producto.nombre}
                  onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                  required
                  disabled={guardando}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="marca" className="font-bold block mb-1">Marca</label>
                <InputText
                  id="marca"
                  value={producto.marca}
                  onChange={(e) => setProducto({ ...producto, marca: e.target.value })}
                  disabled={guardando}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="categoriaId" className="font-bold block mb-1">Categoría *</label>
                <Dropdown
                  id="categoriaId"
                  value={producto.categoriaId}
                  options={categorias}
                  optionLabel="nombre"
                  optionValue="id"
                  onChange={(e) => setProducto({ ...producto, categoriaId: e.value })}
                  placeholder="Seleccionar Categoría"
                  disabled={guardando}
                  required
                  emptyMessage="No hay opciones disponibles"
                />
              </div>

              <div className="col-12 field mb-3">
                <label htmlFor="descripcion" className="font-bold block mb-1">Descripción</label>
                <InputTextarea
                  id="descripcion"
                  value={producto.descripcion}
                  onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
                  rows={3}
                  autoResize
                  disabled={guardando}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Precios e IVA" leftIcon="pi pi-dollar mr-2">
            <div className="grid mt-2">
              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="costo" className="font-bold block mb-1">Costo ($)</label>
                <InputNumber
                  id="costo"
                  value={producto.costo}
                  onValueChange={(e) => setProducto({ ...producto, costo: e.value })}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                  disabled={guardando}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="precioRebajado" className="font-bold block mb-1">Precio Rebajado ($)</label>
                <InputNumber
                  id="precioRebajado"
                  value={producto.precioRebajado}
                  onValueChange={(e) => setProducto({ ...producto, precioRebajado: e.value })}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                  disabled={guardando}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="precioSinIVA" className="font-bold block mb-1">Precio sin IVA *</label>
                <InputNumber
                  id="precioSinIVA"
                  value={producto.precioSinIVA}
                  onValueChange={(e) => manejarCambioPrecios(e.value, 'precioSinIVA')}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                  disabled={guardando}
                  required
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="precioConIVA" className="font-bold block mb-1">Precio con IVA *</label>
                <InputNumber
                  id="precioConIVA"
                  value={producto.precioConIVA}
                  onValueChange={(e) => manejarCambioPrecios(e.value, 'precioConIVA')}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                  disabled={guardando}
                  required
                />
              </div>

              <div className="col-12 field mb-3">
                <label htmlFor="tipoTributacion" className="font-bold block mb-1">Tipo de Tributación *</label>
                <Dropdown
                  id="tipoTributacion"
                  value={producto.tipoTributacion}
                  options={[
                    { label: 'Gravado (13% IVA)', value: 'GRAVADO' },
                    { label: 'Exento', value: 'EXENTO' },
                    { label: 'No Sujeto', value: 'NO_SUJETO' },
                    { label: 'No Gravado', value: 'NO_GRAVADO' }
                  ]}
                  onChange={(e) => setProducto({ ...producto, tipoTributacion: e.value })}
                  placeholder="Seleccionar Tributación"
                  disabled={guardando}
                  required
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Inventario" leftIcon="pi pi-box mr-2">
            <div className="grid mt-2">
              <div className="col-12 field mb-3">
                <label htmlFor="unimedidaId" className="font-bold block mb-1">Unidad de Medida *</label>
                <Dropdown
                  id="unimedidaId"
                  value={producto.unimedidaId}
                  options={unidadesMedida}
                  optionLabel="descUnidad"
                  optionValue="id"
                  onChange={(e) => setProducto({ ...producto, unimedidaId: e.value })}
                  placeholder="Seleccionar Unidad"
                  required
                  disabled={guardando}
                  emptyMessage="No hay opciones disponibles"
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="existencia" className="font-bold block mb-1">Existencia</label>
                <InputNumber
                  id="existencia"
                  value={producto.existencia}
                  onValueChange={(e) => setProducto({ ...producto, existencia: e.value })}
                  mode="decimal"
                  disabled={guardando}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="stockMinimo" className="font-bold block mb-1">Stock Mínimo</label>
                <InputNumber
                  id="stockMinimo"
                  value={producto.stockMinimo}
                  onValueChange={(e) => setProducto({ ...producto, stockMinimo: e.value })}
                  mode="decimal"
                  disabled={guardando}
                />
              </div>

              <div className="col-12 field mb-3 flex align-items-center gap-3">
                <label htmlFor="consignacion" className="font-bold">Producto en Consignación</label>
                <InputSwitch
                  inputId="consignacion"
                  checked={producto.consignacion}
                  onChange={(e) => setProducto({ ...producto, consignacion: e.value })}
                  disabled={guardando}
                />
              </div>
            </div>
          </TabPanel>
        </TabView>
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
          <span>¿Está seguro de que desea eliminar el producto <b>{producto.nombre}</b>?</span>
        </div>
      </Dialog>
    </div>
  );
}