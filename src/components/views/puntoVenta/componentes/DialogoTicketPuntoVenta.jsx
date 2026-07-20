import { Button } from 'primereact/button';
import { DialogoPuntoVenta } from '../../componentesPuntoVenta';
import { ANCHOS_TICKET } from '../constantesPuntoVenta';
import TicketVenta from './TicketVenta';

// Contenedor del ticket: permite elegir ancho, cerrar e imprimir.
export default function DialogoTicketPuntoVenta({
  visible,
  ticket,
  ticketAncho,
  setTicketAncho,
  onCerrar,
  onImprimir,
}) {
  return (
    <DialogoPuntoVenta
      header="Ticket de venta"
      visible={visible}
      style={{ width: '520px' }}
      className="punto-venta__dialogo--ticket"
      onHide={onCerrar}
      draggable={false}
      resizable={false}
      footer={(
        <div className="flex gap-2 justify-content-end">
          <Button label="Cerrar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={onCerrar} />
          <Button label="Imprimir" icon="pi pi-print" className="premium-btn" onClick={onImprimir} disabled={!ticket} />
        </div>
      )}
    >
      <div className="flex flex-column gap-3 py-2">
        <div className="flex align-items-center justify-content-between gap-2 flex-wrap p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}>
          <div className="flex align-items-center gap-2">
            <i className="pi pi-print" style={{ color: '#6366f1' }}></i>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Formato termico</span>
          </div>
          <div className="flex gap-1">
            {ANCHOS_TICKET.map((ancho) => (
              <button
                key={ancho.value}
                type="button"
                onClick={() => setTicketAncho(ancho.value)}
                className="border-none border-round-lg cursor-pointer px-3 py-2 text-xs font-bold transition-all transition-duration-200"
                style={{
                  background: ticketAncho === ancho.value ? '#6366f1' : 'var(--card-bg)',
                  color: ticketAncho === ancho.value ? '#fff' : 'var(--text-secondary)',
                  border: ticketAncho === ancho.value ? '1px solid #6366f1' : '1px solid var(--surface-border-light)',
                }}
              >
                {ancho.label}
              </button>
            ))}
          </div>
        </div>

        <div className="punto-venta__vista-previa-ticket border-round-xl p-3">
          <TicketVenta ticket={ticket} ticketAncho={ticketAncho} />
        </div>
      </div>
    </DialogoPuntoVenta>
  );
}
