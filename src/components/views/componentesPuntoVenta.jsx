import { Dialog } from 'primereact/dialog';

// Contenedores pequeños que mantienen las clases y el estilo común del POS.
export function ContenedorPuntoVenta({ children, style }) {
  return <div className="punto-venta premium-fade-in" style={style}>{children}</div>;
}

export function AvisoPagoExitoso({ children }) {
  return <div className="punto-venta__aviso punto-venta__aviso--exito premium-fade-in-fast">{children}</div>;
}

export function AvisoError({ children }) {
  return <div className="punto-venta__aviso punto-venta__aviso--error">{children}</div>;
}

export function PanelCatalogo({ children }) {
  return <section className="punto-venta__catalogo">{children}</section>;
}

export function PanelCarrito({ children }) {
  return <aside className="punto-venta__carrito premium-surface-card">{children}</aside>;
}

export function DialogoPuntoVenta({ children, className = '', ...props }) {
  return <Dialog {...props} className={`punto-venta__dialogo ${className}`}>{children}</Dialog>;
}

export function ImpresionTicket({ children }) {
  return <div className="punto-venta__impresion-ticket">{children}</div>;
}
