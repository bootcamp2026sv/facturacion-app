import { useState, useMemo, useEffect, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';

const PRODUCTOS = [
  { id: 1, nombre: 'Coca-Cola 355ml', precio: 1.50, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'gravado' },
  { id: 2, nombre: 'Agua Pura 500ml', precio: 1.00, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'exento' },
  { id: 3, nombre: 'Jugo de Naranja', precio: 2.00, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'gravado', lineaLibre: true },
  { id: 4, nombre: 'Café Americano', precio: 2.50, categoria: 'Bebidas', icono: 'pi pi-glass', tipoIva: 'gravado' },
  { id: 5, nombre: 'Hamburguesa Clásica', precio: 5.50, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'gravado', lineaLibre: true },
  { id: 6, nombre: 'Pizza Personal', precio: 6.00, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'gravado', lineaLibre: true },
  { id: 7, nombre: 'Papas Fritas Grandes', precio: 3.00, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'exento', lineaLibre: true },
  { id: 8, nombre: 'Nachos con Queso', precio: 4.00, categoria: 'Comidas', icono: 'pi pi-shopping-cart', tipoIva: 'gravado' },
  { id: 9, nombre: 'Pastel de Chocolate', precio: 3.50, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'noSujeto' },
  { id: 10, nombre: 'Helado Vainilla', precio: 2.50, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'gravado', lineaLibre: true },
  { id: 11, nombre: 'Flan Caramelo', precio: 3.00, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'gravado' },
  { id: 12, nombre: 'Cheesecake', precio: 4.50, categoria: 'Postres', icono: 'pi pi-star', tipoIva: 'noGravado' },
];

const CLIENTES = [
  { label: 'Cliente Final', value: 0, nit: 'Consumidor Final', granContribuyente: false },
  { label: 'Distribuidora Alimentos S.A. de C.V.', value: 1, nit: '0614-150882-101-1', granContribuyente: true },
  { label: 'Juan Carlos Pérez', value: 2, nit: '01234567-8', granContribuyente: false },
  { label: 'Tecnología Integrada S.A. de C.V.', value: 3, nit: '0614-210398-102-3', granContribuyente: true },
  { label: 'María José Rodríguez', value: 4, nit: '02468101-3', granContribuyente: false },
  { label: 'Constructora del Valle S.A.', value: 5, nit: '0614-050783-101-7', granContribuyente: false },
  { label: 'Supermercados Unidos S.A.', value: 6, nit: '0614-120195-104-2', granContribuyente: true },
  { label: 'Ana Lucía Hernández', value: 7, nit: '03691245-6', granContribuyente: false },
];

const METODOS_PAGO = [
  { label: 'Efectivo', value: 'efectivo', icono: 'pi pi-money-bill' },
  { label: 'Tarjeta', value: 'tarjeta', icono: 'pi pi-credit-card' },
  { label: 'Crédito', value: 'credito', icono: 'pi pi-clock' },
  { label: 'Transferencia', value: 'transferencia', icono: 'pi pi-building' },
];

const TIPOS_DTE = [
  { label: 'Factura (DTE 01)', value: '01', icon: 'pi pi-user', color: '#10b981' },
  { label: 'Crédito Fiscal (DTE 03)', value: '03', icon: 'pi pi-briefcase', color: '#6366f1' },
  { label: 'Sujeto Excluido (DTE 14)', value: '14', icon: 'pi pi-user-minus', color: '#f59e0b' },
  { label: 'Exportación (DTE 11)', value: '11', icon: 'pi pi-globe', color: '#8b5cf6' },
];

const CATEGORIAS = ['Todas', 'Bebidas', 'Comidas', 'Postres'];

const ETIQUETA_IVA = {
  gravado: { label: 'IVA 13%', severity: 'info' },
  exento: { label: 'Exento', severity: 'success' },
  noSujeto: { label: 'No Sujeto', severity: 'warning' },
  noGravado: { label: 'No Gravado', severity: 'secondary' },
};

const COLOR_PAGO = { efectivo: '#10b981', tarjeta: '#6366f1', credito: '#f59e0b', transferencia: '#8b5cf6' };

export default function VistaPuntoVenta() {
  const redondear = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dialogoPago, setDialogoPago] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [esGranContribuyente, setEsGranContribuyente] = useState(false);
  const [tipoDte, setTipoDte] = useState('01');

  useEffect(() => {
    const cli = CLIENTES.find(c => c.value === cliente);
    setEsGranContribuyente(!!cli?.granContribuyente);
  }, [cliente]);

  const [dialogoItem, setDialogoItem] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [precioIncluyeIva, setPrecioIncluyeIva] = useState(false);

  const cambiarModoIvaPrecio = (valor) => {
    if (valor === precioIncluyeIva) return;
    setPrecioIncluyeIva(valor);
    if (itemEditando) {
      if (valor) {
        setItemEditando(prev => ({
          ...prev,
          precio: prev.tipoIva === 'gravado' ? redondear(prev.precio * 1.13) : prev.precio
        }));
      } else {
        setItemEditando(prev => ({
          ...prev,
          precio: prev.tipoIva === 'gravado' ? redondear(prev.precio / 1.13) : prev.precio
        }));
      }
    }
  };
  const [dialogoCliente, setDialogoCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState(null);
  const [plazoValor, setPlazoValor] = useState(1);
  const [plazoTipo, setPlazoTipo] = useState('meses');
  const [referenciaPago, setReferenciaPago] = useState('');

  const togglePantallaCompleta = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const manejarCambio = () => {
      const fs = !!document.fullscreenElement;
      setPantallaCompleta(fs);
      document.body.style.overflow = fs ? 'hidden' : '';
      document.documentElement.style.overflow = fs ? 'hidden' : '';
      const main = document.querySelector('main');
      if (main) main.style.overflow = fs ? 'hidden' : '';
    };
    document.addEventListener('fullscreenchange', manejarCambio);
    return () => {
      document.removeEventListener('fullscreenchange', manejarCambio);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const main = document.querySelector('main');
      if (main) main.style.overflow = '';
    };
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return CLIENTES;
    const q = busquedaCliente.toLowerCase();
    return CLIENTES.filter(c => c.label.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q));
  }, [busquedaCliente]);

  const productosFiltrados = useMemo(() => {
    return PRODUCTOS.filter(p => {
      if (categoriaActiva !== 'Todas' && p.categoria !== categoriaActiva) return false;
      if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [busqueda, categoriaActiva]);

  const abrirPersonalizar = (producto) => {
    if (producto.lineaLibre) {
      setCarrito(prev => {
        const existente = prev.find(item => item.id === producto.id);
        if (existente) {
          return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
        }
        return [...prev, { ...producto, _key: Date.now() + Math.random(), cantidad: 1, descuentoTipo: 'porcentaje', descuentoValor: 0 }];
      });
      return;
    }
    setItemEditando({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      descuentoTipo: 'porcentaje',
      descuentoValor: 0,
      tipoIva: producto.tipoIva,
    });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  };

  const agregarAlCarrito = () => {
    if (!itemEditando) return;
    const precioFinal = (precioIncluyeIva && itemEditando.tipoIva === 'gravado')
      ? itemEditando.precio / 1.13
      : itemEditando.precio;
    const itemConPrecioBase = { ...itemEditando, precio: precioFinal };
    setCarrito(prev => {
      const idx = prev.findIndex(item => item._key === itemEditando._key);
      if (idx >= 0) {
        const nueva = [...prev];
        nueva[idx] = itemConPrecioBase;
        return nueva;
      }
      return [...prev, { ...itemConPrecioBase, _key: Date.now() + Math.random() }];
    });
    setDialogoItem(false);
    setItemEditando(null);
  };

  const editarItem = (item) => {
    setItemEditando({ ...item });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  };

  const cambiarCantidad = (key, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item._key !== key) return item;
      const nueva = item.cantidad + delta;
      return nueva <= 0 ? null : { ...item, cantidad: nueva };
    }).filter(Boolean));
  };

  const quitarDelCarrito = (key) => {
    setCarrito(prev => prev.filter(item => item._key !== key));
  };

  const calcItem = (item) => {
    const subtotal = item.precio * item.cantidad;
    const descuento = item.descuentoTipo === 'porcentaje'
      ? subtotal * (item.descuentoValor || 0) / 100
      : (item.descuentoValor || 0);
    const subtotalDesc = subtotal - descuento;
    const ivaVal = item.tipoIva === 'gravado' ? subtotalDesc * 0.13 : 0;
    const iva = redondear(ivaVal);
    const total = redondear(subtotalDesc + iva);
    return { subtotal, descuento, subtotalDesc, iva, total };
  };

  const resumen = useMemo(() => {
    let subtotal = 0, descuentoTotal = 0, ivaTotal = 0, total = 0;
    const porTipo = { gravado: 0, exento: 0, noSujeto: 0, noGravado: 0 };
    carrito.forEach(item => {
      const c = calcItem(item);
      subtotal += c.subtotal;
      descuentoTotal += c.descuento;
      ivaTotal += c.iva;
      total += c.total;
      porTipo[item.tipoIva] += c.subtotalDesc;
    });

    const aplicaRetencion = esGranContribuyente && porTipo.gravado >= 100;
    const retencionVal = aplicaRetencion ? Number((porTipo.gravado * 0.01).toFixed(4)) : 0;
    const retencion = Number(retencionVal.toFixed(2));
    const totalCobrar = Number((total - retencion).toFixed(2));

    return { 
      subtotal, 
      descuentoTotal, 
      ivaTotal, 
      total, 
      porTipo, 
      retencion, 
      aplicaRetencion, 
      totalCobrar 
    };
  }, [carrito, esGranContribuyente, tipoDte]);

  const cobrar = () => {
    setDialogoPago(false);
    setPagoExitoso(true);
    setCarrito([]);
    setTimeout(() => setPagoExitoso(false), 3000);
  };

  return (
    <div className="premium-fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden', maxWidth: '100%', boxSizing: 'border-box' }}>

      {pagoExitoso && (
        <div className="flex align-items-center gap-2 p-3 border-round-xl premium-fade-in-fast" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 1000, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' }}>
          <i className="pi pi-check-circle text-xl" style={{ color: '#10b981' }}></i>
          <div>
            <p className="font-bold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>Pago exitoso</p>
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>La venta se ha registrado correctamente</p>
          </div>
        </div>
      )}

      <div className="flex" style={{ gap: '1rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ===== LEFT: Products Panel ===== */}
        <div className="flex-1 flex flex-column" style={{ gap: '1rem', minWidth: 0, overflow: 'hidden' }}>
          <div className="premium-surface-card p-3 flex flex-column sm:flex-row gap-3 align-items-start sm:align-items-center">
            <div className="premium-input-group flex-1" style={{ maxWidth: '360px' }}>
              <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.85rem' }}></i>
              <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="w-full" />
            </div>
            <div className="flex align-items-center gap-2 flex-wrap">
              {CATEGORIAS.map(cat => (
                <button key={cat} onClick={() => setCategoriaActiva(cat)}
                  className="border-none border-round-xl cursor-pointer px-3 py-2 text-sm font-semibold transition-all transition-duration-200"
                  style={{
                    background: categoriaActiva === cat ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface-hover)',
                    color: categoriaActiva === cat ? '#fff' : 'var(--text-secondary)'
                  }}>
                  {cat}
                </button>
              ))}
              <button onClick={togglePantallaCompleta} title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
                className="flex align-items-center justify-content-center border-none border-round-xl cursor-pointer transition-all transition-duration-200"
                style={{ width: '36px', height: '36px', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-border-light)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}>
                <i className={`pi ${pantallaCompleta ? 'pi-window-minimize' : 'pi-window-maximize'} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="flex-1 premium-surface-card p-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            {productosFiltrados.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center" style={{ height: '100%', opacity: 0.5 }}>
                <i className="pi pi-box text-6xl mb-3" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-lg font-semibold m-0" style={{ color: 'var(--text-icon)' }}>No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid">
                {productosFiltrados.map(producto => (
                  <div key={producto.id} className="col-6 sm:col-4 lg:col-3 xl:col-2">
                    <button onClick={() => abrirPersonalizar(producto)}
                      className="w-full border-none border-round-xl p-3 cursor-pointer transition-all transition-duration-200 flex flex-column align-items-center gap-2"
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--surface-border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = '0 8px 25px -8px rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--surface-border-light)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}>
                      <div className="flex align-items-center justify-content-center border-circle" style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
                        <i className={`${producto.icono} text-lg`} style={{ color: '#6366f1' }}></i>
                      </div>
                      <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)', lineHeight: '1.2' }}>{producto.nombre}</span>
                      <span className="text-sm font-bold" style={{ color: '#6366f1' }}>
                        ${(tipoDte === '03' ? producto.precio : (producto.tipoIva === 'gravado' ? redondear(producto.precio * 1.13) : producto.precio)).toFixed(2)}
                        {tipoDte !== '03' && producto.tipoIva === 'gravado' && <span className="text-2xs font-normal" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}> (IVA incl.)</span>}
                      </span>
                      <Tag value={ETIQUETA_IVA[producto.tipoIva].label} severity={ETIQUETA_IVA[producto.tipoIva].severity} className="premium-tag" style={{ fontSize: '0.6rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Cart Panel ===== */}
        <div className="flex flex-column premium-surface-card" style={{ width: '34%', minWidth: '260px', maxWidth: '380px', flexShrink: 0 }}>
          <div className="p-3 border-bottom-1 surface-border flex align-items-center justify-content-between">
            <div className="flex align-items-center gap-2">
              <div className="flex align-items-center justify-content-center border-circle" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <i className="pi pi-shopping-cart text-white text-sm"></i>
              </div>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Venta Actual</span>
            </div>
            <Tag value={`${carrito.reduce((s, i) => s + i.cantidad, 0)} items`} className="premium-tag" severity="info" />
          </div>

          <button onClick={() => setDialogoCliente(true)} className="w-full border-none cursor-pointer p-3 border-bottom-1 surface-border flex align-items-center gap-3 transition-all transition-duration-200" style={{ background: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div className="flex align-items-center justify-content-center border-circle" style={{ width: '36px', height: '36px', minWidth: '36px', background: cliente === 0 ? 'var(--surface-border-light)' : 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <i className={`${cliente === 0 ? 'pi pi-user' : 'pi pi-user-check'} text-sm`} style={{ color: cliente === 0 ? 'var(--text-muted)' : '#fff' }}></i>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cliente</p>
              <p className="font-semibold m-0 text-sm flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {CLIENTES.find(c => c.value === cliente)?.label}
                {CLIENTES.find(c => c.value === cliente)?.granContribuyente && (
                  <Tag value="GC" severity="warning" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem' }} />
                )}
              </p>
            </div>
            <i className="pi pi-chevron-down text-xs" style={{ color: 'var(--text-icon)', flexShrink: 0 }}></i>
          </button>

          {cliente !== 0 && (
            <div className="px-3 py-2 flex align-items-center justify-content-between border-bottom-1 surface-border" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-percentage text-xs" style={{ color: esGranContribuyente ? '#f59e0b' : 'var(--text-icon)' }}></i>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Gran Contribuyente</span>
              </div>
              <button 
                onClick={() => setEsGranContribuyente(!esGranContribuyente)}
                className="border-none cursor-pointer p-1 px-2 border-round text-xs font-bold transition-all transition-duration-200"
                style={{
                  background: esGranContribuyente ? 'rgba(245,158,11,0.15)' : 'var(--surface-hover)',
                  color: esGranContribuyente ? '#f59e0b' : 'var(--text-muted)',
                  border: esGranContribuyente ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--surface-border-light)'
                }}
              >
                {esGranContribuyente ? 'Retención Activa' : 'Desactivada'}
              </button>
            </div>
          )}

          <div className="px-3 py-2 border-bottom-1 surface-border flex flex-column gap-2" style={{ background: 'var(--surface-ground-light)' }}>
            <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Tipo de DTE</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TIPOS_DTE.map(t => {
                const esActivo = tipoDte === t.value;
                return (
                  <button key={t.value} onClick={() => setTipoDte(t.value)}
                    className="border-none cursor-pointer p-2 flex align-items-center justify-content-center gap-2 transition-all transition-duration-150"
                    style={{
                      background: esActivo ? `${t.color}15` : 'transparent',
                      border: `1.5px solid ${esActivo ? t.color : 'var(--surface-border-light)'}`,
                      borderRadius: '8px',
                      color: esActivo ? t.color : 'var(--text-secondary)',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => { if (!esActivo) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                    onMouseLeave={(e) => { if (!esActivo) e.currentTarget.style.background = 'transparent'; }}>
                    <i className={`${t.icon} text-xs`} style={{ color: esActivo ? t.color : 'var(--text-icon)' }}></i>
                    <span className="font-bold" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{t.label.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '0.75rem' }}>
            {carrito.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center" style={{ height: '100%', opacity: 0.4 }}>
                <i className="pi pi-cart-arrow-down text-5xl mb-2" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-icon)' }}>Carrito vacío</p>
                <p className="text-xs m-0" style={{ color: 'var(--text-icon)' }}>Seleccione productos</p>
              </div>
            ) : (
              <div className="flex flex-column gap-2">
                {carrito.map(item => {
                  const c = calcItem(item);
                  return (
                    <div key={item._key} className="p-2 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
                      <div className="flex align-items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.nombre}</span>
                        </div>
                        <div className="flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                          <Tag value={ETIQUETA_IVA[item.tipoIva].label} severity={ETIQUETA_IVA[item.tipoIva].severity} style={{ fontSize: '0.55rem', padding: '0 0.4rem', height: '16px' }} />
                          <span className="font-bold text-sm" style={{ color: c.iva > 0 ? '#6366f1' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>${c.total.toFixed(2)}</span>
                          <button onClick={() => quitarDelCarrito(item._key)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '20px', height: '20px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.55rem', flexShrink: 0 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
                            <i className="pi pi-trash" style={{ fontSize: '0.6rem' }}></i>
                          </button>
                        </div>
                      </div>
                      <div className="flex align-items-center gap-2" style={{ marginTop: '4px' }}>
                        <div className="flex align-items-center" style={{ gap: '2px' }}>
                          <button onClick={() => cambiarCantidad(item._key, -1)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '24px', height: '24px', background: 'var(--surface-border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--text-icon)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-border-light)'}>−</button>
                          <span className="font-bold text-center" style={{ width: '22px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.cantidad}</span>
                          <button onClick={() => cambiarCantidad(item._key, 1)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '24px', height: '24px', background: 'var(--surface-border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--text-icon)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-border-light)'}>+</button>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          × ${(tipoDte === '03' ? item.precio : (item.tipoIva === 'gravado' ? redondear(item.precio * 1.13) : item.precio)).toFixed(2)}
                          {tipoDte !== '03' && item.tipoIva === 'gravado' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}> c/IVA</span>}
                        </span>
                        {item.descuentoValor > 0 && <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>−{item.descuentoTipo === 'porcentaje' ? `${item.descuentoValor}%` : `$${item.descuentoValor}`}</span>}
                        <button onClick={() => editarItem(item)} className="border-none bg-transparent cursor-pointer p-0 flex align-items-center text-xs" style={{ color: '#6366f1', marginLeft: 'auto' }}>
                          <i className="pi pi-pencil" style={{ fontSize: '0.6rem' }}></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-top-1 surface-border flex flex-column gap-3">
            <div className="flex flex-column gap-1">
              <div className="flex justify-content-between mb-1">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total de items</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span>
              </div>
              {resumen.porTipo.gravado > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#6366f1' }}> Gravado</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.gravado.toFixed(2)}</span>
                </div>
              )}
              {resumen.porTipo.exento > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#10b981' }}> Exento</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.exento.toFixed(2)}</span>
                </div>
              )}
              {resumen.porTipo.noSujeto > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}> No Sujeto</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noSujeto.toFixed(2)}</span>
                </div>
              )}
              {resumen.porTipo.noGravado > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}> No Gravado</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noGravado.toFixed(2)}</span>
                </div>
              )}
              {resumen.descuentoTotal > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Descuentos</span>
                  <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>-${resumen.descuentoTotal.toFixed(2)}</span>
                </div>
              )}
              {resumen.ivaTotal > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>IVA (13%)</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>${resumen.ivaTotal.toFixed(2)}</span>
                </div>
              )}
              {resumen.retencion > 0 && (
                <div className="flex justify-content-between">
                  <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Retención (1%)</span>
                  <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>-${resumen.retencion.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-content-between pt-2 border-top-1 surface-border">
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total a cobrar</span>
                <span className="font-bold text-xl" style={{ color: '#6366f1' }}>${resumen.totalCobrar.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-1">
              {METODOS_PAGO.map(m => (
                <button key={m.value} onClick={() => setMetodoPago(m.value)}
                  className="flex-1 flex flex-column align-items-center gap-1 p-1 border-round-lg border-none cursor-pointer transition-all transition-duration-200"
                  style={{
                    background: metodoPago === m.value ? `${COLOR_PAGO[m.value]}20` : 'var(--surface-muted)',
                    border: `1.5px solid ${metodoPago === m.value ? COLOR_PAGO[m.value] : 'var(--surface-border-light)'}`
                  }}>
                  <i className={`${m.icono} text-xs`} style={{ color: metodoPago === m.value ? COLOR_PAGO[m.value] : 'var(--text-icon)' }}></i>
                  <span className="text-xs font-semibold" style={{ color: metodoPago === m.value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.6rem' }}>{m.label}</span>
                </button>
              ))}
            </div>

            <Button label="Cobrar" icon="pi pi-credit-card" className="premium-btn w-full" style={{ fontSize: '1.05rem' }}
              onClick={() => { if (carrito.length > 0) { setEfectivoRecibido(null); setPlazoValor(1); setPlazoTipo('meses'); setReferenciaPago(''); setDialogoPago(true); }}} disabled={carrito.length === 0} />
          </div>
        </div>
      </div>

      {/* ===== Product Customization Dialog ===== */}
      <Dialog header="Personalizar producto" visible={dialogoItem} style={{ width: '580px' }}
        onHide={() => { setDialogoItem(false); setItemEditando(null); }} draggable={false} resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => { setDialogoItem(false); setItemEditando(null); }} />
            <Button label={carrito.find(i => i._key === itemEditando?._key) ? 'Actualizar' : 'Agregar al Carrito'} icon="pi pi-cart-plus" className="premium-btn" onClick={agregarAlCarrito} />
          </div>
        }>
        {itemEditando && (() => {
          const basePrice = (precioIncluyeIva && itemEditando.tipoIva === 'gravado')
            ? itemEditando.precio / 1.13
            : itemEditando.precio;
          const sub = basePrice * itemEditando.cantidad;
          const d = itemEditando.descuentoTipo === 'porcentaje' ? sub * (itemEditando.descuentoValor || 0) / 100 : (itemEditando.descuentoValor || 0);
          const subtotalDesc = sub - d;
          const iva = itemEditando.tipoIva === 'gravado' ? redondear(subtotalDesc * 0.13) : 0;
          return (
            <div className="flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="flex flex-column gap-1">
                <label className="premium-label">Nombre del producto</label>
                <InputText value={itemEditando.nombre} onChange={(e) => setItemEditando({ ...itemEditando, nombre: e.target.value })}
                  className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex flex-column gap-1">
                  <div className="flex justify-content-between align-items-center">
                    <label className="premium-label">Precio unitario</label>
                    <div className="flex border-1 surface-border border-round-lg overflow-hidden" style={{ height: '22px' }}>
                      <button type="button" onClick={() => cambiarModoIvaPrecio(false)}
                        className="border-none cursor-pointer px-2 text-2xs font-bold transition-all transition-duration-150"
                        style={{ background: !precioIncluyeIva ? '#6366f1' : 'var(--card-bg)', color: !precioIncluyeIva ? '#fff' : 'var(--text-muted)', fontSize: '0.62rem' }}>Sin IVA</button>
                      <button type="button" onClick={() => cambiarModoIvaPrecio(true)}
                        className="border-none cursor-pointer px-2 text-2xs font-bold transition-all transition-duration-150"
                        style={{ background: precioIncluyeIva ? '#6366f1' : 'var(--card-bg)', color: precioIncluyeIva ? '#fff' : 'var(--text-muted)', fontSize: '0.62rem' }}>Con IVA</button>
                    </div>
                  </div>
                  <InputNumber value={itemEditando.precio} onValueChange={(e) => setItemEditando({ ...itemEditando, precio: e.value || 0 })}
                    min={0} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} onFocus={(e) => e.target.select()} />
                </div>
                <div className="flex-1 flex flex-column gap-1">
                  <label className="premium-label">Cantidad</label>
                  <InputNumber value={itemEditando.cantidad} onValueChange={(e) => setItemEditando({ ...itemEditando, cantidad: e.value || 1 })}
                    min={1} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} onFocus={(e) => e.target.select()} />
                </div>
              </div>

              <div className="flex flex-column gap-1">
                <label className="premium-label">Tipo de IVA</label>
                <div className="flex gap-1">
                  {['gravado', 'exento', 'noSujeto', 'noGravado'].map(t => (
                    <button key={t} onClick={() => setItemEditando({ ...itemEditando, tipoIva: t })}
                      className="flex-1 border-round-xl border-none cursor-pointer py-2 text-xs font-semibold transition-all transition-duration-200"
                      style={{
                        background: itemEditando.tipoIva === t ? `${t === 'gravado' ? '#6366f1' : t === 'exento' ? '#10b981' : t === 'noSujeto' ? '#f59e0b' : '#64748b'}` : 'var(--surface-hover)',
                        color: itemEditando.tipoIva === t ? '#fff' : 'var(--text-secondary)'
                      }}>
                      {ETIQUETA_IVA[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-column gap-1">
                <label className="premium-label">Descuento</label>
                <div className="flex gap-2 align-items-center">
                  <div className="flex border-round-xl overflow-hidden" style={{ border: '1.5px solid var(--surface-border-light)', flexShrink: 0, height: '40px' }}>
                    <button onClick={() => setItemEditando({ ...itemEditando, descuentoTipo: 'porcentaje', descuentoValor: 0 })}
                      className="border-none cursor-pointer px-3 text-sm font-semibold transition-all transition-duration-200"
                      style={{ background: itemEditando.descuentoTipo === 'porcentaje' ? '#6366f1' : 'var(--card-bg)', color: itemEditando.descuentoTipo === 'porcentaje' ? '#fff' : 'var(--text-muted)', height: '100%' }}>%</button>
                    <button onClick={() => setItemEditando({ ...itemEditando, descuentoTipo: 'monto', descuentoValor: 0 })}
                      className="border-none cursor-pointer px-3 text-sm font-semibold transition-all transition-duration-200"
                      style={{ background: itemEditando.descuentoTipo === 'monto' ? '#6366f1' : 'var(--card-bg)', color: itemEditando.descuentoTipo === 'monto' ? '#fff' : 'var(--text-muted)', height: '100%' }}>$</button>
                  </div>
                  <InputNumber value={itemEditando.descuentoValor} onValueChange={(e) => setItemEditando({ ...itemEditando, descuentoValor: e.value || 0 })}
                    min={0} max={itemEditando.descuentoTipo === 'porcentaje' ? 100 : undefined} className="w-full"
                    inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }}
                    minFractionDigits={2} maxFractionDigits={2}
                    placeholder={itemEditando.descuentoTipo === 'porcentaje' ? '0.00%' : '$0.00'}
                    onFocus={(e) => e.target.select()} />
                </div>
              </div>

              <div className="p-3 border-round-xl" style={{ background: 'var(--surface-muted)', border: '1px solid var(--surface-border-light)', overflowX: 'hidden' }}>
                <div className="flex flex-column gap-1">
                  <div className="flex justify-content-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>
                      {itemEditando.cantidad} x ${basePrice.toFixed(2)}
                      {precioIncluyeIva && itemEditando.tipoIva === 'gravado' && <span style={{ fontSize: '0.72rem', opacity: 0.75 }}> (${itemEditando.precio.toFixed(2)} c/IVA)</span>}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>${sub.toFixed(2)}</span>
                  </div>
                  {d > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Descuento</span><span className="font-semibold" style={{ color: '#ef4444' }}>-${d.toFixed(2)}</span></div>}
                  <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>IVA ({itemEditando.tipoIva === 'gravado' ? '13%' : '0%'})</span><span style={{ color: 'var(--text-muted)' }}>${iva.toFixed(2)}</span></div>
                  <div className="flex justify-content-between font-bold pt-1 border-top-1 surface-border"><span style={{ color: 'var(--text-primary)' }}>Total item</span><span className="text-lg" style={{ color: '#6366f1' }}>${(subtotalDesc + iva).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* ===== Payment Confirmation Dialog ===== */}
      <Dialog header="Confirmar Cobro" visible={dialogoPago} style={{ width: '500px' }} onHide={() => setDialogoPago(false)} draggable={false} resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setDialogoPago(false)} />
            <Button label="Confirmar Pago" icon="pi pi-check" className="premium-btn" onClick={cobrar} disabled={metodoPago === 'efectivo' && (!efectivoRecibido || efectivoRecibido < resumen.totalCobrar)} />
          </div>
        }>
        <div className="flex flex-column gap-3 py-2">
          <div className="flex align-items-center gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
            <div className="flex align-items-center justify-content-center border-circle" style={{ width: '48px', height: '48px', minWidth: '48px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <i className="pi pi-file text-white"></i>
            </div>
            <div>
              <p className="font-bold m-0" style={{ color: 'var(--text-primary)' }}>{CLIENTES.find(c => c.value === cliente)?.label}</p>
              <div className="flex align-items-center gap-2 mt-1 flex-wrap">
                <Tag value={TIPOS_DTE.find(t => t.value === tipoDte)?.label} severity="info" style={{ fontSize: '0.65rem' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• {METODOS_PAGO.find(m => m.value === metodoPago)?.label}</span>
              </div>
            </div>
          </div>

          {metodoPago === 'efectivo' && (
            <div className="flex flex-column gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex flex-column gap-1">
                <label className="premium-label">Efectivo Recibido</label>
                <InputNumber value={efectivoRecibido} onValueChange={(e) => setEfectivoRecibido(e.value)} min={0} minFractionDigits={2} maxFractionDigits={2}
                  className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                  placeholder="$0.00" onFocus={(e) => e.target.select()} />
              </div>
              {efectivoRecibido > 0 && (
                <div className="flex flex-column gap-1">
                  <div className="flex justify-content-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Total</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${resumen.totalCobrar.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-content-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Efectivo</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${efectivoRecibido.toFixed(2)}</span>
                  </div>
                  <hr className="premium-divider" />
                  <div className="flex justify-content-between">
                    <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>Cambio</span>
                    <span className="font-bold text-xl" style={{ color: efectivoRecibido >= resumen.totalCobrar ? '#10b981' : '#ef4444' }}>${(efectivoRecibido - resumen.totalCobrar).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {metodoPago === 'tarjeta' && (
            <div className="flex flex-column gap-2 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex flex-column gap-1">
                <label className="premium-label">N° de Autorización <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label>
                <InputText value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Ej. AUTH-98765" className="w-full" style={{ borderRadius: '10px', padding: '0.6rem 0.75rem' }} />
              </div>
            </div>
          )}

          {metodoPago === 'credito' && (
            <div className="flex flex-column gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <label className="premium-label">Plazo del crédito</label>
              <div style={{ maxWidth: '160px' }}>
                <InputNumber value={plazoValor} onValueChange={(e) => setPlazoValor(e.value || 1)} min={1} max={999}
                  maxFractionDigits={0} useGrouping={false} inputStyle={{ borderRadius: '10px', padding: '0.6rem 0.75rem', textAlign: 'center' }} onFocus={(e) => e.target.select()} />
              </div>
              <div className="flex gap-1">
                {['días', 'meses', 'años'].map(t => (
                  <button key={t} onClick={() => setPlazoTipo(t)}
                    className="flex-1 border-round-xl border-none cursor-pointer py-2 text-xs font-semibold transition-all transition-duration-200"
                    style={{ background: plazoTipo === t ? '#f59e0b' : 'var(--surface-hover)', color: plazoTipo === t ? '#fff' : 'var(--text-secondary)' }}>{t}</button>
                ))}
              </div>
              <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>Pago a {plazoValor} {plazoTipo}</p>
            </div>
          )}

          {metodoPago === 'transferencia' && (
            <div className="flex flex-column gap-2 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
              <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: `${COLOR_PAGO.transferencia}15` }}>
                <i className="pi pi-info-circle text-sm" style={{ color: COLOR_PAGO.transferencia }}></i>
                <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>La transferencia se procesará a través de la pasarela de pagos.</p>
              </div>
              <div className="flex flex-column gap-1">
                <label className="premium-label">N° de Transferencia <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label>
                <InputText value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Ej. REF-12345" className="w-full" style={{ borderRadius: '10px', padding: '0.6rem 0.75rem' }} />
              </div>
            </div>
          )}

          <div className="border-top-1 surface-border pt-2 flex flex-column gap-1">
            <div className="flex justify-content-between text-sm mb-1"><span style={{ color: 'var(--text-muted)' }}>Total de items</span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span></div>
            {resumen.porTipo.gravado > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#6366f1' }}> Gravado</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.gravado.toFixed(2)}</span></div>}
            {resumen.porTipo.exento > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#10b981' }}> Exento</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.exento.toFixed(2)}</span></div>}
            {resumen.porTipo.noSujeto > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#f59e0b' }}> No Sujeto</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noSujeto.toFixed(2)}</span></div>}
            {resumen.porTipo.noGravado > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: 'var(--text-muted)' }}> No Gravado</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noGravado.toFixed(2)}</span></div>}
            {resumen.descuentoTotal > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Descuentos</span><span className="font-semibold" style={{ color: '#ef4444' }}>-${resumen.descuentoTotal.toFixed(2)}</span></div>}
            {resumen.ivaTotal > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>IVA (13%)</span><span style={{ color: 'var(--text-muted)' }}>${resumen.ivaTotal.toFixed(2)}</span></div>}
            {resumen.retencion > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#f59e0b' }}>Retención 1%</span><span className="font-semibold" style={{ color: '#f59e0b' }}>-${resumen.retencion.toFixed(2)}</span></div>}
            <div className="flex justify-content-between pt-1 border-top-1 surface-border">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total a cobrar</span>
              <span className="font-bold text-xl" style={{ color: '#6366f1' }}>${resumen.totalCobrar.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Dialog>

      {/* ===== Customer Selection Dialog ===== */}
      <Dialog header="Seleccionar Cliente" visible={dialogoCliente} style={{ width: '480px' }} onHide={() => { setDialogoCliente(false); setBusquedaCliente(''); }} draggable={false} resizable={false}>
        <div className="flex flex-column gap-3">
          <div className="premium-input-group">
            <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.85rem' }}></i>
            <InputText value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Buscar por nombre o NIT..." className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} autoFocus />
          </div>
          <div className="flex flex-column gap-1" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {clientesFiltrados.length === 0 ? (
              <div className="flex flex-column align-items-center gap-2 py-5" style={{ opacity: 0.5 }}>
                <i className="pi pi-users text-4xl" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-icon)' }}>No se encontraron clientes</p>
              </div>
            ) : (
              clientesFiltrados.map(c => (
                <button key={c.value} onClick={() => { setCliente(c.value); setDialogoCliente(false); setBusquedaCliente(''); }}
                  className="w-full border-none border-round-xl cursor-pointer p-3 flex align-items-center gap-3 transition-all transition-duration-200"
                  style={{ background: cliente === c.value ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                  onMouseEnter={(e) => { if (cliente !== c.value) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                  onMouseLeave={(e) => { if (cliente !== c.value) e.currentTarget.style.background = 'transparent'; }}>
                  <div className="flex align-items-center justify-content-center border-circle" style={{ width: '40px', height: '40px', minWidth: '40px', background: cliente === c.value ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface-hover)' }}>
                    <i className={`pi ${c.value === 0 ? 'pi-user' : 'pi-user-check'} text-sm`} style={{ color: cliente === c.value ? '#fff' : 'var(--text-muted)' }}></i>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex align-items-center gap-2">
                      <p className="font-semibold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>{c.label}</p>
                      {c.granContribuyente && <Tag value="Gran Contribuyente" severity="warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }} />}
                    </div>
                    <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>{c.nit}</p>
                  </div>
                  {cliente === c.value && <i className="pi pi-check text-sm" style={{ color: '#6366f1', flexShrink: 0 }}></i>}
                </button>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
