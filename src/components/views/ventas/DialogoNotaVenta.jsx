import { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import {
  calcularResumenNota,
  etiquetaTributacionNota,
  validarLineaNota,
  validarNota,
} from './reglasNotasVenta';
import './DialogoNotaVenta.css';

const formatoDinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const formatoNumero = (valor) => Number(valor || 0).toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const nombreCliente = (venta) => {
  if (venta?.nombreReceptor) return venta.nombreReceptor;
  const cliente = venta?.cliente;
  return [cliente?.nombre, cliente?.nombres, cliente?.apellidos]
    .filter(Boolean)
    .join(' ')
    .trim() || cliente?.nombreComercial || 'Cliente';
};

const colorTributacion = (tributacion) => ({
  gravado: '#6366f1',
  exento: '#10b981',
  noSujeto: '#f59e0b',
  noGravado: '#64748b',
}[tributacion] || '#f43f5e');

export default function DialogoNotaVenta({
  visible,
  tipoDte,
  ventaOrigen,
  lineas,
  setLineas,
  cargando,
  errorCarga,
  errorEmision,
  emitiendo,
  onReintentar,
  onEmitir,
  onHide,
}) {
  const esCredito = tipoDte === '05';
  const esGranContribuyente = Boolean(ventaOrigen?.cliente?.granContribuyente);
  const validacion = useMemo(() => validarNota(lineas, tipoDte), [lineas, tipoDte]);
  const resumen = useMemo(
    () => calcularResumenNota({ lineas, esGranContribuyente }),
    [lineas, esGranContribuyente]
  );

  const actualizarLinea = (key, cambios) => {
    setLineas((actuales) => actuales.map((linea) => (
      linea.key === key ? { ...linea, ...cambios } : linea
    )));
  };

  const editorCantidad = (linea) => (
    <InputNumber
      value={linea.cantidadNota}
      locale="en-US"
      useGrouping={false}
      min={0.0001}
      max={esCredito ? linea.cantidadOriginal : undefined}
      minFractionDigits={0}
      maxFractionDigits={4}
      disabled={!linea.seleccionada || emitiendo}
      onValueChange={(evento) => actualizarLinea(linea.key, { cantidadNota: evento.value })}
      onFocus={(evento) => evento.target.select()}
      inputClassName="nota-venta__input"
      className="w-full"
      aria-label={`Nueva cantidad para ${linea.detalleOriginal?.descripcion || 'detalle'}`}
    />
  );

  const editorPrecio = (linea) => (
    <InputNumber
      value={linea.precioNota}
      locale="en-US"
      useGrouping={false}
      min={0.0001}
      minFractionDigits={2}
      maxFractionDigits={4}
      prefix="$ "
      disabled={!linea.seleccionada || emitiendo}
      onValueChange={(evento) => actualizarLinea(linea.key, { precioNota: evento.value })}
      onFocus={(evento) => evento.target.select()}
      inputClassName="nota-venta__input"
      className="w-full"
      aria-label={`Nuevo precio sin IVA para ${linea.detalleOriginal?.descripcion || 'detalle'}`}
    />
  );

  const idSelectorLinea = (linea, contexto) => `nota-linea-${contexto}-${linea.key}`;

  const selectorLinea = (linea, contexto) => (
    <Checkbox
      inputId={idSelectorLinea(linea, contexto)}
      checked={linea.seleccionada}
      disabled={!linea.tributacion || emitiendo}
      onChange={(evento) => actualizarLinea(linea.key, { seleccionada: evento.checked })}
      aria-label={`Incluir ${linea.detalleOriginal?.descripcion || 'detalle'} en la nota`}
    />
  );

  const erroresLinea = (linea) => validarLineaNota(linea, tipoDte);

  const pie = (
    <div className="nota-venta__footer">
      <div className="nota-venta__footer-hint">
        <i className="pi pi-shield"></i>
        <span>La nota se enviará a Hacienda al confirmar.</span>
      </div>
      <div className="nota-venta__footer-actions">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-outlined p-button-secondary"
          onClick={onHide}
          disabled={emitiendo}
        />
        <Button
          label={emitiendo ? 'Emitiendo nota...' : `Emitir DTE ${tipoDte}`}
          icon={emitiendo ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
          className="premium-btn"
          onClick={onEmitir}
          disabled={cargando || emitiendo || !validacion.esValida}
        />
      </div>
    </div>
  );

  return (
    <Dialog
      header={`${esCredito ? 'Nota de Crédito' : 'Nota de Débito'} · DTE ${tipoDte}`}
      visible={visible}
      style={{ width: '1120px', maxWidth: 'calc(100vw - 1rem)' }}
      breakpoints={{ '1200px': 'calc(100vw - 2rem)', '640px': 'calc(100vw - 1rem)' }}
      className={`ventas-dialog nota-venta-dialog nota-venta-dialog--${tipoDte}`}
      onHide={onHide}
      footer={pie}
      draggable={false}
      resizable={false}
      closable={!emitiendo}
      closeOnEscape={!emitiendo}
    >
      <div className="nota-venta">
        {cargando && (
          <div className="nota-venta__estado">
            <div className="nota-venta__spinner">
              <i className="pi pi-spin pi-spinner"></i>
            </div>
            <div>
              <p>Cargando venta original</p>
              <span>Estamos obteniendo los detalles reales del DTE.</span>
            </div>
          </div>
        )}

        {!cargando && errorCarga && (
          <div className="nota-venta__estado nota-venta__estado--error" role="alert">
            <div className="nota-venta__estado-icono">
              <i className="pi pi-exclamation-triangle"></i>
            </div>
            <div className="nota-venta__estado-contenido">
              <p>No se pudieron cargar los detalles</p>
              <span>{errorCarga}</span>
              <Button
                label="Reintentar"
                icon="pi pi-refresh"
                className="p-button-sm p-button-outlined mt-3"
                onClick={onReintentar}
              />
            </div>
          </div>
        )}

        {!cargando && !errorCarga && ventaOrigen && (
          <>
            <section className="nota-venta__origen">
              <div className="nota-venta__origen-icono">
                <i className={`pi ${esCredito ? 'pi-arrow-down-left' : 'pi-arrow-up-right'}`}></i>
              </div>
              <div className="nota-venta__origen-principal">
                <span className="nota-venta__eyebrow">Documento relacionado</span>
                <h3>{ventaOrigen.numeroControl}</h3>
                <p>{nombreCliente(ventaOrigen)}</p>
              </div>
              <div className="nota-venta__origen-meta">
                <div>
                  <span>Fecha original</span>
                  <strong>{ventaOrigen.fecha ? new Date(ventaOrigen.fecha).toLocaleString('es-SV') : '—'}</strong>
                </div>
                <div>
                  <span>Total original</span>
                  <strong>{formatoDinero(ventaOrigen.totalGeneral)}</strong>
                </div>
              </div>
              <div className={`nota-venta__tipo nota-venta__tipo--${tipoDte}`}>
                <span>DTE</span>
                <strong>{tipoDte}</strong>
              </div>
            </section>

            <div className="nota-venta__instruccion">
              <div>
                <i className="pi pi-info-circle"></i>
                <span>Seleccione los conceptos que formarán el ajuste e indique su cantidad y precio sin IVA.</span>
              </div>
              <span className={`nota-venta__contribuyente ${esGranContribuyente ? 'nota-venta__contribuyente--activo' : ''}`}>
                <i className={`pi ${esGranContribuyente ? 'pi-check-circle' : 'pi-minus-circle'}`}></i>
                {esGranContribuyente ? 'Receptor gran contribuyente' : 'Sin retención por receptor'}
              </span>
            </div>

            {errorEmision && (
              <div className="nota-venta__error-emision" role="alert">
                <i className="pi pi-times-circle"></i>
                <div>
                  <strong>No se pudo emitir la nota</strong>
                  <span>{errorEmision}</span>
                </div>
              </div>
            )}

            <div className="nota-venta__tabla-contenedor">
              <table className="nota-venta__tabla">
                <thead>
                  <tr>
                    <th aria-label="Seleccionar"></th>
                    <th>Descripción</th>
                    <th>Tributación</th>
                    <th className="text-right">Cantidad original</th>
                    <th className="text-right">Precio original</th>
                    <th>Nueva cantidad</th>
                    <th>Nuevo precio sin IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea) => {
                    const errores = erroresLinea(linea);
                    return (
                      <tr key={linea.key} className={linea.seleccionada ? 'nota-venta__fila--seleccionada' : ''}>
                        <td className="nota-venta__seleccion">{selectorLinea(linea, 'tabla')}</td>
                        <td>
                          <label htmlFor={idSelectorLinea(linea, 'tabla')} className="nota-venta__descripcion">
                            <strong>{linea.detalleOriginal?.descripcion || 'Detalle sin descripción'}</strong>
                            <span>{linea.detalleOriginal?.codigo || 'Sin código'}</span>
                          </label>
                          {!linea.tributacion && <small className="nota-venta__linea-invalida">No se pudo clasificar tributariamente.</small>}
                          {errores.length > 0 && <small className="nota-venta__linea-invalida">{errores[0]}</small>}
                        </td>
                        <td>
                          <span
                            className="nota-venta__tributacion"
                            style={{ '--nota-tributacion-color': colorTributacion(linea.tributacion) }}
                          >
                            {etiquetaTributacionNota(linea.tributacion)}
                          </span>
                        </td>
                        <td className="text-right font-semibold">{formatoNumero(linea.cantidadOriginal)}</td>
                        <td className="text-right font-semibold">{formatoDinero(linea.precioOriginal)}</td>
                        <td>{editorCantidad(linea)}</td>
                        <td>{editorPrecio(linea)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="nota-venta__tarjetas">
              {lineas.map((linea) => {
                const errores = erroresLinea(linea);
                return (
                  <article key={linea.key} className={`nota-venta__tarjeta ${linea.seleccionada ? 'nota-venta__tarjeta--seleccionada' : ''}`}>
                    <div className="nota-venta__tarjeta-cabecera">
                      {selectorLinea(linea, 'tarjeta')}
                      <label htmlFor={idSelectorLinea(linea, 'tarjeta')}>
                        <strong>{linea.detalleOriginal?.descripcion || 'Detalle sin descripción'}</strong>
                        <span>{linea.detalleOriginal?.codigo || 'Sin código'}</span>
                      </label>
                      <span
                        className="nota-venta__tributacion"
                        style={{ '--nota-tributacion-color': colorTributacion(linea.tributacion) }}
                      >
                        {etiquetaTributacionNota(linea.tributacion)}
                      </span>
                    </div>
                    <div className="nota-venta__tarjeta-original">
                      <span>Original: {formatoNumero(linea.cantidadOriginal)} × {formatoDinero(linea.precioOriginal)} sin IVA</span>
                    </div>
                    <div className="nota-venta__tarjeta-campos">
                      <div>
                        <label>Nueva cantidad</label>
                        {editorCantidad(linea)}
                      </div>
                      <div>
                        <label>Nuevo precio sin IVA</label>
                        {editorPrecio(linea)}
                      </div>
                    </div>
                    {!linea.tributacion && <small className="nota-venta__linea-invalida">No se pudo clasificar tributariamente.</small>}
                    {errores.length > 0 && <small className="nota-venta__linea-invalida">{errores[0]}</small>}
                  </article>
                );
              })}
            </div>

            <section className="nota-venta__resumen">
              <div className="nota-venta__resumen-titulo">
                <div>
                  <span className="nota-venta__eyebrow">Resumen del ajuste</span>
                  <h4>{resumen.lineasSeleccionadas} {resumen.lineasSeleccionadas === 1 ? 'línea seleccionada' : 'líneas seleccionadas'}</h4>
                </div>
                {!validacion.esValida && (
                  <span className="nota-venta__pendiente">
                    <i className="pi pi-exclamation-circle"></i>
                    {validacion.mensajeGeneral || 'Revise los campos marcados'}
                  </span>
                )}
              </div>
              <div className="nota-venta__resumen-grid">
                <div className="nota-venta__desglose">
                  {resumen.porTipo.gravado > 0 && <div><span>Gravado</span><strong>{formatoDinero(resumen.porTipo.gravado)}</strong></div>}
                  {resumen.porTipo.exento > 0 && <div><span>Exento</span><strong>{formatoDinero(resumen.porTipo.exento)}</strong></div>}
                  {resumen.porTipo.noSujeto > 0 && <div><span>No sujeto</span><strong>{formatoDinero(resumen.porTipo.noSujeto)}</strong></div>}
                  {resumen.porTipo.noGravado > 0 && <div><span>No gravado</span><strong>{formatoDinero(resumen.porTipo.noGravado)}</strong></div>}
                  <div><span>IVA 13%</span><strong>{formatoDinero(resumen.ivaTotal)}</strong></div>
                  {resumen.retencion > 0 && (
                    <div className="nota-venta__retencion">
                      <span>Retención 1%</span>
                      <strong>-{formatoDinero(resumen.retencion)}</strong>
                    </div>
                  )}
                </div>
                <div className="nota-venta__total">
                  <span>Total de la nota</span>
                  <strong>{formatoDinero(resumen.totalPagar)}</strong>
                  {resumen.aplicaRetencion && <small>Retención aplicada sobre el total gravado.</small>}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </Dialog>
  );
}
