import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { PanelCatalogo } from '../../componentesPuntoVenta';
import { obtenerEtiquetaIvaParaDte, obtenerPrecioParaDte } from '../reglasPuntoVenta';

// Panel izquierdo: búsqueda, categorías, recarga y selección de productos.
// Recibe las acciones del carrito, pero no guarda productos por su cuenta.
export default function PanelCatalogoPuntoVenta({
  busqueda,
  setBusqueda,
  categorias,
  categoriaActiva,
  setCategoriaActiva,
  recargarProductos,
  cargandoCatalogos,
  recargandoProductos,
  pantallaCompleta,
  togglePantallaCompleta,
  productosFiltrados,
  tipoDte,
  seleccionarItem,
}) {
  return (
    <PanelCatalogo>
      <div className="premium-surface-card p-3 flex flex-column sm:flex-row gap-3 align-items-start sm:align-items-center">
        <div className="premium-input-group flex-1 punto-venta__barra-herramientas">
          <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.85rem' }}></i>
          <InputText value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="w-full" />
        </div>
        <div className="flex align-items-center gap-2 flex-wrap">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => setCategoriaActiva(categoria)}
              className="border-none border-round-xl cursor-pointer px-3 py-2 text-sm font-semibold transition-all transition-duration-200"
              style={{
                background: categoriaActiva === categoria ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface-hover)',
                color: categoriaActiva === categoria ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {categoria}
            </button>
          ))}
          <button
            onClick={() => recargarProductos()}
            disabled={cargandoCatalogos || recargandoProductos}
            title="Recargar productos"
            className="flex align-items-center justify-content-center gap-2 border-none border-round-xl cursor-pointer transition-all transition-duration-200 px-3 py-2 text-sm font-semibold"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)', opacity: (cargandoCatalogos || recargandoProductos) ? 0.65 : 1 }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--surface-border-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
          >
            <i className={`pi ${recargandoProductos ? 'pi-spin pi-spinner' : 'pi-refresh'}`}></i>
            <span>Recargar</span>
          </button>
          <button
            onClick={togglePantallaCompleta}
            title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="flex align-items-center justify-content-center border-none border-round-xl cursor-pointer transition-all transition-duration-200"
            style={{ width: '36px', height: '36px', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-border-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
          >
            <i className={`pi ${pantallaCompleta ? 'pi-window-minimize' : 'pi-window-maximize'} text-sm`}></i>
          </button>
        </div>
      </div>

      <div className="punto-venta__productos premium-surface-card p-3">
        {cargandoCatalogos ? (
          <div className="punto-venta__estado flex flex-column align-items-center justify-content-center">
            <i className="pi pi-spin pi-spinner text-4xl mb-3" style={{ color: '#6366f1' }}></i>
            <p className="text-lg font-semibold m-0" style={{ color: 'var(--text-icon)' }}>Cargando productos</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="punto-venta__estado punto-venta__estado--vacio flex flex-column align-items-center justify-content-center">
            <i className="pi pi-box text-6xl mb-3" style={{ color: 'var(--text-icon)' }}></i>
            <p className="text-lg font-semibold m-0" style={{ color: 'var(--text-icon)' }}>No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid">
            {productosFiltrados.map((producto) => {
              const etiquetaIva = obtenerEtiquetaIvaParaDte(producto.tipoIva, tipoDte);
              return (
                <div key={producto.id} className="col-6 sm:col-4 lg:col-3 xl:col-2">
                  <button
                    type="button"
                    onClick={() => seleccionarItem(producto)}
                    className="punto-venta__producto border-none border-round-xl p-3 cursor-pointer flex flex-column align-items-center gap-2"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c7d2fe';
                      e.currentTarget.style.boxShadow = '0 8px 25px -8px rgba(99,102,241,0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--surface-border-light)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div className="punto-venta__producto-visual flex align-items-center justify-content-center border-circle">
                      <i className={`${producto.icono} punto-venta__producto-icono-fallback text-lg`} aria-hidden="true"></i>
                      {producto.imagen && (
                        <img
                          src={producto.imagen}
                          alt=""
                          className="punto-venta__producto-imagen"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <span className="punto-venta__producto-nombre text-sm font-semibold text-center">{producto.nombre}</span>
                    <span className="punto-venta__producto-precio text-sm font-bold">
                      ${obtenerPrecioParaDte(producto, tipoDte).toFixed(2)}
                      {tipoDte === '01' && producto.tipoIva === 'gravado' && <span className="text-2xs font-normal" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}> (IVA incl.)</span>}
                    </span>
                    <Tag value={etiquetaIva.label} severity={etiquetaIva.severity} className="punto-venta__producto-etiqueta premium-tag" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PanelCatalogo>
  );
}
