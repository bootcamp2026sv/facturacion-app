import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useTema } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { filtrarMenuPorPermisos, primeraVistaAutorizada, puedeVerVista } from "../utils/permisos.js";
import { onForbidden } from "../services/api.js";
import { MARCA_COMERCIO_EVENT, obtenerMarcaComercio } from "../utils/marcaComercio.js";

const VistaInicio = lazy(() => import("./views/VistaInicio"));
const VistaProductos = lazy(() => import("./views/VistaProductos"));
const VistaCategorias = lazy(() => import("./views/VistaCategorias"));
const VistaClientes = lazy(() => import("./views/VistaClientes"));
const VistaCodigosActividad = lazy(() => import("./views/VistaCodigosActividad"));
const VistaUnidadesMedida = lazy(() => import("./views/VistaUnidadesMedida"));
const VistaVentas = lazy(() => import("./views/VistaVentas"));
const VistaPuntoVenta = lazy(() => import("./views/VistaPuntoVenta"));
const VistaPuntoVentaClasico = lazy(() => import("./views/VistaPuntoVentaClasico"));
const VistaComercios = lazy(() => import("./views/VistaComercios"));
const VistaGeografia = lazy(() => import("./views/VistaGeografia"));
const VistaControlSistema = lazy(() => import("./views/VistaControlSistema"));
const VistaCatalogosExportacion = lazy(() => import("./views/VistaCatalogosExportacion"));

const VISTA_ACTIVA_STORAGE_KEY = "panel.vistaActiva";
const VISTAS_VALIDAS = [
  "inicio",
  "ventas",
  "pos",
  "pos-clasico",
  "productos",
  "categorias",
  "clientes",
  "comercios",
  "geografia",
  "actividades",
  "unidades",
  "control",
  "catalogos-exportacion",
];

const obtenerVistaInicial = () => {
  const vistaGuardada = localStorage.getItem(VISTA_ACTIVA_STORAGE_KEY);
  return VISTAS_VALIDAS.includes(vistaGuardada) ? vistaGuardada : "inicio";
};

export default function PanelPrincipal() {
  const toast = useRef(null);
  const sidebarRef = useRef(null);
  const toggleSidebarRef = useRef(null);
  const [esPantallaCompacta, setEsPantallaCompacta] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches
  ));
  const [estaColapsado, setEstaColapsado] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches
  ));
  const [vistaActiva, setVistaActiva] = useState(obtenerVistaInicial);
  const { tema, alternarTema } = useTema();
  const { usuario, logout } = useAuth();
  const [nombreComercio, setNombreComercio] = useState(() => obtenerMarcaComercio()?.nombre || '');

  useEffect(() => {
    const actualizarNombreComercio = () => setNombreComercio(obtenerMarcaComercio()?.nombre || '');
    window.addEventListener(MARCA_COMERCIO_EVENT, actualizarNombreComercio);
    window.addEventListener('storage', actualizarNombreComercio);
    return () => {
      window.removeEventListener(MARCA_COMERCIO_EVENT, actualizarNombreComercio);
      window.removeEventListener('storage', actualizarNombreComercio);
    };
  }, []);

  useEffect(() => {
    onForbidden((mensaje) => toast.current?.show({
      severity: "warn", summary: "Acceso restringido", detail: mensaje || "No tiene permiso", life: 4000,
    }));
    return () => onForbidden(null);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const actualizarModoResponsive = (evento) => {
      const pantallaCompacta = evento.matches;
      setEsPantallaCompacta(pantallaCompacta);
      setEstaColapsado(pantallaCompacta);
    };

    actualizarModoResponsive(mediaQuery);
    mediaQuery.addEventListener("change", actualizarModoResponsive);
    return () => mediaQuery.removeEventListener("change", actualizarModoResponsive);
  }, []);

  useEffect(() => {
    if (!esPantallaCompacta || estaColapsado) return undefined;

    const primerElementoNavegable = sidebarRef.current?.querySelector(".nav-item");
    primerElementoNavegable?.focus();

    const cerrarConEscape = (evento) => {
      if (evento.key !== "Escape") return;
      setEstaColapsado(true);
      requestAnimationFrame(() => toggleSidebarRef.current?.focus());
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [esPantallaCompacta, estaColapsado]);

  const ELEMENTOS_MENU = [
    {
      id: "inicio",
      etiqueta: "Inicio",
      icono: "pi pi-chart-bar",
      componente: <VistaInicio alCambiarVista={setVistaActiva} />,
    },
    {
      id: "ventas",
      etiqueta: "Ventas (DTE)",
      icono: "pi pi-percentage",
      componente: <VistaVentas />,
    },
    {
      id: "pos",
      etiqueta: "Punto de Venta",
      icono: "pi pi-shopping-cart",
      componente: <VistaPuntoVenta />,
    },
    {
      id: "pos-clasico",
      etiqueta: "P. Venta Clásico",
      icono: "pi pi-store",
      componente: <VistaPuntoVentaClasico />,
    },
    {
      id: "productos",
      etiqueta: "Productos",
      icono: "pi pi-box",
      componente: <VistaProductos />,
    },
    {
      id: "categorias",
      etiqueta: "Categorías",
      icono: "pi pi-tags",
      componente: <VistaCategorias />,
    },
    {
      id: "clientes",
      etiqueta: "Clientes",
      icono: "pi pi-users",
      componente: <VistaClientes />,
    },
    {
      id: "comercios",
      etiqueta: "Configuración Comercio",
      icono: "pi pi-building",
      componente: <VistaComercios />,
    },
    {
      id: "geografia",
      etiqueta: "Cat Departamentos",
      icono: "pi pi-map",
      componente: <VistaGeografia />,
    },
    {
      id: "actividades",
      etiqueta: "Actividades Económicas",
      icono: "pi pi-briefcase",
      componente: <VistaCodigosActividad />,
    },
    {
      id: "unidades",
      etiqueta: "Unidades de Medida",
      icono: "pi pi-calculator",
      componente: <VistaUnidadesMedida />,
    },
    {
      id: "catalogos-exportacion",
      etiqueta: "Catálogos Exportación",
      icono: "pi pi-globe",
      componente: <VistaCatalogosExportacion />,
    },
    {
      id: "control",
      etiqueta: "Control Sistema",
      icono: "pi pi-cog",
      componente: <VistaControlSistema />,
    },
  ];

  const elementosMenuAutorizados = filtrarMenuPorPermisos(ELEMENTOS_MENU, usuario);
  const vistaAutorizada = puedeVerVista(usuario, vistaActiva)
    ? vistaActiva
    : primeraVistaAutorizada(ELEMENTOS_MENU, usuario);

  useEffect(() => {
    localStorage.setItem(VISTA_ACTIVA_STORAGE_KEY, vistaAutorizada);
  }, [vistaAutorizada]);

  const elementoVistaActual =
    elementosMenuAutorizados.find((item) => item.id === vistaAutorizada) || elementosMenuAutorizados[0];

  return (
    <div className="flex h-screen overflow-hidden surface-ground panel-principal">
      <Toast ref={toast} position="top-right" />
      {/* 1. SIDEBAR */}
      {esPantallaCompacta && !estaColapsado && (
        <button
          type="button"
          className="premium-sidebar-backdrop"
          aria-label="Cerrar menú de navegación"
          onClick={() => setEstaColapsado(true)}
        />
      )}
      <aside
        id="panel-principal-sidebar"
        ref={sidebarRef}
        aria-hidden={esPantallaCompacta && estaColapsado}
        inert={esPantallaCompacta && estaColapsado ? "" : undefined}
        className={`flex flex-column h-screen sticky top-0 border-right-1 premium-sidebar transition-all transition-duration-200 panel-principal__sidebar ${esPantallaCompacta ? "panel-principal__sidebar--compacta" : ""} ${!estaColapsado ? "panel-principal__sidebar--abierta" : ""}`}
        style={{
          width: esPantallaCompacta ? "min(300px, calc(100vw - 1rem))" : estaColapsado ? "72px" : "260px",
          overflowX: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header */}
        <div
          className={`flex align-items-center h-4rem px-3 border-bottom-1 surface-border ${estaColapsado ? "justify-content-center" : "justify-content-start"}`}
          style={{ borderColor: "rgba(255,255,255,0.06) !important" }}
        >
          <div
            className="flex align-items-center justify-content-center w-2rem h-2rem border-circle"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            <i className="pi pi-bolt text-white text-sm"></i>
          </div>
          {!estaColapsado && nombreComercio && (
            <span className="font-bold text-base ml-3 text-0 white-space-nowrap">
              {nombreComercio}
            </span>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-3 px-2 flex flex-column gap-1 overflow-y-auto">
          {elementosMenuAutorizados.map((item) => {
            const esActivo = vistaAutorizada === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setVistaActiva(item.id);
                  if (esPantallaCompacta) setEstaColapsado(true);
                }}
                title={estaColapsado ? item.etiqueta : undefined}
                aria-current={esActivo ? "page" : undefined}
                className={`flex align-items-center border-none border-round cursor-pointer p-3 text-sm w-full nav-item ${
                  esActivo ? "nav-item-active" : "bg-transparent"
                } ${estaColapsado ? "justify-content-center px-0" : "justify-content-start"}`}
              >
                <i
                  className={`${item.icono} text-base flex-shrink-0 ${esActivo ? "text-primary" : ""} ${estaColapsado ? "" : "mr-3"}`}
                ></i>
                {!estaColapsado && (
                  <span className="white-space-nowrap">{item.etiqueta}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className="p-2 border-top-1 surface-border flex flex-column gap-1"
          style={{ borderColor: "rgba(255,255,255,0.06) !important" }}
        >
          {!estaColapsado && (
            <div className="px-3 py-2">
              <p
                className="margin-0 text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Sesión de:
              </p>
              <p className="margin-0 text-sm font-bold text-0 text-ellipsis overflow-hidden white-space-nowrap">
                {usuario?.nombreUsuario || "Usuario"}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            title={estaColapsado ? "Cerrar Sesión" : undefined}
            className={`flex align-items-center border-none border-round cursor-pointer p-3 text-sm transition-colors transition-duration-200 w-full text-red-300 bg-transparent hover:bg-red-500 hover:text-white nav-item ${
              estaColapsado
                ? "justify-content-center px-0"
                : "justify-content-start"
            }`}
          >
            <i
              className={`pi pi-sign-out text-base flex-shrink-0 ${estaColapsado ? "" : "mr-3"}`}
            ></i>
            {!estaColapsado && (
              <span className="font-semibold white-space-nowrap">
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-column min-w-0">
        {/* Top Header */}
        <header className="flex align-items-center justify-content-between h-4rem px-4 border-bottom-1 surface-border premium-panel-header sticky top-0 z-5 panel-principal__header">
          <div className="flex align-items-center gap-3 min-w-0">
            <Button
              icon={estaColapsado ? "pi pi-bars" : "pi pi-align-left"}
              onClick={() => setEstaColapsado(!estaColapsado)}
              className="p-button-text premium-toggle-btn"
              aria-label={estaColapsado ? "Abrir menú de navegación" : "Colapsar menú de navegación"}
              aria-expanded={!estaColapsado}
              aria-controls="panel-principal-sidebar"
              ref={toggleSidebarRef}
            />
            <h1
              className="margin-0 text-xl font-bold panel-principal__titulo"
              style={{ color: "var(--header-title)" }}
            >
              {elementoVistaActual.etiqueta}
            </h1>
          </div>

          <div className="flex align-items-center gap-2 panel-principal__acciones">
            <Button
              icon={tema === "dark" ? "pi pi-sun" : "pi pi-moon"}
              onClick={alternarTema}
              className="p-button-text premium-toggle-btn"
              aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              tooltip={tema === "dark" ? "Modo claro" : "Modo oscuro"}
              tooltipOptions={{ position: "bottom" }}
            />
            <div className="flex align-items-center gap-2 surface-ground p-2 border-round-xl panel-principal__usuario">
              <i className="pi pi-user text-primary"></i>
              <span className="text-sm font-medium text-secondary panel-principal__usuario-nombre">
                {usuario?.nombreUsuario || "Usuario"}
              </span>
            </div>
          </div>
        </header>

        {/* Active View Container */}
        <main
          className={`p-4 flex-1 min-h-0 panel-principal__main ${vistaAutorizada === "pos-clasico" ? "overflow-hidden" : "overflow-auto"}`}
        >
          <Suspense fallback={<div className="flex justify-content-center p-6"><i className="pi pi-spin pi-spinner text-3xl text-primary" /></div>}>
            {elementoVistaActual.componente}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
