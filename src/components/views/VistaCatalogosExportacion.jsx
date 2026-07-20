import { useState } from "react";
import CatalogoExportacionCrud from "./CatalogoExportacionCrud";
import { CATALOGOS_EXPORTACION } from "./catalogosExportacion";
import "./VistaCatalogosExportacion.css";

export default function VistaCatalogosExportacion() {
  const [catalogoActivoId, setCatalogoActivoId] = useState(
    CATALOGOS_EXPORTACION[0].id
  );
  const catalogoActivo =
    CATALOGOS_EXPORTACION.find(({ id }) => id === catalogoActivoId) ||
    CATALOGOS_EXPORTACION[0];

  return (
    <div className="catalogos-exportacion premium-fade-in">
      <div className="catalogos-exportacion__encabezado">
        <div>
          <div className="flex align-items-center gap-2 mb-2">
            <span className="catalogos-exportacion__eyebrow">
              Catálogos fiscales · DTE 11
            </span>
          </div>
          <h1 className="m-0 text-3xl" style={{ color: "var(--text-primary)" }}>
            Catálogos de Exportación
          </h1>
          <p className="m-0 mt-2" style={{ color: "var(--text-muted)" }}>
            Seleccione un catálogo para consultar y administrar sus registros.
          </p>
        </div>
        <div className="catalogos-exportacion__resumen">
          <i className="pi pi-globe" />
          <div>
            <span>Catálogos disponibles</span>
            <strong>{CATALOGOS_EXPORTACION.length}</strong>
          </div>
        </div>
      </div>

      <div className="catalogos-exportacion__tarjetas" role="list" aria-label="Catálogos de exportación">
        {CATALOGOS_EXPORTACION.map((catalogo) => {
          const activo = catalogo.id === catalogoActivoId;

          return (
            <button
              key={catalogo.id}
              type="button"
              role="listitem"
              aria-pressed={activo}
              className={`catalogos-exportacion__tarjeta${activo ? " catalogos-exportacion__tarjeta--activa" : ""}`}
              onClick={() => setCatalogoActivoId(catalogo.id)}
            >
              <span className="catalogos-exportacion__tarjeta-icono">
                <i className={catalogo.icono} />
              </span>
              <span className="catalogos-exportacion__tarjeta-contenido">
                <span className="catalogos-exportacion__tarjeta-cat">{catalogo.cat}</span>
                <strong>{catalogo.nombre}</strong>
                <small>{catalogo.descripcion}</small>
              </span>
              <i className="pi pi-angle-right catalogos-exportacion__tarjeta-flecha" />
            </button>
          );
        })}
      </div>

      <CatalogoExportacionCrud key={catalogoActivo.id} catalogo={catalogoActivo} />
    </div>
  );
}
