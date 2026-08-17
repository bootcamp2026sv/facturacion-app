import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { PanelCarrito } from '../../componentesPuntoVenta';
import {
  COLOR_PAGO,
  METODOS_PAGO,
  TIPOS_DTE,
} from '../constantesPuntoVenta';
import {
  calcularItemParaDte,
  obtenerEtiquetaIvaParaDte,
  obtenerPrecioParaDte,
} from '../reglasPuntoVenta';

// Panel derecho: cliente, DTE, carrito, totales y métodos de pago.
// Las acciones importantes llegan desde VistaPuntoVenta y los hooks.
export default function PanelCarritoPuntoVenta({
  carrito,
  cliente,
  clienteSeleccionado,
  abrirDialogoCliente,
  mostrarDatosCliente,
  setMostrarDatosCliente,
  nombreClienteSeleccionado,
  direccionClienteSeleccionado,
  actividadClienteTexto,
  tipoDocumentoClienteSeleccionado,
  documentoSinIva,
  esGranContribuyente,
  setEsGranContribuyente,
  tipoDte,
  seleccionarTipoDte,
  metodoPago,
  setMetodoPago,
  retenerRenta,
  setRetenerRenta,
  resumen,
  cambiarCantidad,
  quitarDelCarrito,
  editarItem,
  mensajeClienteCreditoFiscal,
  abrirDialogoCobro,
  cargandoCatalogos,
  comercio,
  camposFaltantesCreditoFiscal,
}) {
  return (
    <PanelCarrito>
      <div className="p-3 border-bottom-1 surface-border flex align-items-center justify-content-between">
        <div className="flex align-items-center gap-2">
          <div className="flex align-items-center justify-content-center border-circle" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            <i className="pi pi-shopping-cart text-white text-sm"></i>
          </div>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Venta Actual</span>
        </div>
        <Tag value={`${carrito.reduce((suma, item) => suma + item.cantidad, 0)} items`} className="premium-tag" severity="info" />
      </div>

      <div className="w-full border-bottom-1 surface-border flex align-items-stretch" style={{ background: 'transparent' }}>
        <button
          type="button"
          onClick={abrirDialogoCliente}
          className="border-none cursor-pointer p-3 flex align-items-center gap-3 transition-all transition-duration-200 flex-1 min-w-0"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-muted)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div className="flex align-items-center justify-content-center border-circle" style={{ width: '36px', height: '36px', minWidth: '36px', background: !cliente ? 'var(--surface-border-light)' : 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            <i className={`${!cliente ? 'pi pi-user' : 'pi pi-user-check'} text-sm`} style={{ color: !cliente ? 'var(--text-muted)' : '#fff' }}></i>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cliente</p>
            <p className="punto-venta__cliente-nombre font-semibold m-0 text-sm flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {clienteSeleccionado?.label || 'Seleccione cliente'}
              {clienteSeleccionado?.granContribuyente && <Tag value="GC" severity="warning" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem' }} />}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMostrarDatosCliente((actual) => !actual)}
          className="border-none cursor-pointer px-3 transition-all transition-duration-200"
          style={{ background: 'transparent', color: 'var(--text-icon)' }}
          aria-label={mostrarDatosCliente ? 'Ocultar datos del cliente' : 'Mostrar datos del cliente'}
          disabled={!clienteSeleccionado}
          onMouseEnter={(e) => { if (clienteSeleccionado) e.currentTarget.style.background = 'var(--surface-muted)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <i className={`pi ${mostrarDatosCliente ? 'pi-chevron-up' : 'pi-chevron-down'} text-xs`}></i>
        </button>
      </div>

      {mostrarDatosCliente && clienteSeleccionado && (
        <div className="punto-venta__cliente-detalles px-2 py-1 border-bottom-1 surface-border" style={{ background: 'var(--surface-muted)' }}>
          <div className="punto-venta__cliente-detalles-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', columnGap: '0.4rem', rowGap: '0.1rem' }}>
            <div className="col-12 md:col-6">
              <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Nombre</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{nombreClienteSeleccionado || 'No registrado'}</span>
            </div>
            {clienteSeleccionado.nombreComercial && (
              <div className="col-12 md:col-6">
                <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Comercial</span>
                <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado.nombreComercial}</span>
              </div>
            )}
            <div className="col-6 md:col-3">
              <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Documento</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{tipoDocumentoClienteSeleccionado ? `${tipoDocumentoClienteSeleccionado}: ` : ''}{clienteSeleccionado.numDocumento || clienteSeleccionado.nit || 'No registrado'}</span>
            </div>
            <div className="col-6 md:col-3">
              <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>NRC</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado.nrc || 'No registrado'}</span>
            </div>
            <div className="col-12 md:col-6">
              <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Correo</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado.correo || 'No registrado'}</span>
            </div>
            <div className="col-12 md:col-6">
              <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Teléfono</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado.telefono || 'No registrado'}</span>
            </div>
            {actividadClienteTexto && (
              <div className="col-12">
                <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actividad / giro</span>
                <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{actividadClienteTexto}</span>
              </div>
            )}
            <div className="col-12">
              <span className="block text-2xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Dirección</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{direccionClienteSeleccionado || 'No registrada'}</span>
            </div>
          </div>
        </div>
      )}

      {!!cliente && !documentoSinIva && (
        <div className="px-3 py-2 flex align-items-center justify-content-between border-bottom-1 surface-border" style={{ background: 'var(--surface-muted)' }}>
          <div className="flex align-items-center gap-2">
            <i className="pi pi-percentage text-xs" style={{ color: !documentoSinIva && esGranContribuyente ? '#f59e0b' : 'var(--text-icon)' }}></i>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Gran Contribuyente</span>
          </div>
          <button
            type="button"
            onClick={() => { if (!documentoSinIva) setEsGranContribuyente(!esGranContribuyente); }}
            disabled={documentoSinIva}
            className={`border-none p-1 px-2 border-round text-xs font-bold transition-all transition-duration-200 ${documentoSinIva ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              background: !documentoSinIva && esGranContribuyente ? 'rgba(245,158,11,0.15)' : 'var(--surface-hover)',
              color: !documentoSinIva && esGranContribuyente ? '#f59e0b' : 'var(--text-muted)',
              border: !documentoSinIva && esGranContribuyente ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--surface-border-light)',
              opacity: documentoSinIva ? 0.75 : 1,
            }}
          >
            {documentoSinIva ? 'Sin retención' : esGranContribuyente ? 'Retención Activa' : 'Desactivada'}
          </button>
        </div>
      )}

      <div className="px-3 py-2 border-bottom-1 surface-border flex flex-column gap-2" style={{ background: 'var(--surface-ground-light)' }}>
        <p className="text-xs font-semibold m-0" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Tipo de DTE</p>
        <div className="punto-venta__opciones-dte" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {TIPOS_DTE.map((tipo) => {
            const esActivo = tipoDte === tipo.value;
            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => seleccionarTipoDte(tipo.value)}
                aria-pressed={esActivo}
                aria-label={`Seleccionar ${tipo.label}`}
                className="border-none cursor-pointer p-2 flex align-items-center justify-content-center gap-2 transition-all transition-duration-150"
                style={{
                  background: esActivo ? `${tipo.color}15` : 'transparent',
                  border: `1.5px solid ${esActivo ? tipo.color : 'var(--surface-border-light)'}`,
                  borderRadius: '8px',
                  color: esActivo ? tipo.color : 'var(--text-secondary)',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => { if (!esActivo) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { if (!esActivo) e.currentTarget.style.background = 'transparent'; }}
              >
                <i className={`${tipo.icon} text-xs`} style={{ color: esActivo ? tipo.color : 'var(--text-icon)' }}></i>
                <span className="font-bold" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{tipo.label.split(' (')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tipoDte === '14' && (
        <div className="px-3 py-2 border-bottom-1 surface-border flex align-items-center justify-content-between gap-3" style={{ background: retenerRenta ? 'rgba(245,158,11,0.10)' : 'var(--surface-muted)' }}>
          <div className="flex align-items-center gap-2 min-w-0">
            <div className="flex align-items-center justify-content-center border-circle" style={{ width: '30px', height: '30px', minWidth: '30px', background: retenerRenta ? 'rgba(245,158,11,0.18)' : 'var(--surface-hover)' }}>
              <i className="pi pi-percentage text-xs" style={{ color: retenerRenta ? '#d97706' : 'var(--text-icon)' }}></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold m-0" style={{ color: 'var(--text-primary)' }}>Retención de renta 10%</p>
              <p className="m-0" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                {retenerRenta ? `Se descontarán $${resumen.reteRenta.toFixed(2)} del total.` : 'Opcional para sujeto excluido.'}
              </p>
            </div>
          </div>
          <InputSwitch checked={retenerRenta} onChange={(e) => setRetenerRenta(e.value)} aria-label="Aplicar retención de renta del 10%" />
        </div>
      )}

      <div className="punto-venta__carrito-contenido">
        {carrito.length === 0 ? (
          <div className="punto-venta__carrito-vacio flex flex-column align-items-center justify-content-center">
            <i className="pi pi-cart-arrow-down text-5xl mb-2" style={{ color: 'var(--text-icon)' }}></i>
            <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-icon)' }}>Carrito vacío</p>
            <p className="text-xs m-0" style={{ color: 'var(--text-icon)' }}>Seleccione productos</p>
          </div>
        ) : (
          <div className="flex flex-column gap-2">
            {carrito.map((item) => {
              const calculo = calcularItemParaDte(item, tipoDte);
              const etiquetaIva = obtenerEtiquetaIvaParaDte(item.tipoIva, tipoDte);
              return (
                <div key={item._key} className="p-2 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
                  <div className="flex align-items-center gap-2">
                    <div className="flex-1 min-w-0 punto-venta__item-nombre">
                      <span className="punto-venta__item-nombre font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.nombre}</span>
                    </div>
                    <div className="flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                      <Tag value={etiquetaIva.label} severity={etiquetaIva.severity} style={{ fontSize: '0.55rem', padding: '0 0.4rem', height: '16px' }} />
                      <span className="font-bold text-sm" style={{ color: calculo.iva > 0 ? '#6366f1' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>${calculo.total.toFixed(2)}</span>
                      <button
                        type="button"
                        aria-label={`Quitar ${item.nombre}`}
                        onClick={() => quitarDelCarrito(item._key)}
                        className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0"
                        style={{ width: '20px', height: '20px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.55rem', flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                      >
                        <i className="pi pi-trash" style={{ fontSize: '0.6rem' }}></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex align-items-center gap-2" style={{ marginTop: '4px' }}>
                    <div className="flex align-items-center" style={{ gap: '2px' }}>
                      <button type="button" aria-label={`Disminuir cantidad de ${item.nombre}`} onClick={() => cambiarCantidad(item._key, -1)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '24px', height: '24px', background: 'var(--surface-border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1 }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-icon)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-border-light)'; }}>−</button>
                      <span className="font-bold text-center" style={{ width: '22px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.cantidad}</span>
                      <button type="button" aria-label={`Aumentar cantidad de ${item.nombre}`} onClick={() => cambiarCantidad(item._key, 1)} className="flex align-items-center justify-content-center border-circle border-none cursor-pointer p-0" style={{ width: '24px', height: '24px', background: 'var(--surface-border-light)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1 }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-icon)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-border-light)'; }}>+</button>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      × ${obtenerPrecioParaDte(item, tipoDte).toFixed(2)}
                      {tipoDte === '01' && item.tipoIva === 'gravado' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}> c/IVA</span>}
                    </span>
                    {item.descuentoValor > 0 && <span className="punto-venta__descuento text-xs font-semibold" style={{ color: '#ef4444' }}>−{item.descuentoTipo === 'porcentaje' ? `${item.descuentoValor}%` : `$${item.descuentoValor}`}</span>}
                    <button type="button" aria-label={`Editar ${item.nombre}`} onClick={() => editarItem(item)} className="border-none bg-transparent cursor-pointer p-0 flex align-items-center text-xs" style={{ color: '#6366f1', marginLeft: 'auto' }}><i className="pi pi-pencil" style={{ fontSize: '0.6rem' }}></i></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-top-1 surface-border flex flex-column gap-3">
        <div className="flex flex-column gap-1">
          <div className="flex justify-content-between mb-1"><span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total de items</span><span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{carrito.reduce((suma, item) => suma + item.cantidad, 0)}</span></div>
          {resumen.porTipo.gravado > 0 && <div className="flex justify-content-between"><span className="text-sm font-semibold" style={{ color: '#6366f1' }}> Gravado</span><span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.gravado.toFixed(2)}</span></div>}
          {resumen.porTipo.exento > 0 && <div className="flex justify-content-between"><span className="text-sm font-semibold" style={{ color: '#10b981' }}> Exento</span><span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.exento.toFixed(2)}</span></div>}
          {resumen.porTipo.noSujeto > 0 && <div className="flex justify-content-between"><span className="text-sm font-semibold" style={{ color: '#f59e0b' }}> No Sujeto</span><span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noSujeto.toFixed(2)}</span></div>}
          {resumen.porTipo.noGravado > 0 && <div className="flex justify-content-between"><span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}> No Gravado</span><span className="text-sm" style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noGravado.toFixed(2)}</span></div>}
          {resumen.descuentoTotal > 0 && <div className="flex justify-content-between"><span className="text-sm" style={{ color: 'var(--text-muted)' }}>Descuentos</span><span className="text-sm font-semibold" style={{ color: '#ef4444' }}>-${resumen.descuentoTotal.toFixed(2)}</span></div>}
          {resumen.ivaTotal > 0 && <div className="flex justify-content-between"><span className="text-sm" style={{ color: 'var(--text-muted)' }}>IVA (13%)</span><span className="text-sm" style={{ color: 'var(--text-muted)' }}>${resumen.ivaTotal.toFixed(2)}</span></div>}
          {resumen.retencion > 0 && <div className="flex justify-content-between"><span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Retención (1%)</span><span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>-${resumen.retencion.toFixed(2)}</span></div>}
          {resumen.reteRenta > 0 && <div className="flex justify-content-between"><span className="text-sm font-semibold" style={{ color: '#d97706' }}>Retención renta (10%)</span><span className="text-sm font-semibold" style={{ color: '#d97706' }}>-${resumen.reteRenta.toFixed(2)}</span></div>}
          <div className="flex justify-content-between pt-2 border-top-1 surface-border"><span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total a cobrar</span><span className="font-bold text-xl" style={{ color: '#6366f1' }}>${resumen.totalCobrar.toFixed(2)}</span></div>
        </div>

        <div className="flex gap-1 punto-venta__metodos-pago">
          {METODOS_PAGO.map((metodo) => (
            <button key={metodo.value} type="button" aria-pressed={metodoPago === metodo.value} onClick={() => setMetodoPago(metodo.value)} className="punto-venta__metodo-pago flex-1 flex flex-column align-items-center gap-1 p-1 border-round-lg border-none cursor-pointer transition-all transition-duration-200" style={{ background: metodoPago === metodo.value ? `${COLOR_PAGO[metodo.value]}20` : 'var(--surface-muted)', border: `1.5px solid ${metodoPago === metodo.value ? COLOR_PAGO[metodo.value] : 'var(--surface-border-light)'}` }}>
              <i className={`${metodo.icono} text-xs`} style={{ color: metodoPago === metodo.value ? COLOR_PAGO[metodo.value] : 'var(--text-icon)' }}></i>
              <span className="text-xs font-semibold" style={{ color: metodoPago === metodo.value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.6rem' }}>{metodo.label}</span>
            </button>
          ))}
        </div>

        {mensajeClienteCreditoFiscal && (
          <div className="flex align-items-start gap-2 p-2 border-round-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309' }}>
            <i className="pi pi-exclamation-triangle text-sm mt-1"></i>
            <p className="text-xs font-semibold m-0 line-height-3">{mensajeClienteCreditoFiscal}</p>
          </div>
        )}

        <Button label="Cobrar" icon="pi pi-credit-card" className="premium-btn w-full" style={{ fontSize: '1.05rem' }} onClick={abrirDialogoCobro} disabled={carrito.length === 0 || cargandoCatalogos || !clienteSeleccionado || !comercio || camposFaltantesCreditoFiscal.length > 0} />
      </div>
    </PanelCarrito>
  );
}
