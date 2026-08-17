import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { DialogoPuntoVenta } from '../../componentesPuntoVenta';
import { TASA_IVA } from '../reglasPuntoVenta';
import { obtenerEtiquetaIvaParaDte } from '../reglasPuntoVenta';
import { redondearMoneda as redondear } from '../../../../utils/calculosVenta';

// Edita un producto antes de agregarlo o actualizarlo en el carrito.
export default function DialogoProductoPuntoVenta({
  visible,
  itemEditando,
  setItemEditando,
  carrito,
  precioIncluyeIva,
  documentoSinIva,
  tipoDte,
  cambiarModoIvaPrecio,
  agregarAlCarrito,
  onCancelar,
}) {
  return (
    <DialogoPuntoVenta
      header="Personalizar producto"
      visible={visible}
      style={{ width: '580px' }}
      onHide={onCancelar}
      draggable={false}
      resizable={false}
      footer={(
        <div className="flex gap-2 justify-content-end">
          <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={onCancelar} />
          <Button label={carrito.find((item) => item._key === itemEditando?._key) ? 'Actualizar' : 'Agregar al Carrito'} icon="pi pi-cart-plus" className="premium-btn" onClick={agregarAlCarrito} />
        </div>
      )}
    >
      {itemEditando && (() => {
        const precioUnitarioEditor = documentoSinIva
          ? Math.max(Number(itemEditando.precioLiteralSinIva) || 0, 0)
          : itemEditando.precio;
        const precioBase = (!documentoSinIva && precioIncluyeIva && itemEditando.tipoIva === 'gravado')
          ? itemEditando.precio / (1 + TASA_IVA)
          : precioUnitarioEditor;
        const subtotal = precioBase * itemEditando.cantidad;
        const descuentoSolicitado = itemEditando.descuentoTipo === 'porcentaje'
          ? subtotal * Math.max(Number(itemEditando.descuentoValor) || 0, 0) / 100
          : Math.max(Number(itemEditando.descuentoValor) || 0, 0);
        const descuento = Math.min(descuentoSolicitado, subtotal);
        const subtotalDesc = subtotal - descuento;
        const iva = !documentoSinIva && itemEditando.tipoIva === 'gravado'
          ? redondear(subtotalDesc * TASA_IVA)
          : 0;
        const totalItem = redondear(subtotalDesc + iva);

        return (
          <div className="flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'hidden' }}>
            <div className="flex flex-column gap-1">
              <label className="premium-label">Nombre del producto</label>
              <InputText value={itemEditando.nombre} onChange={(e) => setItemEditando({ ...itemEditando, nombre: e.target.value })} className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} />
            </div>

            <div className="flex gap-2 punto-venta__editor-precios-cantidad">
              <div className="flex-1 flex flex-column gap-1">
                <div className="flex justify-content-between align-items-center">
                  <label className="premium-label">Precio unitario</label>
                  {documentoSinIva ? (
                    <div className="flex align-items-center gap-1 px-2 border-round-lg font-bold" style={{ height: '22px', background: 'rgba(100,116,139,0.14)', color: '#64748b', fontSize: '0.62rem' }}>
                      <i className="pi pi-check-circle" style={{ fontSize: '0.62rem' }}></i>
                      Sin IVA
                    </div>
                  ) : (
                    <div className="flex border-1 surface-border border-round-lg overflow-hidden" style={{ height: '22px' }}>
                      <button type="button" onClick={() => cambiarModoIvaPrecio(false)} className="border-none cursor-pointer px-2 text-2xs font-bold transition-all transition-duration-150" style={{ background: !precioIncluyeIva ? '#6366f1' : 'var(--card-bg)', color: !precioIncluyeIva ? '#fff' : 'var(--text-muted)', fontSize: '0.62rem' }}>Sin IVA</button>
                      <button type="button" onClick={() => cambiarModoIvaPrecio(true)} className="border-none cursor-pointer px-2 text-2xs font-bold transition-all transition-duration-150" style={{ background: precioIncluyeIva ? '#6366f1' : 'var(--card-bg)', color: precioIncluyeIva ? '#fff' : 'var(--text-muted)', fontSize: '0.62rem' }}>Con IVA</button>
                    </div>
                  )}
                </div>
                <InputNumber value={precioUnitarioEditor} locale="en-US" onValueChange={(e) => setItemEditando({ ...itemEditando, ...(documentoSinIva ? { precioLiteralSinIva: e.value || 0 } : { precio: e.value || 0 }) })} min={0} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} onFocus={(e) => e.target.select()} />
              </div>
              <div className="flex-1 flex flex-column gap-1">
                <label className="premium-label">Cantidad</label>
                <InputNumber value={itemEditando.cantidad} locale="en-US" onValueChange={(e) => setItemEditando({ ...itemEditando, cantidad: e.value || 1 })} min={1} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} onFocus={(e) => e.target.select()} />
              </div>
            </div>

            <div className="flex flex-column gap-1">
              <label className="premium-label">Tipo de IVA</label>
              <div className="flex gap-1">
                {['gravado', 'exento', 'noSujeto', 'noGravado'].map((tipoIva) => (
                  <button key={tipoIva} onClick={() => setItemEditando({ ...itemEditando, tipoIva })} className="flex-1 border-round-xl border-none cursor-pointer py-2 text-xs font-semibold transition-all transition-duration-200" style={{ background: itemEditando.tipoIva === tipoIva ? `${tipoIva === 'gravado' ? '#6366f1' : tipoIva === 'exento' ? '#10b981' : tipoIva === 'noSujeto' ? '#f59e0b' : '#64748b'}` : 'var(--surface-hover)', color: itemEditando.tipoIva === tipoIva ? '#fff' : 'var(--text-secondary)' }}>
                    {obtenerEtiquetaIvaParaDte(tipoIva, tipoDte).label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-column gap-1">
              <label className="premium-label">Descuento</label>
              <div className="flex gap-2 align-items-center">
                <div className="flex border-round-xl overflow-hidden" style={{ border: '1.5px solid var(--surface-border-light)', flexShrink: 0, height: '40px' }}>
                  <button onClick={() => setItemEditando({ ...itemEditando, descuentoTipo: 'porcentaje', descuentoValor: 0 })} className="border-none cursor-pointer px-3 text-sm font-semibold transition-all transition-duration-200" style={{ background: itemEditando.descuentoTipo === 'porcentaje' ? '#6366f1' : 'var(--card-bg)', color: itemEditando.descuentoTipo === 'porcentaje' ? '#fff' : 'var(--text-muted)', height: '100%' }}>%</button>
                  <button onClick={() => setItemEditando({ ...itemEditando, descuentoTipo: 'monto', descuentoValor: 0 })} className="border-none cursor-pointer px-3 text-sm font-semibold transition-all transition-duration-200" style={{ background: itemEditando.descuentoTipo === 'monto' ? '#6366f1' : 'var(--card-bg)', color: itemEditando.descuentoTipo === 'monto' ? '#fff' : 'var(--text-muted)', height: '100%' }}>$</button>
                </div>
                <InputNumber value={itemEditando.descuentoValor} locale="en-US" onValueChange={(e) => setItemEditando({ ...itemEditando, descuentoValor: e.value || 0 })} min={0} max={itemEditando.descuentoTipo === 'porcentaje' ? 100 : undefined} className="w-full" inputStyle={{ borderRadius: '10px', padding: '0.65rem 1rem' }} minFractionDigits={2} maxFractionDigits={2} placeholder={itemEditando.descuentoTipo === 'porcentaje' ? '0.00%' : '$0.00'} onFocus={(e) => e.target.select()} />
              </div>
            </div>

            <div className="p-3 border-round-xl" style={{ background: 'var(--surface-muted)', border: '1px solid var(--surface-border-light)', overflowX: 'hidden' }}>
              <div className="flex flex-column gap-1">
                <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>{itemEditando.cantidad} x ${precioBase.toFixed(2)}{!documentoSinIva && precioIncluyeIva && itemEditando.tipoIva === 'gravado' && <span style={{ fontSize: '0.72rem', opacity: 0.75 }}> (${itemEditando.precio.toFixed(2)} c/IVA)</span>}</span><span style={{ color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span></div>
                {descuento > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Descuento</span><span className="font-semibold" style={{ color: '#ef4444' }}>-${descuento.toFixed(2)}</span></div>}
                <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>IVA ({!documentoSinIva && itemEditando.tipoIva === 'gravado' ? '13%' : '0%'})</span><span style={{ color: 'var(--text-muted)' }}>${iva.toFixed(2)}</span></div>
                <div className="flex justify-content-between font-bold pt-1 border-top-1 surface-border"><span style={{ color: 'var(--text-primary)' }}>Total item</span><span className="text-lg" style={{ color: '#6366f1' }}>${totalItem.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        );
      })()}
    </DialogoPuntoVenta>
  );
}
