import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { DialogoPuntoVenta } from '../../componentesPuntoVenta';
import { TIPO_DOC_OPCIONES } from '../constantesPuntoVenta';
import { soloDigitos } from '../../../../utils/validacionesCliente';

// Reúne el selector de clientes y el formulario de creación rápida.
// La vista principal decide qué hacer con el cliente seleccionado o creado.
export default function DialogosClientePuntoVenta({
  visibleSeleccion,
  visibleNuevo,
  cerrarSeleccion,
  cerrarNuevo,
  abrirNuevoCliente,
  cargandoClientes,
  errorClientes,
  busquedaCliente,
  setBusquedaCliente,
  clientesFiltrados,
  cliente,
  seleccionarCliente,
  clienteRapido,
  setClienteRapido,
  distritos,
  actividades,
  tipoDte,
  errorClienteRapido,
  guardandoCliente,
  guardarClienteRapido,
}) {
  const actualizarClienteRapido = (cambios) => setClienteRapido((actual) => ({ ...actual, ...cambios }));

  return (
    <>
      <DialogoPuntoVenta header="Seleccionar Cliente" visible={visibleSeleccion} style={{ width: '480px' }} onHide={cerrarSeleccion} draggable={false} resizable={false}>
        <div className="flex flex-column gap-3">
          <Button label="Registrar nuevo cliente" icon="pi pi-user-plus" className="premium-btn w-full" onClick={abrirNuevoCliente} />
          {(cargandoClientes || errorClientes) && (
            <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: errorClientes ? 'rgba(239,68,68,0.1)' : 'var(--surface-muted)', border: errorClientes ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--surface-border-light)', color: errorClientes ? '#ef4444' : 'var(--text-muted)' }}>
              <i className={`pi ${cargandoClientes ? 'pi-spin pi-spinner' : 'pi-exclamation-circle'} text-sm`}></i>
              <p className="text-xs font-semibold m-0">{cargandoClientes ? 'Actualizando clientes...' : errorClientes}</p>
            </div>
          )}
          <div className="premium-input-group">
            <i className="pi pi-search premium-input-icon" style={{ fontSize: '0.85rem' }}></i>
            <InputText value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Buscar por nombre o NIT..." className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} autoFocus />
          </div>
          <div className="flex flex-column gap-1" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {clientesFiltrados.length === 0 ? (
              <div className="flex flex-column align-items-center gap-2 py-5" style={{ opacity: 0.5 }}>
                <i className="pi pi-users text-4xl" style={{ color: 'var(--text-icon)' }}></i>
                <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-icon)' }}>No se encontraron clientes</p>
              </div>
            ) : (
              clientesFiltrados.map((clienteDisponible) => (
                <button
                  key={clienteDisponible.value}
                  onClick={() => seleccionarCliente(clienteDisponible)}
                  className="w-full border-none border-round-xl cursor-pointer p-3 flex align-items-center gap-3 transition-all transition-duration-200"
                  style={{ background: cliente === clienteDisponible.value ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                  onMouseEnter={(e) => { if (cliente !== clienteDisponible.value) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                  onMouseLeave={(e) => { if (cliente !== clienteDisponible.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex align-items-center justify-content-center border-circle" style={{ width: '40px', height: '40px', minWidth: '40px', background: cliente === clienteDisponible.value ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'var(--surface-hover)' }}>
                    <i className={`pi ${clienteDisponible.value === 0 ? 'pi-user' : 'pi-user-check'} text-sm`} style={{ color: cliente === clienteDisponible.value ? '#fff' : 'var(--text-muted)' }}></i>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex align-items-center gap-2">
                      <p className="font-semibold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>{clienteDisponible.label}</p>
                      {clienteDisponible.granContribuyente && <Tag value="Gran Contribuyente" severity="warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }} />}
                    </div>
                    <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>{clienteDisponible.nit}</p>
                  </div>
                  {cliente === clienteDisponible.value && <i className="pi pi-check text-sm" style={{ color: '#6366f1', flexShrink: 0 }}></i>}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogoPuntoVenta>

      <DialogoPuntoVenta
        header="Registrar cliente"
        visible={visibleNuevo}
        style={{ width: '680px' }}
        onHide={cerrarNuevo}
        draggable={false}
        resizable={false}
        footer={(
          <div className="flex gap-2 justify-content-end">
            <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={cerrarNuevo} disabled={guardandoCliente} />
            <Button label={guardandoCliente ? 'Guardando...' : 'Guardar y seleccionar'} icon={guardandoCliente ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="premium-btn" onClick={guardarClienteRapido} disabled={guardandoCliente} />
          </div>
        )}
      >
        <div className="flex flex-column gap-3 py-2">
          {errorClienteRapido && (
            <div className="flex align-items-center gap-2 p-2 border-round-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
              <i className="pi pi-exclamation-circle text-sm"></i>
              <p className="text-xs font-semibold m-0">{errorClienteRapido}</p>
            </div>
          )}

          <div className="grid">
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Nombre / razón social</label><InputText value={clienteRapido.nombre} onChange={(e) => actualizarClienteRapido({ nombre: e.target.value })} placeholder="Nombre del cliente" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} autoFocus /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Apellidos</label><InputText value={clienteRapido.apellidos} onChange={(e) => actualizarClienteRapido({ apellidos: e.target.value })} placeholder="Opcional" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Nombre comercial</label><InputText value={clienteRapido.nombreComercial} onChange={(e) => actualizarClienteRapido({ nombreComercial: e.target.value })} placeholder="Opcional" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Tipo documento</label><Dropdown value={clienteRapido.tipoDocumento} options={TIPO_DOC_OPCIONES} onChange={(e) => actualizarClienteRapido({ tipoDocumento: e.value })} className="w-full" /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Número documento <span style={{ color: '#ef4444' }}>*</span></label><InputText value={clienteRapido.numDocumento} onChange={(e) => actualizarClienteRapido({ numDocumento: soloDigitos(e.target.value).slice(0, 14) })} inputMode="numeric" maxLength={14} placeholder="9 o 14 dígitos, sin guiones" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">NRC</label><InputText value={clienteRapido.nrc} onChange={(e) => actualizarClienteRapido({ nrc: soloDigitos(e.target.value) })} inputMode="numeric" placeholder="Solo números, sin guiones" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Teléfono <span style={{ color: '#ef4444' }}>*</span></label><InputText value={clienteRapido.telefono} onChange={(e) => actualizarClienteRapido({ telefono: soloDigitos(e.target.value) })} inputMode="numeric" placeholder="Mínimo 8 dígitos, sin guiones" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Correo {tipoDte === '11' && <span style={{ color: '#ef4444' }}>*</span>}</label><InputText value={clienteRapido.correo} onChange={(e) => actualizarClienteRapido({ correo: e.target.value })} placeholder="correo@ejemplo.com" className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Distrito</label><Dropdown value={clienteRapido.distrito_id} options={distritos.map((distrito) => ({ label: distrito.nombre || distrito.Nombre || 'Distrito', value: distrito.id }))} onChange={(e) => actualizarClienteRapido({ distrito_id: e.value })} className="w-full" filter /></div>
            <div className="col-12 md:col-6 flex flex-column gap-1"><label className="premium-label">Actividad económica</label><Dropdown value={clienteRapido.actividadEconomica_id} options={actividades.map((actividad) => ({ label: `${actividad.codActividad || actividad.CodActividad || ''} - ${actividad.descActividad || actividad.DescActividad || ''}`, value: actividad.id }))} onChange={(e) => actualizarClienteRapido({ actividadEconomica_id: e.value })} placeholder="Seleccione una actividad económica" className="w-full" filter showClear /></div>
            <div className="col-12 flex flex-column gap-1"><label className="premium-label">Dirección {tipoDte === '11' && <span style={{ color: '#ef4444' }}>*</span>}</label><InputText value={clienteRapido.complementoDireccion} onChange={(e) => actualizarClienteRapido({ complementoDireccion: e.target.value })} placeholder="Calle, avenida, número de casa, colonia..." className="w-full" style={{ borderRadius: '10px', padding: '0.65rem 1rem' }} /></div>
            <div className="col-12 flex align-items-center justify-content-between p-3 border-round-xl" style={{ background: 'var(--surface-muted)' }}><div><p className="font-bold m-0 text-sm" style={{ color: 'var(--text-primary)' }}>Gran contribuyente</p><p className="m-0 text-xs" style={{ color: 'var(--text-muted)' }}>Activa la retención del 1% cuando aplique.</p></div><InputSwitch checked={clienteRapido.granContribuyente} onChange={(e) => actualizarClienteRapido({ granContribuyente: e.value })} /></div>
          </div>
        </div>
      </DialogoPuntoVenta>
    </>
  );
}
