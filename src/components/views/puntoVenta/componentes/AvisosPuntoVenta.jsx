import { AvisoError, AvisoPagoExitoso } from '../../componentesPuntoVenta';

// Muestra mensajes breves de pago, correo y carga de catálogos.
export default function AvisosPuntoVenta({ pagoExitoso, avisoCorreo, errorCatalogos }) {
  return (
    <>
      {pagoExitoso && (
        <AvisoPagoExitoso>
          <i className="pi pi-check-circle text-xl" style={{ color: '#10b981' }}></i>
          <div>
            <p className="font-bold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>Pago exitoso</p>
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>La venta se ha registrado correctamente</p>
          </div>
        </AvisoPagoExitoso>
      )}
      {avisoCorreo && (avisoCorreo.tipo === 'exito' ? (
        <AvisoPagoExitoso>
          <i className="pi pi-envelope text-xl" style={{ color: '#10b981' }}></i>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{avisoCorreo.mensaje}</span>
        </AvisoPagoExitoso>
      ) : (
        <AvisoError>
          <i className="pi pi-envelope text-xl"></i>
          <span className="text-sm font-semibold">{avisoCorreo.mensaje}</span>
        </AvisoError>
      ))}
      {errorCatalogos && (
        <AvisoError>
          <i className="pi pi-exclamation-triangle"></i>
          <span className="text-sm font-semibold">{errorCatalogos}</span>
        </AvisoError>
      )}
    </>
  );
}
