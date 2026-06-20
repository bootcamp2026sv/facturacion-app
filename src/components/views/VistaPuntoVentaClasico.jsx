import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";

const PRODUCTOS = [
  {
    id: 1,
    nombre: "Coca-Cola 355ml",
    precio: 1.5,
    categoria: "Bebidas",
    icono: "pi pi-glass",
    tipoIva: "gravado",
  },
  {
    id: 2,
    nombre: "Agua Pura 500ml",
    precio: 1.0,
    categoria: "Bebidas",
    icono: "pi pi-glass",
    tipoIva: "exento",
  },
  {
    id: 3,
    nombre: "Jugo de Naranja",
    precio: 2.0,
    categoria: "Bebidas",
    icono: "pi pi-glass",
    tipoIva: "gravado",
  },
  {
    id: 4,
    nombre: "Café Americano",
    precio: 2.5,
    categoria: "Bebidas",
    icono: "pi pi-glass",
    tipoIva: "gravado",
  },
  {
    id: 5,
    nombre: "Hamburguesa Clásica",
    precio: 5.5,
    categoria: "Comidas",
    icono: "pi pi-shopping-cart",
    tipoIva: "gravado",
  },
  {
    id: 6,
    nombre: "Pizza Personal",
    precio: 6.0,
    categoria: "Comidas",
    icono: "pi pi-shopping-cart",
    tipoIva: "gravado",
  },
  {
    id: 7,
    nombre: "Papas Fritas Grandes",
    precio: 3.0,
    categoria: "Comidas",
    icono: "pi pi-shopping-cart",
    tipoIva: "exento",
  },
  {
    id: 8,
    nombre: "Nachos con Queso",
    precio: 4.0,
    categoria: "Comidas",
    icono: "pi pi-shopping-cart",
    tipoIva: "gravado",
  },
  {
    id: 9,
    nombre: "Pastel de Chocolate",
    precio: 3.5,
    categoria: "Postres",
    icono: "pi pi-star",
    tipoIva: "noSujeto",
  },
  {
    id: 10,
    nombre: "Helado Vainilla",
    precio: 2.5,
    categoria: "Postres",
    icono: "pi pi-star",
    tipoIva: "gravado",
  },
  {
    id: 11,
    nombre: "Flan Caramelo",
    precio: 3.0,
    categoria: "Postres",
    icono: "pi pi-star",
    tipoIva: "gravado",
  },
  {
    id: 12,
    nombre: "Cheesecake",
    precio: 4.5,
    categoria: "Postres",
    icono: "pi pi-star",
    tipoIva: "noGravado",
  },
];

const CLIENTES = [
  { label: "Consumidor Final", value: 0, nit: "Consumidor Final", granContribuyente: false },
  {
    label: "Distribuidora Alimentos S.A. de C.V.",
    value: 1,
    nit: "0614-150882-101-1",
    granContribuyente: true,
  },
  { label: "Juan Carlos Pérez", value: 2, nit: "01234567-8", granContribuyente: false },
  {
    label: "Tecnología Integrada S.A. de C.V.",
    value: 3,
    nit: "0614-210398-102-3",
    granContribuyente: true,
  },
  { label: "María José Rodríguez", value: 4, nit: "02468101-3", granContribuyente: false },
  { label: "Constructora del Valle S.A.", value: 5, nit: "0614-050783-101-7", granContribuyente: false },
  { label: "Supermercados Unidos S.A.", value: 6, nit: "0614-120195-104-2", granContribuyente: true },
  { label: "Ana Lucía Hernández", value: 7, nit: "03691245-6", granContribuyente: false },
];

const METODOS_PAGO = [
  { label: "Efectivo", value: "efectivo", icono: "pi pi-money-bill" },
  { label: "Tarjeta", value: "tarjeta", icono: "pi pi-credit-card" },
  { label: "Crédito", value: "credito", icono: "pi pi-clock" },
  { label: "Transferencia", value: "transferencia", icono: "pi pi-building" },
];

const TIPOS_DTE = [
  { label: "Factura (DTE 01)", value: "01", icon: "pi pi-user", color: "#10b981" },
  { label: "Crédito Fiscal (DTE 03)", value: "03", icon: "pi pi-briefcase", color: "#6366f1" },
  { label: "Sujeto Excluido (DTE 14)", value: "14", icon: "pi pi-user-minus", color: "#f59e0b" },
  { label: "Exportación (DTE 11)", value: "11", icon: "pi pi-globe", color: "#8b5cf6" },
];

const CATEGORIAS = ["Todas", "Bebidas", "Comidas", "Postres"];

const ETIQUETA_IVA = {
  gravado: { label: "IVA 13%", severity: "info" },
  exento: { label: "Exento", severity: "success" },
  noSujeto: { label: "No Sujeto", severity: "warning" },
  noGravado: { label: "No Gravado", severity: "secondary" },
};

export default function VistaPuntoVentaClasico() {
  const redondear = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [productoSeleccionado, setProductoSeleccionado] = useState(0);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [dialogoPago, setDialogoPago] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [esGranContribuyente, setEsGranContribuyente] = useState(false);
  const [tipoDte, setTipoDte] = useState("01");

  useEffect(() => {
    const cli = CLIENTES.find((c) => c.value === cliente);
    setEsGranContribuyente(!!cli?.granContribuyente);
  }, [cliente]);

  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [dialogoItem, setDialogoItem] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [dialogoCliente, setDialogoCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [efectivoRecibido, setEfectivoRecibido] = useState(null);
  const buscadorRef = useRef(null);
  const [plazoValor, setPlazoValor] = useState(1);
  const [plazoTipo, setPlazoTipo] = useState("meses");
  const [referenciaPago, setReferenciaPago] = useState("");
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

  const togglePantallaCompleta = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const manejarCambio = () => {
      setPantallaCompleta(!!document.fullscreenElement);
      document.body.style.overflow = document.fullscreenElement ? "hidden" : "";
    };
    document.addEventListener("fullscreenchange", manejarCambio);
    return () =>
      document.removeEventListener("fullscreenchange", manejarCambio);
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return CLIENTES;
    const q = busquedaCliente.toLowerCase();
    return CLIENTES.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    );
  }, [busquedaCliente]);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return PRODUCTOS.filter((p) => {
      const codigo = String(p.id).padStart(3, "0");
      if (categoriaActiva !== "Todas" && p.categoria !== categoriaActiva)
        return false;
      if (
        q &&
        !p.nombre.toLowerCase().includes(q) &&
        !codigo.includes(q) &&
        !p.categoria.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [busqueda, categoriaActiva]);

  const categoriasConConteo = useMemo(() => {
    return CATEGORIAS.map((cat) => ({
      nombre: cat,
      total:
        cat === "Todas"
          ? PRODUCTOS.length
          : PRODUCTOS.filter((p) => p.categoria === cat).length,
    }));
  }, []);

  const clienteSeleccionado = useMemo(
    () => CLIENTES.find((c) => c.value === cliente) || CLIENTES[0],
    [cliente],
  );

  const cantidadItems = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad, 0),
    [carrito],
  );

  const indiceProductoActivo = Math.min(
    productoSeleccionado,
    Math.max(productosFiltrados.length - 1, 0),
  );

  const abrirDialogoPago = useCallback(() => {
    if (carrito.length === 0) return;
    setEfectivoRecibido(null);
    setPlazoValor(1);
    setPlazoTipo("meses");
    setReferenciaPago("");
    setDialogoPago(true);
  }, [carrito.length]);

  useEffect(() => {
    const manejarAtajos = (e) => {
      if (dialogoItem || dialogoPago || dialogoCliente) return;

      if (e.key === "F2") {
        e.preventDefault();
        buscadorRef.current?.focus?.();
        buscadorRef.current?.select?.();
        return;
      }

      if (e.key === "F4") {
        e.preventDefault();
        setDialogoCliente(true);
        return;
      }

      if (e.key === "F9") {
        e.preventDefault();
        abrirDialogoPago();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (productosFiltrados.length === 0) return;
        setProductoSeleccionado((prev) =>
          Math.min(prev + 1, productosFiltrados.length - 1),
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setProductoSeleccionado((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && productosFiltrados[indiceProductoActivo]) {
        e.preventDefault();
        abrirPersonalizar(productosFiltrados[indiceProductoActivo]);
      }
    };

    window.addEventListener("keydown", manejarAtajos);
    return () => window.removeEventListener("keydown", manejarAtajos);
  }, [
    abrirDialogoPago,
    dialogoCliente,
    dialogoItem,
    dialogoPago,
    indiceProductoActivo,
    productosFiltrados,
  ]);

  function abrirPersonalizar(producto) {
    if (producto.lineaLibre) {
      setCarrito((prev) => {
        const existente = prev.find((item) => item.id === producto.id);
        if (existente) {
          return prev.map((item) =>
            item.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item,
          );
        }
        return [
          ...prev,
          {
            ...producto,
            _key: Date.now() + Math.random(),
            cantidad: 1,
            descuentoTipo: "porcentaje",
            descuentoValor: 0,
          },
        ];
      });
      return;
    }
    setItemEditando({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      descuentoTipo: "porcentaje",
      descuentoValor: 0,
      tipoIva: producto.tipoIva,
    });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  }

  const agregarAlCarrito = () => {
    if (!itemEditando) return;
    const precioFinal = (precioIncluyeIva && itemEditando.tipoIva === 'gravado')
      ? itemEditando.precio / 1.13
      : itemEditando.precio;
    const itemConPrecioBase = { ...itemEditando, precio: precioFinal };
    setCarrito((prev) => {
      const idx = prev.findIndex((item) => item._key === itemEditando._key);
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
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item._key !== key) return item;
          const nueva = item.cantidad + delta;
          return nueva <= 0 ? null : { ...item, cantidad: nueva };
        })
        .filter(Boolean),
    );
  };

  const quitarDelCarrito = (key) => {
    setCarrito((prev) => prev.filter((item) => item._key !== key));
  };

  const calcItem = (item) => {
    const subtotal = item.precio * item.cantidad;
    const descuento =
      item.descuentoTipo === "porcentaje"
        ? (subtotal * (item.descuentoValor || 0)) / 100
        : item.descuentoValor || 0;
    const subtotalDesc = subtotal - descuento;
    const ivaVal = item.tipoIva === "gravado" ? subtotalDesc * 0.13 : 0;
    const iva = redondear(ivaVal);
    const total = redondear(subtotalDesc + iva);
    return {
      subtotal,
      descuento,
      subtotalDesc,
      iva,
      total,
    };
  };

  const resumen = useMemo(() => {
    let subtotal = 0,
      descuentoTotal = 0,
      ivaTotal = 0,
      total = 0;
    const porTipo = { gravado: 0, exento: 0, noSujeto: 0, noGravado: 0 };
    carrito.forEach((item) => {
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
    <div
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {pagoExitoso && (
        <div
          style={{
            position: "fixed",
            top: "5rem",
            right: "1.5rem",
            zIndex: 1000,
            background: "#065f46",
            color: "#fff",
            padding: "0.6rem 1rem",
            borderRadius: "4px",
            fontSize: "0.85rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <i className="pi pi-check-circle mr-2"></i> Venta registrada
          correctamente
        </div>
      )}

      <div
        className="flex"
        style={{
          gap: "1px",
          flex: 1,
          minHeight: 0,
          background: "var(--surface-border-light)",
        }}
      >
        {/* LEFT — Product Table */}
        <div
          className="flex-1 flex flex-column"
          style={{ background: "var(--surface-card)", minWidth: 0 }}
        >
          {/* Toolbar */}
          <div
            className="flex align-items-center gap-2 px-3 py-2"
            style={{
              borderBottom: "2px solid var(--primary-color)",
              background: "var(--surface-muted)",
            }}
          >
            <i
              className="pi pi-search"
              style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
            ></i>
            <InputText
              ref={buscadorRef}
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setProductoSeleccionado(0);
              }}
              placeholder="Buscar por código, producto o categoría..."
              className="w-full"
              style={{
                padding: "0.4rem 0.65rem",
                fontSize: "0.82rem",
                borderRadius: "4px",
                maxWidth: "360px",
              }}
            />
            <div className="flex gap-1">
              {categoriasConConteo.map((cat) => (
                <button
                  key={cat.nombre}
                  onClick={() => {
                    setCategoriaActiva(cat.nombre);
                    setProductoSeleccionado(0);
                  }}
                  className="border-none cursor-pointer px-2 py-1 text-xs font-medium"
                  style={{
                    background:
                      categoriaActiva === cat.nombre
                        ? "var(--primary-color)"
                        : "var(--surface-hover)",
                    color:
                      categoriaActiva === cat.nombre
                        ? "var(--primary-color-text)"
                        : "var(--text-secondary)",
                    borderRadius: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>{cat.nombre}</span>
                  <span
                    style={{
                      opacity: categoriaActiva === cat.nombre ? 0.85 : 0.65,
                    }}
                  >
                    {cat.total}
                  </span>
                </button>
              ))}
            </div>
            <div
              style={{ marginLeft: "auto", display: "flex", gap: "0.25rem" }}
            >
              <button
                onClick={togglePantallaCompleta}
                className="border-none cursor-pointer px-2 py-1 text-xs"
                style={{
                  background: "var(--surface-hover)",
                  color: "var(--text-secondary)",
                  borderRadius: "2px",
                }}
              >
                <i
                  className={`pi ${pantallaCompleta ? "pi-window-minimize" : "pi-window-maximize"} mr-1`}
                ></i>
                Pantalla
              </button>
              <button
                onClick={() => setDialogoCliente(true)}
                className="border-none cursor-pointer px-2 py-1 text-xs"
                style={{
                  background: "var(--surface-hover)",
                  color: "var(--text-secondary)",
                  borderRadius: "2px",
                }}
              >
                <i className="pi pi-user mr-1"></i>Cliente
              </button>
            </div>
          </div>

          {/* Table header */}
          <div
            className="flex align-items-center px-3 py-1 text-xs font-bold"
            style={{
              background: "var(--table-header-bg)",
              color: "var(--table-header-text)",
              borderBottom: "1px solid var(--table-header-border)",
              letterSpacing: "0.03em",
            }}
          >
            <div style={{ width: "40px", flexShrink: 0 }}>CÓD</div>
            <div style={{ flex: 1 }}>PRODUCTO</div>
            <div style={{ width: "80px", textAlign: "right", flexShrink: 0 }}>
              PRECIO
            </div>
            <div style={{ width: "70px", textAlign: "center", flexShrink: 0 }}>
              IVA
            </div>
          </div>

          {/* Table body */}
          <div
            className="flex-1"
            style={{
              overflowY: "auto",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {productosFiltrados.length === 0 ? (
              <div
                className="flex flex-column align-items-center justify-content-center"
                style={{ height: "100%", opacity: 0.3 }}
              >
                <i className="pi pi-box text-3xl mb-2"></i>
                <p className="text-sm m-0">Sin resultados</p>
              </div>
            ) : (
              productosFiltrados.map((producto, index) => {
                const seleccionado = indiceProductoActivo === index;
                return (
                  <button
                    key={producto.id}
                    onClick={() => abrirPersonalizar(producto)}
                    onMouseEnter={() => setProductoSeleccionado(index)}
                    className="w-full border-none cursor-pointer text-left flex align-items-center px-3"
                    title="Enter para agregar este producto"
                    style={{
                      padding: "0.45rem 0.75rem",
                      background: seleccionado
                        ? "var(--highlight-bg)"
                        : "transparent",
                      borderBottom: "1px solid var(--table-row-border)",
                      borderLeft: seleccionado
                        ? "3px solid var(--primary-color)"
                        : "3px solid transparent",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        flexShrink: 0,
                        color: "var(--text-muted)",
                        fontFamily: "'Courier New', Courier, monospace",
                      }}
                    >
                      {String(producto.id).padStart(3, "0")}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {producto.nombre}
                    </div>
                    <div
                      style={{
                        width: "80px",
                        textAlign: "right",
                        flexShrink: 0,
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      ${(tipoDte === '03' ? producto.precio : (producto.tipoIva === 'gravado' ? redondear(producto.precio * 1.13) : producto.precio)).toFixed(2)}
                    </div>
                    <div
                      style={{
                        width: "70px",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Tag
                        value={ETIQUETA_IVA[producto.tipoIva].label}
                        severity={ETIQUETA_IVA[producto.tipoIva].severity}
                        style={{
                          fontSize: "0.5rem",
                          padding: "0 0.3rem",
                          height: "14px",
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Status bar */}
          <div
            className="flex align-items-center px-3 py-1 text-xs"
            style={{
              background: "var(--primary-color)",
              color: "var(--primary-color-text)",
            }}
          >
            <span>{productosFiltrados.length} producto(s)</span>
            <span style={{ marginLeft: "1rem", opacity: 0.8 }}>
              F2 Buscar · ↑↓ Navegar · Enter Agregar · F4 Cliente · F9 Cobrar
            </span>
            <span style={{ marginLeft: "auto" }}>CLÁSICO v1.1</span>
          </div>
        </div>

        {/* RIGHT — Ticket / Receipt */}
        <div
          className="flex flex-column"
          style={{
            width: "430px",
            flexShrink: 0,
            background: "var(--surface-card)",
            borderLeft: "1px solid var(--surface-border-light)",
          }}
        >
          {/* Ticket header */}
          <div
            className="px-3 py-2"
            style={{
              borderBottom: "2px solid var(--primary-color)",
              background: "var(--surface-muted)",
            }}
          >
            <div className="flex align-items-center justify-content-between gap-2">
              <div>
                <p
                  className="font-bold m-0"
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-primary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  TICKET
                </p>
                <p
                  className="m-0 text-xs"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "'Courier New', Courier, monospace",
                  }}
                >
                  {clienteSeleccionado.label}
                  {clienteSeleccionado.granContribuyente && (
                    <Tag value="GC" severity="warning" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem', marginLeft: '5px' }} />
                  )}
                </p>
              </div>
              <div
                className="text-right"
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              >
                <p
                  className="font-bold m-0"
                  style={{ color: "var(--primary-color)" }}
                >
                  {cantidadItems}
                </p>
                <p
                  className="m-0 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  item(s)
                </p>
              </div>
            </div>
          </div>

          {/* Ticket columns header */}
          <div
            className="flex px-3 py-1 text-xs font-bold"
            style={{
              background: "var(--table-header-bg)",
              color: "var(--table-header-text)",
              borderBottom: "1px dashed var(--surface-border-light)",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            <div style={{ flex: 1 }}>ITEM</div>
            <div style={{ width: "30px", textAlign: "center", flexShrink: 0 }}>
              Q
            </div>
            <div style={{ width: "70px", textAlign: "right", flexShrink: 0 }}>
              TOTAL
            </div>
          </div>

          {/* Ticket items */}
          <div
            className="flex-1"
            style={{
              overflowY: "auto",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {carrito.length === 0 ? (
              <div
                className="flex flex-column align-items-center justify-content-center text-center px-4"
                style={{ height: "100%", color: "var(--text-muted)" }}
              >
                <div
                  className="flex align-items-center justify-content-center mb-3"
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    background: "var(--surface-hover)",
                    color: "var(--text-icon)",
                  }}
                >
                  <i className="pi pi-receipt text-2xl"></i>
                </div>
                <p
                  className="font-bold text-sm m-0"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Ticket vacío
                </p>
                <p className="text-xs mt-1 mb-0" style={{ lineHeight: 1.4 }}>
                  Busca un producto o usa las flechas y Enter para agregarlo.
                </p>
              </div>
            ) : (
              carrito.map((item) => {
                const c = calcItem(item);
                return (
                  <div
                    key={item._key}
                    className="px-3 py-1"
                    style={{
                      borderBottom: "1px dashed var(--surface-border-light)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <div className="flex align-items-start">
                      <div className="flex-1 min-w-0">
                        <div
                          className="flex align-items-center gap-1"
                          style={{
                            fontWeight: 500,
                            color: "var(--text-primary)",
                          }}
                        >
                          <span>{item.nombre}</span>
                          <Tag
                            value={ETIQUETA_IVA[item.tipoIva].label}
                            severity={ETIQUETA_IVA[item.tipoIva].severity}
                            style={{
                              fontSize: "0.45rem",
                              padding: "0 0.25rem",
                              height: "12px",
                            }}
                          />
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          ${(tipoDte === "03" ? item.precio : (item.tipoIva === "gravado" ? redondear(item.precio * 1.13) : item.precio)).toFixed(2)} c/u
                        </div>
                      </div>
                      <div
                        style={{
                          width: "30px",
                          textAlign: "center",
                          flexShrink: 0,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.cantidad}
                      </div>
                      <div
                        style={{
                          width: "70px",
                          textAlign: "right",
                          flexShrink: 0,
                          fontWeight: 700,
                          color: "var(--primary-color)",
                        }}
                      >
                        ${c.total.toFixed(2)}
                      </div>
                    </div>
                    <div
                      className="flex justify-content-end gap-1"
                      style={{ marginTop: "2px" }}
                    >
                      <button
                        onClick={() => cambiarCantidad(item._key, -1)}
                        className="border-none cursor-pointer inline-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "18px",
                          height: "18px",
                          background: "var(--surface-hover)",
                          color: "var(--text-secondary)",
                          borderRadius: "2px",
                          fontSize: "0.6rem",
                          lineHeight: 1,
                        }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => cambiarCantidad(item._key, 1)}
                        className="border-none cursor-pointer inline-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "18px",
                          height: "18px",
                          background: "var(--surface-hover)",
                          color: "var(--text-secondary)",
                          borderRadius: "2px",
                          fontSize: "0.6rem",
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => editarItem(item)}
                        className="border-none cursor-pointer inline-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "18px",
                          height: "18px",
                          background: "#dbeafe",
                          color: "#3b82f6",
                          borderRadius: "2px",
                          fontSize: "0.55rem",
                          lineHeight: 1,
                        }}
                      >
                        <i className="pi pi-pencil"></i>
                      </button>
                      <button
                        onClick={() => quitarDelCarrito(item._key)}
                        className="border-none cursor-pointer inline-flex align-items-center justify-content-center p-0"
                        style={{
                          width: "18px",
                          height: "18px",
                          background: "#fee2e2",
                          color: "#ef4444",
                          borderRadius: "2px",
                          fontSize: "0.55rem",
                          lineHeight: 1,
                        }}
                      >
                        <i className="pi pi-trash"></i>
                      </button>
                      {item.descuentoValor > 0 && (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#dc2626" }}
                        >
                          -
                          {item.descuentoTipo === "porcentaje"
                            ? `${item.descuentoValor}%`
                            : `$${item.descuentoValor}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DTE Selector and Gran Contribuyente Toggle */}
          <div className="px-3 py-2" style={{ borderTop: "1px dashed var(--surface-border-light)", background: "var(--surface-muted)" }}>
            <div className="flex align-items-center justify-content-between mb-1.5">
              <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>TIPO DE DTE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TIPOS_DTE.map(t => {
                const esActivo = tipoDte === t.value;
                return (
                  <button key={t.value} onClick={() => setTipoDte(t.value)}
                    className="border-none cursor-pointer p-1.5 flex align-items-center justify-content-center gap-1 transition-all transition-duration-150"
                    style={{
                      background: esActivo ? `${t.color}15` : 'transparent',
                      border: `1.5px solid ${esActivo ? t.color : 'var(--surface-border-light)'}`,
                      borderRadius: '4px',
                      color: esActivo ? t.color : 'var(--text-secondary)',
                      boxSizing: 'border-box'
                    }}>
                    <i className={`${t.icon} text-xs`} style={{ color: esActivo ? t.color : 'var(--text-icon)', fontSize: '0.65rem' }}></i>
                    <span className="font-bold" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>{t.label.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>
            
            {cliente !== 0 && (
              <div className="flex align-items-center justify-content-between mt-2 pt-2 border-top-1 surface-border">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Gran Contribuyente</span>
                <button 
                  onClick={() => setEsGranContribuyente(!esGranContribuyente)}
                  className="border-none cursor-pointer p-0.5 px-2 border-round text-xs font-bold transition-all transition-duration-200"
                  style={{
                    background: esGranContribuyente ? 'rgba(245,158,11,0.15)' : 'var(--surface-hover)',
                    color: esGranContribuyente ? '#f59e0b' : 'var(--text-muted)',
                    border: esGranContribuyente ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--surface-border-light)',
                    fontSize: '0.65rem'
                  }}
                >
                  {esGranContribuyente ? 'Retención Activa' : 'Desactivada'}
                </button>
              </div>
            )}
          </div>

          {/* Ticket totals */}
          <div
            className="px-3 py-2"
            style={{
              borderTop: "2px solid var(--primary-color)",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            <div className="flex flex-column gap-1 text-xs">
              {resumen.porTipo.gravado > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#3b82f6" }}>Gravado</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    ${resumen.porTipo.gravado.toFixed(2)}
                  </span>
                </div>
              )}
              {resumen.porTipo.exento > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#16a34a" }}>Exento</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    ${resumen.porTipo.exento.toFixed(2)}
                  </span>
                </div>
              )}
              {resumen.porTipo.noSujeto > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#d97706" }}>No Sujeto</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    ${resumen.porTipo.noSujeto.toFixed(2)}
                  </span>
                </div>
              )}
              {resumen.porTipo.noGravado > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#94a3b8" }}>No Gravado</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    ${resumen.porTipo.noGravado.toFixed(2)}
                  </span>
                </div>
              )}
              {resumen.descuentoTotal > 0 && (
                <div className="flex justify-content-between">
                  <span>Descuentos</span>
                  <span style={{ color: "#dc2626" }}>
                    -${resumen.descuentoTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {resumen.ivaTotal > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#94a3b8" }}>IVA (13%)</span>
                  <span style={{ color: "#94a3b8" }}>
                    ${resumen.ivaTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {resumen.retencion > 0 && (
                <div className="flex justify-content-between">
                  <span style={{ color: "#d97706" }}>Retención (1%)</span>
                  <span style={{ color: "#d97706" }}>
                    -${resumen.retencion.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div
              className="flex justify-content-between align-items-end p-2 mt-2"
              style={{
                background: "var(--surface-muted)",
                border: "1px solid var(--surface-border-light)",
                borderRadius: "4px",
              }}
            >
              <span
                className="font-bold"
                style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}
              >
                TOTAL A COBRAR
              </span>
              <span
                className="font-bold"
                style={{
                  fontSize: "1.55rem",
                  color: "var(--primary-color)",
                  lineHeight: 1,
                }}
              >
                ${resumen.totalCobrar.toFixed(2)}
              </span>
            </div>

            {/* Payment methods */}
            <div className="flex gap-1 mt-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMetodoPago(m.value)}
                  className="flex-1 flex flex-column align-items-center gap-1 py-1 px-1 border-none cursor-pointer"
                  style={{
                    background:
                      metodoPago === m.value
                        ? "var(--primary-color)"
                        : "var(--surface-hover)",
                    color:
                      metodoPago === m.value
                        ? "var(--primary-color-text)"
                        : "var(--text-secondary)",
                    borderRadius: "2px",
                    fontSize: "0.6rem",
                  }}
                >
                  <i className={`${m.icono} text-xs`}></i>
                  <span className="font-semibold text-xs">{m.label}</span>
                </button>
              ))}
            </div>

            <Button
              label={`COBRAR $${resumen.totalCobrar.toFixed(2)}`}
              icon="pi pi-credit-card"
              className="w-full mt-2"
              style={{
                fontSize: "0.85rem",
                padding: "0.5rem",
                borderRadius: "2px",
                background: "var(--primary-color)",
                border: "none",
                color: "var(--primary-color-text)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
              onClick={abrirDialogoPago}
              disabled={carrito.length === 0}
            />
          </div>
        </div>
      </div>

      {/* Product Customization Dialog */}
      <Dialog
        header="Personalizar producto"
        visible={dialogoItem}
        style={{ width: "520px" }}
        onHide={() => {
          setDialogoItem(false);
          setItemEditando(null);
        }}
        draggable={false}
        resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-outlined p-button-secondary"
              onClick={() => {
                setDialogoItem(false);
                setItemEditando(null);
              }}
            />
            <Button
              label={
                carrito.find((i) => i._key === itemEditando?._key)
                  ? "Actualizar"
                  : "Agregar"
              }
              icon="pi pi-cart-plus"
              className="p-button-primary"
              onClick={agregarAlCarrito}
            />
          </div>
        }
      >
        {itemEditando &&
          (() => {
            const basePrice = (precioIncluyeIva && itemEditando.tipoIva === "gravado")
              ? itemEditando.precio / 1.13
              : itemEditando.precio;
            const sub = basePrice * itemEditando.cantidad;
            const d =
              itemEditando.descuentoTipo === "porcentaje"
                ? (sub * (itemEditando.descuentoValor || 0)) / 100
                : itemEditando.descuentoValor || 0;
            const subtotalDesc = sub - d;
            const iva =
              itemEditando.tipoIva === "gravado" ? redondear(subtotalDesc * 0.13) : 0;
            return (
              <div className="flex flex-column gap-2">
                <div className="flex flex-column gap-1">
                  <label
                    className="text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    NOMBRE
                  </label>
                  <InputText
                    value={itemEditando.nombre}
                    onChange={(e) =>
                      setItemEditando({
                        ...itemEditando,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full"
                    style={{
                      borderRadius: "3px",
                      padding: "0.45rem 0.7rem",
                      fontSize: "0.85rem",
                      background: "var(--input-bg, var(--surface-card))",
                      color: "var(--text-primary)",
                      borderColor: "var(--input-border, var(--surface-border))",
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-column gap-1">
                    <div className="flex justify-content-between align-items-center">
                      <label
                        className="text-xs font-bold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        PRECIO
                      </label>
                      <div className="flex border-1 surface-border border-round overflow-hidden" style={{ height: "18px" }}>
                        <button type="button" onClick={() => cambiarModoIvaPrecio(false)}
                          className="border-none cursor-pointer px-1 text-2xs font-bold transition-all transition-duration-150"
                          style={{ background: !precioIncluyeIva ? "var(--primary-color)" : "var(--surface-card)", color: !precioIncluyeIva ? "var(--primary-color-text)" : "var(--text-secondary)", fontSize: "0.55rem" }}>Sin IVA</button>
                        <button type="button" onClick={() => cambiarModoIvaPrecio(true)}
                          className="border-none cursor-pointer px-1 text-2xs font-bold transition-all transition-duration-150"
                          style={{ background: precioIncluyeIva ? "var(--primary-color)" : "var(--surface-card)", color: precioIncluyeIva ? "var(--primary-color-text)" : "var(--text-secondary)", fontSize: "0.55rem" }}>Con IVA</button>
                      </div>
                    </div>
                    <InputNumber
                      value={itemEditando.precio}
                      onValueChange={(e) =>
                        setItemEditando({
                          ...itemEditando,
                          precio: e.value || 0,
                        })
                      }
                      min={0}
                      className="w-full"
                      inputStyle={{
                        borderRadius: "3px",
                        padding: "0.45rem 0.7rem",
                        fontSize: "0.85rem",
                        background: "var(--input-bg, var(--surface-card))",
                        color: "var(--text-primary)",
                        borderColor:
                          "var(--input-border, var(--surface-border))",
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="flex-1 flex flex-column gap-1">
                    <label
                      className="text-xs font-bold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      CANTIDAD
                    </label>
                    <InputNumber
                      value={itemEditando.cantidad}
                      onValueChange={(e) =>
                        setItemEditando({
                          ...itemEditando,
                          cantidad: e.value || 1,
                        })
                      }
                      min={1}
                      className="w-full"
                      inputStyle={{
                        borderRadius: "3px",
                        padding: "0.45rem 0.7rem",
                        fontSize: "0.85rem",
                        background: "var(--input-bg, var(--surface-card))",
                        color: "var(--text-primary)",
                        borderColor:
                          "var(--input-border, var(--surface-border))",
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
                <div className="flex flex-column gap-1">
                  <label
                    className="text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    TIPO DE IVA
                  </label>
                  <div className="flex gap-1">
                    {["gravado", "exento", "noSujeto", "noGravado"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setItemEditando({ ...itemEditando, tipoIva: t })
                        }
                        className="flex-1 border-none cursor-pointer py-2 text-xs font-semibold"
                        style={{
                          background:
                            itemEditando.tipoIva === t
                              ? "var(--primary-color)"
                              : "var(--surface-hover)",
                          color:
                            itemEditando.tipoIva === t
                              ? "var(--primary-color-text)"
                              : "var(--text-secondary)",
                          borderRadius: "2px",
                        }}
                      >
                        {ETIQUETA_IVA[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-column gap-1">
                  <label
                    className="text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    DESCUENTO
                  </label>
                  <div className="flex gap-2 align-items-center">
                    <div
                      className="flex"
                      style={{
                        border: "1.5px solid var(--surface-border-light)",
                        borderRadius: "2px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() =>
                          setItemEditando({
                            ...itemEditando,
                            descuentoTipo: "porcentaje",
                            descuentoValor: 0,
                          })
                        }
                        className="border-none cursor-pointer px-2 text-xs font-semibold"
                        style={{
                          background:
                            itemEditando.descuentoTipo === "porcentaje"
                              ? "var(--primary-color)"
                              : "var(--surface-card)",
                          color:
                            itemEditando.descuentoTipo === "porcentaje"
                              ? "var(--primary-color-text)"
                              : "var(--text-secondary)",
                          padding: "0.4rem 0.6rem",
                        }}
                      >
                        %
                      </button>
                      <button
                        onClick={() =>
                          setItemEditando({
                            ...itemEditando,
                            descuentoTipo: "monto",
                            descuentoValor: 0,
                          })
                        }
                        className="border-none cursor-pointer px-2 text-xs font-semibold"
                        style={{
                          background:
                            itemEditando.descuentoTipo === "monto"
                              ? "var(--primary-color)"
                              : "var(--surface-card)",
                          color:
                            itemEditando.descuentoTipo === "monto"
                              ? "var(--primary-color-text)"
                              : "var(--text-secondary)",
                          padding: "0.4rem 0.6rem",
                        }}
                      >
                        $
                      </button>
                    </div>
                    <InputNumber
                      value={itemEditando.descuentoValor}
                      onValueChange={(e) =>
                        setItemEditando({
                          ...itemEditando,
                          descuentoValor: e.value || 0,
                        })
                      }
                      min={0}
                      max={
                        itemEditando.descuentoTipo === "porcentaje"
                          ? 100
                          : undefined
                      }
                      className="w-full"
                      inputStyle={{
                        borderRadius: "3px",
                        padding: "0.45rem 0.7rem",
                        fontSize: "0.85rem",
                        background: "var(--input-bg, var(--surface-card))",
                        color: "var(--text-primary)",
                        borderColor:
                          "var(--input-border, var(--surface-border))",
                      }}
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      placeholder={
                        itemEditando.descuentoTipo === "porcentaje"
                          ? "0.00%"
                          : "$0.00"
                      }
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
                <div
                  className="p-2"
                  style={{
                    background: "var(--surface-muted)",
                    borderRadius: "3px",
                    border: "1px solid var(--surface-border-light)",
                  }}
                >
                  <div
                    className="flex flex-column gap-1"
                    style={{
                      fontSize: "0.8rem",
                      fontFamily: "'Courier New', Courier, monospace",
                    }}
                  >
                    <div className="flex justify-content-between">
                      <span style={{ color: "var(--text-muted)" }}>
                        {itemEditando.cantidad} x $
                        {basePrice.toFixed(2)}
                        {precioIncluyeIva && itemEditando.tipoIva === "gravado" && (
                          <span style={{ fontSize: "0.72rem", opacity: 0.75 }}>
                            {" "}
                            (${itemEditando.precio.toFixed(2)} c/IVA)
                          </span>
                        )}
                      </span>
                      <span>${sub.toFixed(2)}</span>
                    </div>
                    {d > 0 && (
                      <div className="flex justify-content-between">
                        <span style={{ color: "var(--text-muted)" }}>
                          Descuento
                        </span>
                        <span style={{ color: "#dc2626" }}>
                          -${d.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-content-between">
                      <span style={{ color: "var(--text-muted)" }}>
                        IVA ({itemEditando.tipoIva === "gravado" ? "13%" : "0%"}
                        )
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        ${iva.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className="flex justify-content-between font-bold pt-1"
                      style={{
                        borderTop: "1px dashed var(--surface-border-light)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span>TOTAL</span>
                      <span style={{ color: "var(--primary-color)" }}>
                        ${(subtotalDesc + iva).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog
        header="Confirmar Cobro"
        visible={dialogoPago}
        style={{ width: "460px" }}
        onHide={() => setDialogoPago(false)}
        draggable={false}
        resizable={false}
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-outlined p-button-secondary"
              onClick={() => setDialogoPago(false)}
            />
            <Button
              label="Confirmar Pago"
              icon="pi pi-check"
              className="p-button-primary"
              onClick={cobrar}
              disabled={
                metodoPago === "efectivo" &&
                (!efectivoRecibido || efectivoRecibido < resumen.totalCobrar)
              }
            />
          </div>
        }
      >
        <div className="flex flex-column gap-2 py-1">
          <div
            className="flex align-items-center gap-2 p-2"
            style={{ background: "#f8fafc", borderRadius: "3px" }}
          >
            <div
              className="flex align-items-center justify-content-center"
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                background: "#1e3a5f",
                borderRadius: "3px",
              }}
            >
              <i className="pi pi-file text-white text-sm"></i>
            </div>
            <div>
              <p
                className="font-bold m-0 text-xs"
                style={{ color: "var(--text-primary)" }}
              >
                {CLIENTES.find((c) => c.value === cliente)?.label}
              </p>
              <div className="flex align-items-center gap-2 mt-1">
                <Tag value={TIPOS_DTE.find((t) => t.value === tipoDte)?.label} severity="info" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }} />
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  • {METODOS_PAGO.find((m) => m.value === metodoPago)?.label}
                </span>
              </div>
            </div>
          </div>

          {metodoPago === "efectivo" && (
            <div
              className="flex flex-column gap-2 p-2"
              style={{ background: "#f8fafc", borderRadius: "3px" }}
            >
              <label className="text-xs font-bold" style={{ color: "#64748b" }}>
                EFECTIVO RECIBIDO
              </label>
              <InputNumber
                value={efectivoRecibido}
                onValueChange={(e) => setEfectivoRecibido(e.value)}
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
                className="w-full"
                inputStyle={{
                  borderRadius: "3px",
                  padding: "0.5rem 0.75rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  fontFamily: "'Courier New', Courier, monospace",
                }}
                placeholder="$0.00"
                onFocus={(e) => e.target.select()}
              />
              {efectivoRecibido > 0 && (
                <div
                  className="flex flex-column gap-1"
                  style={{
                    fontSize: "0.8rem",
                    fontFamily: "'Courier New', Courier, monospace",
                  }}
                >
                  <div className="flex justify-content-between">
                    <span style={{ color: "#94a3b8" }}>Total</span>
                    <span className="font-bold">
                      ${resumen.totalCobrar.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-content-between">
                    <span style={{ color: "#94a3b8" }}>Efectivo</span>
                    <span>${efectivoRecibido.toFixed(2)}</span>
                  </div>
                  <hr className="premium-divider" />
                  <div className="flex justify-content-between">
                    <span className="font-bold" style={{ fontSize: "0.9rem" }}>
                      CAMBIO
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: "1rem",
                        color:
                          efectivoRecibido >= resumen.totalCobrar
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    >
                      ${(efectivoRecibido - resumen.totalCobrar).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {metodoPago === "tarjeta" && (
            <div
              className="flex flex-column gap-2 p-2"
              style={{ background: "#f8fafc", borderRadius: "3px" }}
            >
              <label className="text-xs font-bold" style={{ color: "#64748b" }}>
                N° AUTORIZACIÓN{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  (opcional)
                </span>
              </label>
              <InputText
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Ej. AUTH-98765"
                className="w-full"
                style={{
                  borderRadius: "3px",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          )}

          {metodoPago === "credito" && (
            <div
              className="flex flex-column gap-2 p-2"
              style={{ background: "#f8fafc", borderRadius: "3px" }}
            >
              <label className="text-xs font-bold" style={{ color: "#64748b" }}>
                PLAZO
              </label>
              <InputNumber
                value={plazoValor}
                onValueChange={(e) => setPlazoValor(e.value || 1)}
                min={1}
                max={999}
                maxFractionDigits={0}
                useGrouping={false}
                inputStyle={{
                  borderRadius: "3px",
                  padding: "0.45rem 0.7rem",
                  textAlign: "center",
                  fontSize: "0.85rem",
                }}
                onFocus={(e) => e.target.select()}
              />
              <div className="flex gap-1">
                {["días", "meses", "años"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setPlazoTipo(t)}
                    className="flex-1 border-none cursor-pointer py-2 text-xs font-semibold"
                    style={{
                      background: plazoTipo === t ? "#d97706" : "#f1f5f9",
                      color: plazoTipo === t ? "#fff" : "#475569",
                      borderRadius: "2px",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs m-0" style={{ color: "#94a3b8" }}>
                Pago a {plazoValor} {plazoTipo}
              </p>
            </div>
          )}

          {metodoPago === "transferencia" && (
            <div
              className="flex flex-column gap-2 p-2"
              style={{ background: "#f8fafc", borderRadius: "3px" }}
            >
              <div
                className="flex align-items-center gap-2 p-2"
                style={{
                  background: "rgba(139,92,246,0.08)",
                  borderRadius: "2px",
                }}
              >
                <i
                  className="pi pi-info-circle text-xs"
                  style={{ color: "#8b5cf6" }}
                ></i>
                <p className="text-xs m-0" style={{ color: "#64748b" }}>
                  Transferencia por pasarela de pagos.
                </p>
              </div>
              <label className="text-xs font-bold" style={{ color: "#64748b" }}>
                N° TRANSFERENCIA{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  (opcional)
                </span>
              </label>
              <InputText
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Ej. REF-12345"
                className="w-full"
                style={{
                  borderRadius: "3px",
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          )}

          <div
            className="pt-2 flex flex-column gap-1"
            style={{
              borderTop: "1px dashed #cbd5e1",
              fontSize: "0.8rem",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {resumen.porTipo.gravado > 0 && (
              <div className="flex justify-content-between">
                <span style={{ color: "#3b82f6" }}>Gravado</span>
                <span>${resumen.porTipo.gravado.toFixed(2)}</span>
              </div>
            )}
            {resumen.porTipo.exento > 0 && (
              <div className="flex justify-content-between">
                <span style={{ color: "#16a34a" }}>Exento</span>
                <span>${resumen.porTipo.exento.toFixed(2)}</span>
              </div>
            )}
            {resumen.porTipo.noSujeto > 0 && (
              <div className="flex justify-content-between">
                <span style={{ color: "#d97706" }}>No Sujeto</span>
                <span>${resumen.porTipo.noSujeto.toFixed(2)}</span>
              </div>
            )}
            {resumen.porTipo.noGravado > 0 && (
              <div className="flex justify-content-between">
                <span style={{ color: "#94a3b8" }}>No Gravado</span>
                <span>${resumen.porTipo.noGravado.toFixed(2)}</span>
              </div>
            )}
            {resumen.descuentoTotal > 0 && (
              <div className="flex justify-content-between">
                <span>Descuentos</span>
                <span style={{ color: "#dc2626" }}>
                  -${resumen.descuentoTotal.toFixed(2)}
                </span>
              </div>
            )}
            {resumen.ivaTotal > 0 && (
              <div className="flex justify-content-between">
                <span style={{ color: "#94a3b8" }}>IVA (13%)</span>
                <span style={{ color: "#94a3b8" }}>
                  ${resumen.ivaTotal.toFixed(2)}
                </span>
              </div>
            )}
            {resumen.retencion > 0 && (
              <div className="flex justify-content-between">
                <span style={{ color: "#d97706" }}>Retención (1%)</span>
                <span style={{ color: "#d97706" }}>
                  -${resumen.retencion.toFixed(2)}
                </span>
              </div>
            )}
            <div
              className="flex justify-content-between pt-1"
              style={{ borderTop: "1px dashed #cbd5e1" }}
            >
              <span className="font-bold" style={{ fontSize: "0.9rem" }}>
                A COBRAR
              </span>
              <span
                className="font-bold"
                style={{ fontSize: "1.1rem", color: "#1e3a5f" }}
              >
                ${resumen.totalCobrar.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog
        header="Seleccionar Cliente"
        visible={dialogoCliente}
        style={{ width: "440px" }}
        onHide={() => {
          setDialogoCliente(false);
          setBusquedaCliente("");
        }}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-2">
          <div style={{ position: "relative" }}>
            <i
              className="pi pi-search"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.8rem",
                color: "#94a3b8",
              }}
            ></i>
            <InputText
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              placeholder="Buscar por nombre o NIT..."
              className="w-full"
              style={{
                borderRadius: "3px",
                padding: "0.45rem 0.7rem 0.45rem 2rem",
                fontSize: "0.85rem",
              }}
              autoFocus
            />
          </div>
          <div
            className="flex flex-column gap-1"
            style={{ maxHeight: "300px", overflowY: "auto" }}
          >
            {clientesFiltrados.length === 0 ? (
              <div
                className="flex flex-column align-items-center gap-2 py-4"
                style={{ opacity: 0.4 }}
              >
                <i className="pi pi-users text-3xl"></i>
                <p className="text-xs m-0" style={{ color: "#94a3b8" }}>
                  Sin resultados
                </p>
              </div>
            ) : (
              clientesFiltrados.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setCliente(c.value);
                    setDialogoCliente(false);
                    setBusquedaCliente("");
                  }}
                  className="w-full border-none cursor-pointer p-2 flex align-items-center gap-2"
                  style={{
                    background: cliente === c.value ? "#f1f5f9" : "transparent",
                    borderRadius: "3px",
                  }}
                >
                  <div
                    className="flex align-items-center justify-content-center"
                    style={{
                      width: "32px",
                      height: "32px",
                      minWidth: "32px",
                      background: cliente === c.value ? "#1e3a5f" : "#f1f5f9",
                      borderRadius: "3px",
                    }}
                  >
                    <i
                      className="pi pi-user text-xs"
                      style={{
                        color: cliente === c.value ? "#fff" : "#64748b",
                      }}
                    ></i>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex align-items-center gap-2">
                      <p
                        className="font-medium m-0 text-xs"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.label}
                      </p>
                      {c.granContribuyente && (
                        <Tag
                          value="Gran Contribuyente"
                          severity="warning"
                          style={{
                            fontSize: "0.5rem",
                            padding: "0.05rem 0.25rem",
                            height: "12px",
                          }}
                        />
                      )}
                    </div>
                    <p className="text-xs m-0" style={{ color: "#94a3b8" }}>
                      {c.nit}
                    </p>
                  </div>
                  {cliente === c.value && (
                    <i
                      className="pi pi-check text-xs"
                      style={{ color: "#1e3a5f" }}
                    ></i>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
