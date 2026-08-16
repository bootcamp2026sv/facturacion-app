import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { formatoDinero, formatoFechaTicket } from '../reglasPuntoVenta';
import { resolverUrlMedia } from '../../../../utils/media.js';
import { construirUrlConsultaHacienda } from '../../../../utils/consultaHacienda.js';

function QrConsultaHacienda({ ticket }) {
  const [qrGenerado, setQrGenerado] = useState({ url: null, dataUrl: null });
  const urlConsulta = useMemo(() => construirUrlConsultaHacienda({
    ambiente: ticket.ambiente,
    codigoGeneracion: ticket.codigoGeneracion,
    fecha: ticket.fecha,
  }), [ticket.ambiente, ticket.codigoGeneracion, ticket.fecha]);

  useEffect(() => {
    let vigente = true;

    if (urlConsulta) {
      QRCode.toDataURL(urlConsulta, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      }).then((dataUrl) => {
        if (vigente) setQrGenerado({ url: urlConsulta, dataUrl });
      }).catch(() => {});
    }

    return () => { vigente = false; };
  }, [urlConsulta]);

  if (!urlConsulta) return null;
  const imagenQr = qrGenerado.url === urlConsulta ? qrGenerado.dataUrl : null;

  return (
    <div className="ticket-qr-contenedor">
      {imagenQr ? (
        <a href={urlConsulta} target="_blank" rel="noreferrer" className="ticket-qr-enlace" title="Verificar DTE en Hacienda">
          <img src={imagenQr} alt="QR para verificar el DTE en Hacienda" className="ticket-qr" />
        </a>
      ) : (
        <div className="ticket-qr-cargando">Generando QR...</div>
      )}
      <div className="ticket-qr-etiqueta">Escanee para verificar en Hacienda</div>
    </div>
  );
}

// Solo dibuja el contenido del ticket. La impresión la inicia el diálogo.
export default function TicketVenta({ ticket, ticketAncho }) {
  if (!ticket) return null;

  const nombreComercio = ticket.comercio?.nombreComercial || ticket.comercio?.nombre || 'Comercio';
  const direccion = ticket.comercio?.complementoDireccion || ticket.comercio?.direccion || '';
  const logoUrl = resolverUrlMedia(
    ticket.comercio?.logoUrl
      || (ticket.comercio?.id ? `/api/v1/media/comercios/${ticket.comercio.id}/logo` : null),
  );
  const muestraIvaSeparado = ticket.tipoDte === '03';
  const subtotalTicket = muestraIvaSeparado
    ? Object.values(ticket.resumen.porTipo || {}).reduce((acumulado, valor) => acumulado + Number(valor || 0), 0)
    : ticket.resumen.total;
  const muestraClienteCompleto = ['03', '11', '14'].includes(ticket.tipoDte);
  const direccionCliente = ticket.cliente?.direccion || {};
  const direccionClienteTexto = [
    direccionCliente.departamento,
    direccionCliente.municipio,
    direccionCliente.distrito,
    direccionCliente.complemento,
  ].filter(Boolean).join(', ');

  return (
    <div className={`thermal-ticket ticket-${ticketAncho}`}>
      <div className="ticket-center ticket-header">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`Logo de ${nombreComercio}`}
            className="ticket-logo"
            onError={(evento) => { evento.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="ticket-title">{nombreComercio}</div>
        {ticket.comercio?.nombre && ticket.comercio.nombre !== nombreComercio && <div>{ticket.comercio.nombre}</div>}
        {ticket.comercio?.nit && <div>NIT: {ticket.comercio.nit}</div>}
        {ticket.comercio?.nrc && <div>NRC: {ticket.comercio.nrc}</div>}
        {direccion && <div>{direccion}</div>}
        {ticket.comercio?.telefono && <div>Tel: {ticket.comercio.telefono}</div>}
      </div>

      <div className="ticket-line" />

      <div className="ticket-row"><span>Fecha</span><span>{formatoFechaTicket(ticket.fecha)}</span></div>
      <div className="ticket-row"><span>Documento</span><span>{ticket.tipoDteLabel}</span></div>
      {ticket.numeroControl && <div className="ticket-small-break">No. {ticket.numeroControl}</div>}
      {ticket.codigoGeneracion && <div className="ticket-small-break">Cod. {ticket.codigoGeneracion}</div>}
      <div className="ticket-small-break">Sello MH: {ticket.selloRecepcion || 'Emisión en contingencia'}</div>
      <div className="ticket-row"><span>Cliente</span><span>{ticket.cliente?.label || 'Cliente Final'}</span></div>
      {muestraClienteCompleto ? (
        <>
          {ticket.cliente?.numDocumento && <div className="ticket-row"><span>Doc.</span><span>{ticket.cliente.numDocumento}</span></div>}
          {ticket.cliente?.nrc && <div className="ticket-row"><span>NRC</span><span>{ticket.cliente.nrc}</span></div>}
          {ticket.cliente?.nombreComercial && <div className="ticket-row"><span>Comercial</span><span>{ticket.cliente.nombreComercial}</span></div>}
          {ticket.cliente?.actividadEconomica?.codActividad && <div className="ticket-row"><span>Actividad</span><span>{ticket.cliente.actividadEconomica.codActividad}</span></div>}
          {ticket.cliente?.actividadEconomica?.descActividad && <div className="ticket-small-break">Giro: {ticket.cliente.actividadEconomica.descActividad}</div>}
          {direccionClienteTexto && <div className="ticket-small-break">Dir: {direccionClienteTexto}</div>}
          {ticket.cliente?.telefono && <div className="ticket-row"><span>Tel.</span><span>{ticket.cliente.telefono}</span></div>}
          {ticket.cliente?.correo && <div className="ticket-small-break">Correo: {ticket.cliente.correo}</div>}
        </>
      ) : (
        ticket.cliente?.nit && <div className="ticket-row"><span>Doc.</span><span>{ticket.cliente.nit}</span></div>
      )}

      <div className="ticket-line" />

      <div className="ticket-items">
        {ticket.items.map((item) => (
          <div key={item.key} className="ticket-item">
            <div className="ticket-item-name">{item.nombre}</div>
            <div className="ticket-row">
              <span>{item.cantidad} x {formatoDinero(muestraIvaSeparado ? item.precio : item.total / item.cantidad)}</span>
              <span>{formatoDinero(muestraIvaSeparado ? item.total - item.iva : item.total)}</span>
            </div>
            {item.descuento > 0 && (
              <div className="ticket-row ticket-muted">
                <span>Descuento</span>
                <span>-{formatoDinero(item.descuento)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ticket-line" />

      <div className="ticket-row"><span>Subtotal</span><span>{formatoDinero(subtotalTicket)}</span></div>
      {ticket.tipoDte === '11' && ticket.resumen.flete > 0 && <div className="ticket-row"><span>Flete</span><span>{formatoDinero(ticket.resumen.flete)}</span></div>}
      {ticket.tipoDte === '11' && ticket.resumen.seguro > 0 && <div className="ticket-row"><span>Seguro</span><span>{formatoDinero(ticket.resumen.seguro)}</span></div>}
      {muestraIvaSeparado && ticket.resumen.descuentoTotal > 0 && <div className="ticket-row"><span>Descuentos</span><span>-{formatoDinero(ticket.resumen.descuentoTotal)}</span></div>}
      {muestraIvaSeparado && ticket.resumen.ivaTotal > 0 && <div className="ticket-row"><span>IVA 13%</span><span>{formatoDinero(ticket.resumen.ivaTotal)}</span></div>}
      {ticket.resumen.retencion > 0 && <div className="ticket-row"><span>Retención 1%</span><span>-{formatoDinero(ticket.resumen.retencion)}</span></div>}
      {ticket.resumen.reteRenta > 0 && <div className="ticket-row"><span>Retención renta 10%</span><span>-{formatoDinero(ticket.resumen.reteRenta)}</span></div>}
      <div className="ticket-row ticket-total"><span>Total</span><span>{formatoDinero(ticket.resumen.totalCobrar)}</span></div>

      <div className="ticket-line" />

      <div className="ticket-row"><span>Pago</span><span>{ticket.metodoPagoLabel}</span></div>
      {ticket.referenciaPago && <div className="ticket-row"><span>Ref.</span><span>{ticket.referenciaPago}</span></div>}
      {ticket.plazo && <div className="ticket-row"><span>Plazo</span><span>{ticket.plazo}</span></div>}
      {ticket.efectivoRecibido !== null && <div className="ticket-row"><span>Recibido</span><span>{formatoDinero(ticket.efectivoRecibido)}</span></div>}
      {ticket.cambio !== null && <div className="ticket-row"><span>Cambio</span><span>{formatoDinero(ticket.cambio)}</span></div>}

      <div className="ticket-line" />

      <QrConsultaHacienda ticket={ticket} />

      <div className="ticket-line" />

      <div className="ticket-center ticket-footer">
        <div>Gracias por su compra</div>
      </div>
    </div>
  );
}
