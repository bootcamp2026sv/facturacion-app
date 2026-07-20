import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import FormularioExportacionDte11 from './FormularioExportacionDte11';
import './DialogoExportacionDte11.css';

// Paso especial del DTE-11. Recibe los datos desde VistaPuntoVenta y avisa
// cuando ya se puede continuar al diálogo de cobro.
export default function DialogoExportacionDte11({
  visible,
  onHide,
  cliente,
  value,
  onChange,
  faltantes,
  onContinuar,
  guardando = false,
}) {
  const continuarDeshabilitado = guardando || faltantes.length > 0;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      className="punto-venta__dialogo punto-venta__dialogo-exportacion"
      style={{ width: 'min(900px, 96vw)' }}
      contentStyle={{ padding: 0 }}
      closable={!guardando}
      header={(
        <div className="exportacion-dialogo__cabecera">
          <div className="exportacion-dialogo__marca">
            <span className="exportacion-dialogo__icono"><i className="pi pi-globe" /></span>
            <div>
              <span className="exportacion-dialogo__eyebrow">Preparación del documento</span>
              <h2>Factura de exportación</h2>
              <p>DTE-11 · Revisa los datos antes de confirmar el cobro</p>
            </div>
          </div>
          <div className="exportacion-dialogo__pasos" aria-label="Pasos de preparación">
            <span className="exportacion-dialogo__paso exportacion-dialogo__paso--activo"><b>1</b> Receptor</span>
            <span className="exportacion-dialogo__conector" />
            <span className="exportacion-dialogo__paso exportacion-dialogo__paso--activo"><b>2</b> Aduana</span>
            <span className="exportacion-dialogo__conector" />
            <span className="exportacion-dialogo__paso"><b>3</b> Cobro</span>
          </div>
        </div>
      )}
      footer={(
        <div className="exportacion-dialogo__pie">
          <div className="exportacion-dialogo__estado">
            {faltantes.length > 0 ? (
              <><i className="pi pi-info-circle" /><span>Faltan {faltantes.length} datos obligatorios</span></>
            ) : (
              <><i className="pi pi-check-circle" /><span>Datos listos para generar el DTE-11</span></>
            )}
          </div>
          <div className="flex gap-2">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={onHide} disabled={guardando} />
            <Button label="Continuar al cobro" icon="pi pi-arrow-right" iconPos="right" className="premium-btn" onClick={onContinuar} disabled={continuarDeshabilitado} loading={guardando} />
          </div>
        </div>
      )}
    >
      <div className="exportacion-dialogo__contenido">
        <div className="exportacion-dialogo__resumen">
          <div>
            <span className="exportacion-dialogo__kicker">RECEPTOR SELECCIONADO</span>
            <strong>{[cliente?.nombre, cliente?.apellidos].filter(Boolean).join(' ') || cliente?.nombreComercial || 'Cliente sin nombre'}</strong>
          </div>
          <div className="exportacion-dialogo__resumen-dato"><i className="pi pi-envelope" />{cliente?.correo || 'Sin correo'}</div>
          <div className="exportacion-dialogo__resumen-dato"><i className="pi pi-phone" />{cliente?.telefono || 'Sin teléfono'}</div>
        </div>

        <FormularioExportacionDte11
          cliente={cliente}
          value={value}
          onChange={onChange}
          disabled={guardando}
        />

        {faltantes.length > 0 && (
          <div className="exportacion-dialogo__faltantes">
            <i className="pi pi-exclamation-triangle" />
            <div><strong>Revisa estos campos antes de continuar</strong><span>{faltantes.join(' · ')}</span></div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
