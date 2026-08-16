import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputSwitch } from 'primereact/inputswitch';
import { InputTextarea } from 'primereact/inputtextarea';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { resolverUrlMedia } from '../../utils/media';

export default function VistaProductos() {
  const { puede } = useAuth();
  const [productos, setProductos] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [dialogoEliminarVisible, setDialogoEliminarVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenVistaPrevia, setImagenVistaPrevia] = useState(null);

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
    productoPersonalizable: false,
    marca: '',
    categoriaId: null,
    tipoTributacion: 'GRAVADO',
    descripcion: '',
    stockMinimo: 0,
    activo: true,
    unimedidaId: null,
    imagenUrl: null
  };

  const [producto, setProducto] = useState(productoVacio);
  const [filtroGlobal, setFiltroGlobal] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroTributacion, setFiltroTributacion] = useState(null);
  const [filtroStock, setFiltroStock] = useState('TODOS');
  const [pagina, setPagina] = useState(0);
  const [filas, setFilas] = useState(20);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [orden, setOrden] = useState({ campo: 'nombre', direccion: 1 });
  const [recarga, setRecarga] = useState(0);
  const toast = useRef(null);

  const cargadoRef = useRef(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    Promise.all([api.get('/UnidadDeMedidas'), api.get('/Categorias')])
      .then(([unidades, categoriasRespuesta]) => {
        setUnidadesMedida(unidades.data || []);
        setCategorias(categoriasRespuesta.data || []);
      })
      .catch((error) => console.error('Error al cargar catálogos de productos:', error));
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const response = await api.get('/Productos', {
          signal: controlador.signal,
          params: {
            page: pagina,
            size: filas,
            q: filtroGlobal.trim(),
            categoriaId: filtroCategoria || undefined,
            tipoTributacion: filtroTributacion || undefined,
            stock: filtroStock,
            sortBy: orden.campo,
            sortDir: orden.direccion === 1 ? 'asc' : 'desc'
          }
        });
        setProductos(Array.isArray(response.data?.content) ? response.data.content : []);
        setTotalRegistros(Number(response.data?.totalElements || 0));
      } catch (error) {
        if (error.code === 'ERR_CANCELED') return;
        console.error('Error al cargar productos:', error);
        setProductos([]);
        setTotalRegistros(0);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos.', life: 3000 });
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }, filtroGlobal ? 300 : 0);
    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [pagina, filas, filtroGlobal, filtroCategoria, filtroTributacion, filtroStock, orden, recarga]);

  function cargarProductos() {
    setRecarga((actual) => actual + 1);
  }

  const abrirNuevo = () => {
    liberarVistaPrevia();
    setProducto(productoVacio);
    setImagenArchivo(null);
    setImagenVistaPrevia(null);
    setDialogoVisible(true);
  };

  const ocultarDialogo = () => {
    liberarVistaPrevia();
    setImagenArchivo(null);
    setDialogoVisible(false);
  };

  const liberarVistaPrevia = () => {
    if (imagenVistaPrevia?.startsWith('blob:')) URL.revokeObjectURL(imagenVistaPrevia);
  };

  const seleccionarImagen = (archivo) => {
    if (!archivo) return;
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) {
      toast.current.show({ severity: 'warn', summary: 'Formato no permitido', detail: 'Selecciona una imagen PNG o JPEG.', life: 3500 });
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      toast.current.show({ severity: 'warn', summary: 'Imagen demasiado grande', detail: 'La imagen original no puede superar 5 MB.', life: 3500 });
      return;
    }
    liberarVistaPrevia();
    setImagenArchivo(archivo);
    setImagenVistaPrevia(URL.createObjectURL(archivo));
  };

  const eliminarImagen = async () => {
    liberarVistaPrevia();
    setImagenArchivo(null);
    if (!producto.id || !producto.imagenUrl) {
      setImagenVistaPrevia(null);
      setProducto((actual) => ({ ...actual, imagenUrl: null }));
      return;
    }
    try {
      await api.delete(`/Productos/${producto.id}/imagen`);
      setImagenVistaPrevia(null);
      setProducto((actual) => ({ ...actual, imagenUrl: null }));
      cargarProductos();
      toast.current.show({ severity: 'success', summary: 'Imagen eliminada', detail: 'El producto volvera a usar el icono predeterminado.', life: 3000 });
    } catch (error) {
      const apiMsg = error.response?.data?.message || 'No se pudo eliminar la imagen.';
      toast.current.show({ severity: 'error', summary: 'Error', detail: apiMsg, life: 4000 });
    }
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
        productoPersonalizable: producto.productoPersonalizable,
        marca: producto.marca || '',
        categoriaId: producto.categoriaId,
        tipoTributacion: producto.tipoTributacion || 'GRAVADO',
        descripcion: producto.descripcion || '',
        stockMinimo: producto.stockMinimo || 0,
        activo: producto.activo,
        unimedidaId: producto.unimedidaId
      };

      let productoGuardado;
      if (producto.id) {
        productoGuardado = (await api.put(`/Productos/${producto.id}`, payload)).data;
      } else {
        productoGuardado = (await api.post('/Productos', payload)).data;
      }

      let errorImagen = null;
      if (imagenArchivo && productoGuardado?.id) {
        const formulario = new FormData();
        formulario.append('archivo', imagenArchivo);
        try {
          productoGuardado = (await api.post(`/Productos/${productoGuardado.id}/imagen`, formulario, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })).data;
        } catch (errorCargaImagen) {
          errorImagen = errorCargaImagen.response?.data?.message || 'El producto se guardo, pero su imagen no pudo procesarse.';
        }
      }

      toast.current.show(errorImagen
        ? { severity: 'warn', summary: 'Producto guardado sin imagen', detail: errorImagen, life: 5500 }
        : { severity: 'success', summary: 'Éxito', detail: producto.id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.', life: 3000 });

      cargarProductos();
      liberarVistaPrevia();
      setImagenArchivo(null);
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
    liberarVistaPrevia();
    setImagenArchivo(null);
    setImagenVistaPrevia(resolverUrlMedia(prodSelected.imagenUrl));
    setProducto({
      ...prodSelected,
      unimedidaId: prodSelected.uniMedida?.id || null,
      categoriaId: prodSelected.categoria?.id || null,
      tipoTributacion: prodSelected.tipoTributacion || 'GRAVADO',
      productoPersonalizable: prodSelected.productoPersonalizable ?? false
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
  const plantillaImagen = (rowData) => {
    const url = resolverUrlMedia(rowData.imagenUrl);
    return url ? (
      <img src={url} alt="" style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', background: 'var(--surface-ground)' }} />
    ) : <i className="pi pi-image text-2xl" style={{ color: 'var(--text-muted)' }} />;
  };

  const plantillaPrecioConIVA = (rowData) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rowData.precioConIVA);
  };

  const plantillaPrecioSinIVA = (rowData) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rowData.precioSinIVA);
  };

  const plantillaUnidadMedida = (rowData) => {
    return rowData.uniMedida?.nombre || rowData.uniMedida?.descUnidad || '';
  };

  const plantillaConsignacion = (rowData) => {
    return rowData.consignacion ? 'Sí' : 'No';
  };

  const plantillaAcciones = (rowData) => {
    return (
      <div className="flex gap-2">
        {puede('PRODUCTOS_EDITAR') && <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success p-button-sm"
          onClick={() => editarProducto(rowData)}
        />}
        {puede('PRODUCTOS_ELIMINAR') && <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => confirmarEliminarProducto(rowData)}
        />}
      </div>
    );
  };

  const headerToolbar = () => {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {puede('PRODUCTOS_CREAR') && <Button
            label="Nuevo Producto"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={abrirNuevo}
          />}
        </div>
      </>
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
      {(producto.id ? puede('PRODUCTOS_EDITAR') : puede('PRODUCTOS_CREAR')) && <Button
        label="Guardar"
        icon="pi pi-check"
        className="p-button-primary"
        onClick={guardarProducto}
        loading={guardando}
      />}
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

  const opcionesTributacion = [
    { label: 'Todas las Tributaciones', value: null },
    { label: 'Gravado', value: 'GRAVADO' },
    { label: 'Exento', value: 'EXENTO' },
    { label: 'No Sujeto', value: 'NO_SUJETO' }
  ];

  const opcionesStock = [
    { label: 'Todos los Productos', value: 'TODOS' },
    { label: 'Con Stock / Disponible', value: 'CON_STOCK' },
    { label: 'Sin Stock / Agotado', value: 'SIN_STOCK' }
  ];

  const headerTabla = (
    <div className="flex flex-column gap-3 p-2">
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
        <h3 className="m-0 text-base font-bold" style={{ color: 'var(--text-primary)' }}>Productos Registrados</h3>
        <span className="text-xs text-500" style={{ color: 'var(--text-muted)' }}>
          Mostrando {productos.length} de {totalRegistros} productos
        </span>
      </div>
      <div className="grid">
        <div className="col-12 md:col-3">
          <div className="premium-input-group w-full">
            <i className="pi pi-search premium-input-icon"></i>
            <InputText
              type="search"
              value={filtroGlobal}
              onChange={(e) => { setFiltroGlobal(e.target.value); setPagina(0); }}
              placeholder="Buscar por código, nombre, marca..."
              className="w-full"
            />
          </div>
        </div>
        <div className="col-12 md:col-3">
          <Dropdown
            value={filtroCategoria}
            options={[{ label: 'Todas las Categorías', value: null }, ...categorias.map(c => ({ label: c.nombre, value: c.id }))]}
            onChange={(e) => { setFiltroCategoria(e.value); setPagina(0); }}
            placeholder="Filtrar por Categoría"
            className="w-full"
            filter
            showClear
          />
        </div>
        <div className="col-12 md:col-3">
          <Dropdown
            value={filtroTributacion}
            options={opcionesTributacion}
            onChange={(e) => { setFiltroTributacion(e.value); setPagina(0); }}
            placeholder="Filtrar por Tributación"
            className="w-full"
            showClear
          />
        </div>
        <div className="col-12 md:col-3">
          <Dropdown
            value={filtroStock}
            options={opcionesStock}
            onChange={(e) => { setFiltroStock(e.value); setPagina(0); }}
            placeholder="Disponibilidad de Stock"
            className="w-full"
          />
        </div>
      </div>
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
          lazy
          paginator
          first={pagina * filas}
          rows={filas}
          totalRecords={totalRegistros}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPage={(e) => { setPagina(e.page); setFilas(e.rows); }}
          onSort={(e) => { setOrden({ campo: e.sortField, direccion: e.sortOrder }); setPagina(0); }}
          sortField={orden.campo}
          sortOrder={orden.direccion}
          loading={cargando}
          header={headerTabla}
          emptyMessage="No se encontraron productos con los filtros aplicados."
          responsiveLayout="scroll"
        >
          <Column field="codigo" header="Código" sortable bodyClassName="font-bold"></Column>
          <Column header="Imagen" body={plantillaImagen} style={{ width: '72px' }}></Column>
          <Column field="nombre" header="Nombre" sortable></Column>
          <Column field="categoria.nombre" header="Categoría"></Column>
          <Column field="marca" header="Marca"></Column>
          <Column field="precioSinIVA" header="Precio sin IVA" body={plantillaPrecioSinIVA}></Column>
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

              <div className="col-12 field mb-3 flex align-items-center justify-content-between gap-3">
                <div className="flex flex-column">
                  <label htmlFor="productoPersonalizable" className="font-bold">Producto Personalizable</label>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Abre el modal de precio/descuento al seleccionarlo en el POS</span>
                </div>
                <InputSwitch
                  inputId="productoPersonalizable"
                  checked={producto.productoPersonalizable}
                  onChange={(e) => setProducto({ ...producto, productoPersonalizable: e.value })}
                  disabled={guardando}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Imagen" leftIcon="pi pi-image mr-2">
            <div className="flex flex-column align-items-center gap-3 py-3">
              <div className="flex align-items-center justify-content-center border-round-xl" style={{ width: '180px', height: '180px', background: 'var(--surface-ground)', border: '1px dashed var(--surface-border)' }}>
                {imagenVistaPrevia ? (
                  <img src={imagenVistaPrevia} alt="Vista previa del producto" style={{ maxWidth: '160px', maxHeight: '160px', objectFit: 'contain' }} />
                ) : (
                  <i className="pi pi-image text-6xl" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <input
                id="imagenProducto"
                type="file"
                accept="image/png,image/jpeg"
                className="p-inputtext p-component w-full"
                onChange={(e) => seleccionarImagen(e.target.files?.[0])}
                disabled={guardando}
              />
              <small style={{ color: 'var(--text-muted)' }}>
                PNG o JPEG, maximo 5 MB. Se ajustara automaticamente a 320 x 320 px y aproximadamente 120 KB.
              </small>
              {(imagenVistaPrevia || producto.imagenUrl) && (
                <Button type="button" label="Quitar imagen" icon="pi pi-trash" severity="danger" outlined onClick={eliminarImagen} disabled={guardando} />
              )}
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
                  locale="en-US"
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
                  locale="en-US"
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
                  locale="en-US"
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
                  locale="en-US"
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
