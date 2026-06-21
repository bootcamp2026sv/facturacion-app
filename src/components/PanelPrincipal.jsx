import { useState } from "react";
import { Button } from "primereact/button";
import { useTema } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import VistaInicio from "./views/VistaInicio";
import VistaProductos from "./views/VistaProductos";
import VistaCategorias from "./views/VistaCategorias";
import VistaClientes from "./views/VistaClientes";
import VistaCodigosActividad from "./views/VistaCodigosActividad";
import VistaUnidadesMedida from "./views/VistaUnidadesMedida";
import VistaVentas from "./views/VistaVentas";
import VistaPuntoVenta from "./views/VistaPuntoVenta";
import VistaPuntoVentaClasico from "./views/VistaPuntoVentaClasico";
import VistaComercios from "./views/VistaComercios";
import VistaGeografia from "./views/VistaGeografia";
import VistaControlSistema from "./views/VistaControlSistema";

export default function PanelPrincipal() {
  const [estaColapsado, setEstaColapsado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState("inicio");
  const { tema, alternarTema } = useTema();
  const { usuario, logout } = useAuth();

  const ELEMENTOS_MENU = [
    {
      id: "inicio",
      etiqueta: "Inicio",
      icono: "pi pi-chart-bar",
      componente: <VistaInicio />,
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
      id: "control",
      etiqueta: "Control Sistema",
      icono: "pi pi-cog",
      componente: <VistaControlSistema />,
    },
  ];

  const elementoVistaActual =
    ELEMENTOS_MENU.find((item) => item.id === vistaActiva) || ELEMENTOS_MENU[0];

  return (
    <div className="flex h-screen overflow-hidden surface-ground">
      {/* 1. SIDEBAR */}
      <aside
        className="flex flex-column h-screen sticky top-0 border-right-1 premium-sidebar transition-all transition-duration-200"
        style={{
          width: estaColapsado ? "72px" : "260px",
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
          {!estaColapsado && (
            <span className="font-bold text-base ml-3 text-0 white-space-nowrap">
              BOOTCAMP 2026
            </span>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-3 px-2 flex flex-column gap-1 overflow-y-auto">
          {ELEMENTOS_MENU.map((item) => {
            const esActivo = vistaActiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setVistaActiva(item.id)}
                title={estaColapsado ? item.etiqueta : undefined}
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
                {usuario?.username || "Administrador"}
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
        <header className="flex align-items-center justify-content-between h-4rem px-4 border-bottom-1 surface-border premium-panel-header sticky top-0 z-5">
          <div className="flex align-items-center gap-3">
            <Button
              icon={estaColapsado ? "pi pi-bars" : "pi pi-align-left"}
              onClick={() => setEstaColapsado(!estaColapsado)}
              className="p-button-text premium-toggle-btn"
            />
            <h1
              className="margin-0 text-xl font-bold"
              style={{ color: "var(--header-title)" }}
            >
              {elementoVistaActual.etiqueta}
            </h1>
          </div>

          <div className="flex align-items-center gap-2">
            <Button
              icon={tema === "dark" ? "pi pi-sun" : "pi pi-moon"}
              onClick={alternarTema}
              className="p-button-text premium-toggle-btn"
              tooltip={tema === "dark" ? "Modo claro" : "Modo oscuro"}
              tooltipOptions={{ position: "bottom" }}
            />
            <div className="flex align-items-center gap-2 surface-ground p-2 border-round-xl">
              <i className="pi pi-user text-primary"></i>
              <span className="text-sm font-medium text-secondary">
                {usuario?.username || "admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Active View Container */}
        <main
          className={`p-4 flex-1 min-h-0 ${vistaActiva === "pos-clasico" ? "overflow-hidden" : "overflow-auto"}`}
        >
          {elementoVistaActual.componente}
        </main>
      </div>
    </div>
  );
}
