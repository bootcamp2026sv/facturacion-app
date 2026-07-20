import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { DialogoPuntoVenta } from '../../componentesPuntoVenta';
import { COLOR_PAGO, METODOS_PAGO, TIPOS_DTE } from '../constantesPuntoVenta';

// Confirma el cobro y muestra los campos que corresponden al método de pago.
// No guarda la venta directamente: al confirmar llama a cobrar.
export default function DialogoPagoPuntoVenta({
  visible,
  onHide,
  clienteSeleccionado,
  carrito,
  tipoDte,
  metodoPago,
  errorVenta,
  detalleErrorVenta,
  guardandoVenta,
  cobrar,
  camposFaltantesExportacion,
  resumen,
  efectivoRecibidoRef,
  efectivoRecibidoTexto,
  actualizarEfectivoRecibido,
  efectivoRecibido,
  referenciaPago,
  setReferenciaPago,
  plazoValor,
  setPlazoValor,
  plazoTipo,
  setPlazoTipo,
  esClienteVariosParaFactura,
  tieneDatosReceptorVenta,
  datosReceptorVenta,
  mostrarDatosReceptor,
  setMostrarDatosReceptor,
  setDatosReceptorVenta,
}) {
  return (
    <DialogoPuntoVenta
      header="Confirmar Cobro"
      visible={visible}
      style={{ width: '500px' }}
      onHide={onHide}
      onShow={() => {
        if (metodoPago === 'efectivo') {
          requestAnimationFrame(() => efectivoRecibidoRef.current?.focus());
        }
      }}
      draggable={false}
      resizable={false}
      footer={(
        <div className="flex gap-2 justify-content-end">
          <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={onHide} disabled={guardandoVenta} />
          <Button label={guardandoVenta ? 'Guardando...' : 'Confirmar Pago'} icon={guardandoVenta ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="premium-btn" onClick={cobrar} disabled={guardandoVenta || camposFaltantesExportacion.length > 0 || (metodoPago === 'efectivo' && (!efectivoRecibido || efectivoRecibido < resumen.totalCobrar))} />
        </div>
      )}
    >
      <div className="flex flex-column gap-3 py-2">
        <div className="flex align-items-center gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
          <div className="flex align-items-center justify-content-center border-circle" style={{ width: '48px', height: '48px', minWidth: '48px', background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            <i className="pi pi-file text-white"></i>
          </div>
          <div>
            <p className="font-bold m-0" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado?.label}</p>
            <div className="flex align-items-center gap-2 mt-1 flex-wrap">
              <Tag value={TIPOS_DTE.find((tipo) => tipo.value === tipoDte)?.label} severity="info" style={{ fontSize: '0.65rem' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• {METODOS_PAGO.find((metodo) => metodo.value === metodoPago)?.label}</span>
            </div>
          </div>
        </div>

        {esClienteVariosParaFactura && (
          <div className="flex flex-column gap-2 p-2 border-round-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
            <div className="flex align-items-center justify-content-between gap-2">
              <i className="pi pi-user-edit" style={{ color: '#6366f1' }}></i>
              <div>
                <p className="font-bold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>Datos opcionales del receptor</p>
                {!mostrarDatosReceptor && tieneDatosReceptorVenta && (
                  <p className="m-0 text-xs text-overflow-ellipsis white-space-nowrap overflow-hidden" style={{ color: 'var(--text-muted)' }}>
                    {[datosReceptorVenta.nombre.trim(), datosReceptorVenta.correo.trim()].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="m-0 text-xs" style={{ color: 'var(--text-muted)' }}>No se registrará un cliente nuevo.</p>
              </div>
              <Button label={mostrarDatosReceptor ? 'Ocultar' : tieneDatosReceptorVenta ? 'Editar' : 'Agregar'} icon={mostrarDatosReceptor ? 'pi pi-chevron-up' : 'pi pi-chevron-down'} className="p-button-text p-button-sm" onClick={() => setMostrarDatosReceptor((actual) => !actual)} type="button" />
            </div>
            {mostrarDatosReceptor && (
              <div className="grid mt-1">
                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="premium-label">Nombre <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label>
                  <InputText value={datosReceptorVenta.nombre} onChange={(e) => setDatosReceptorVenta((actual) => ({ ...actual, nombre: e.target.value }))} placeholder="Nombre del comprador" className="w-full" style={{ borderRadius: '10px', padding: '0.55rem 0.75rem' }} />
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="premium-label">Correo <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label>
                  <InputText type="email" value={datosReceptorVenta.correo} onChange={(e) => setDatosReceptorVenta((actual) => ({ ...actual, correo: e.target.value }))} placeholder="correo@ejemplo.com" className="w-full" style={{ borderRadius: '10px', padding: '0.55rem 0.75rem' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {errorVenta && (
          <div className="punto-venta__error-hacienda" role="alert">
            <div className="punto-venta__error-hacienda-cabecera">
              <i className="pi pi-exclamation-circle punto-venta__error-hacienda-icono"></i>
              <div className="punto-venta__error-hacienda-resumen">
                <p className="punto-venta__error-hacienda-titulo">{detalleErrorVenta.titulo}</p>
                {detalleErrorVenta.esRespuestaHacienda && (
                  <div className="punto-venta__error-hacienda-meta">
                    {detalleErrorVenta.codigo && <span>Código: {detalleErrorVenta.codigo}</span>}
                    {detalleErrorVenta.clasificacion && <span>Clasificación: {detalleErrorVenta.clasificacion}</span>}
                  </div>
                )}
              </div>
            </div>
            <p className="punto-venta__error-hacienda-descripcion">{detalleErrorVenta.descripcion}</p>
            {detalleErrorVenta.observaciones.length > 0 && (
              <div className="punto-venta__error-hacienda-observaciones">
                <span className="punto-venta__error-hacienda-etiqueta">Qué debes revisar</span>
                <ul className="punto-venta__error-hacienda-lista">
                  {detalleErrorVenta.observaciones.map((observacion, indice) => <li key={`${observacion}-${indice}`}>{observacion}</li>)}
                </ul>
              </div>
            )}
            <details className="punto-venta__error-hacienda-tecnico">
              <summary>Ver respuesta técnica</summary>
              <pre>{detalleErrorVenta.respuestaTecnica}</pre>
            </details>
          </div>
        )}

        {metodoPago === 'efectivo' && (
          <div className="flex flex-column gap-3 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
            <div className="flex flex-column gap-1">
              <label className="premium-label">Efectivo Recibido</label>
              <InputText
                ref={efectivoRecibidoRef}
                value={efectivoRecibidoTexto}
                onChange={(e) => actualizarEfectivoRecibido(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && efectivoRecibido >= resumen.totalCobrar && !guardandoVenta) {
                    e.preventDefault();
                    cobrar();
                  }
                }}
                inputMode="decimal"
                className="w-full"
                style={{ borderRadius: '10px', padding: '0.65rem 1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                placeholder="$0.00"
                onFocus={(e) => e.target.select()}
              />
            </div>
            {efectivoRecibido > 0 && (
              <div className="flex flex-column gap-1">
                <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Total</span><span className="font-bold" style={{ color: 'var(--text-primary)' }}>${resumen.totalCobrar.toFixed(2)}</span></div>
                <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Efectivo</span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${efectivoRecibido.toFixed(2)}</span></div>
                <hr className="premium-divider" />
                <div className="flex justify-content-between"><span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>Cambio</span><span className="font-bold text-xl" style={{ color: efectivoRecibido >= resumen.totalCobrar ? '#10b981' : '#ef4444' }}>${(efectivoRecibido - resumen.totalCobrar).toFixed(2)}</span></div>
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
            <div style={{ maxWidth: '160px' }}><InputNumber value={plazoValor} onValueChange={(e) => setPlazoValor(e.value || 1)} min={1} max={999} maxFractionDigits={0} useGrouping={false} inputStyle={{ borderRadius: '10px', padding: '0.6rem 0.75rem', textAlign: 'center' }} onFocus={(e) => e.target.select()} /></div>
            <div className="flex gap-1">
              {['días', 'meses', 'años'].map((plazo) => <button key={plazo} onClick={() => setPlazoTipo(plazo)} className="flex-1 border-round-xl border-none cursor-pointer py-2 text-xs font-semibold transition-all transition-duration-200" style={{ background: plazoTipo === plazo ? '#f59e0b' : 'var(--surface-hover)', color: plazoTipo === plazo ? '#fff' : 'var(--text-secondary)' }}>{plazo}</button>)}
            </div>
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>Pago a {plazoValor} {plazoTipo}</p>
          </div>
        )}

        {metodoPago === 'transferencia' && (
          <div className="flex flex-column gap-2 p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
            <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: `${COLOR_PAGO.transferencia}15` }}><i className="pi pi-info-circle text-sm" style={{ color: COLOR_PAGO.transferencia }}></i><p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>La transferencia se procesará a través de la pasarela de pagos.</p></div>
            <div className="flex flex-column gap-1"><label className="premium-label">N° de Transferencia <span style={{ color: 'var(--text-icon)' }}>(opcional)</span></label><InputText value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Ej. REF-12345" className="w-full" style={{ borderRadius: '10px', padding: '0.6rem 0.75rem' }} /></div>
          </div>
        )}

        <div className="border-top-1 surface-border pt-2 flex flex-column gap-1">
          <div className="flex justify-content-between text-sm mb-1"><span style={{ color: 'var(--text-muted)' }}>Total de items</span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{carrito.reduce((suma, item) => suma + item.cantidad, 0)}</span></div>
          {resumen.porTipo.gravado > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#6366f1' }}> Gravado</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.gravado.toFixed(2)}</span></div>}
          {resumen.porTipo.exento > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#10b981' }}> Exento</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.exento.toFixed(2)}</span></div>}
          {resumen.porTipo.noSujeto > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#f59e0b' }}> No Sujeto</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noSujeto.toFixed(2)}</span></div>}
          {resumen.porTipo.noGravado > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: 'var(--text-muted)' }}> No Gravado</span><span style={{ color: 'var(--text-primary)' }}>${resumen.porTipo.noGravado.toFixed(2)}</span></div>}
          {resumen.descuentoTotal > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Descuentos</span><span className="font-semibold" style={{ color: '#ef4444' }}>-${resumen.descuentoTotal.toFixed(2)}</span></div>}
          {tipoDte === '11' && resumen.flete > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Flete</span><span style={{ color: 'var(--text-primary)' }}>${resumen.flete.toFixed(2)}</span></div>}
          {tipoDte === '11' && resumen.seguro > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Seguro</span><span style={{ color: 'var(--text-primary)' }}>${resumen.seguro.toFixed(2)}</span></div>}
          {resumen.ivaTotal > 0 && <div className="flex justify-content-between text-sm"><span style={{ color: 'var(--text-muted)' }}>IVA (13%)</span><span style={{ color: 'var(--text-muted)' }}>${resumen.ivaTotal.toFixed(2)}</span></div>}
          {resumen.retencion > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#f59e0b' }}>Retención 1%</span><span className="font-semibold" style={{ color: '#f59e0b' }}>-${resumen.retencion.toFixed(2)}</span></div>}
          {resumen.reteRenta > 0 && <div className="flex justify-content-between text-sm"><span className="font-semibold" style={{ color: '#d97706' }}>Retención renta 10%</span><span className="font-semibold" style={{ color: '#d97706' }}>-${resumen.reteRenta.toFixed(2)}</span></div>}
          <div className="flex justify-content-between pt-1 border-top-1 surface-border"><span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total a cobrar</span><span className="font-bold text-xl" style={{ color: '#6366f1' }}>${resumen.totalCobrar.toFixed(2)}</span></div>
        </div>
      </div>
    </DialogoPuntoVenta>
  );
}
