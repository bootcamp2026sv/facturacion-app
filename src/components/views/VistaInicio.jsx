import { Card } from 'primereact/card';

export default function VistaInicio() {
  const estadisticas = [
    { titulo: 'Productos Registrados', valor: '24', icono: 'pi pi-box', color: '#6366F1', fondo: 'var(--stats-card-1-bg)' },
    { titulo: 'Clientes Activos', valor: '18', icono: 'pi pi-users', color: '#10B981', fondo: 'var(--stats-card-2-bg)' },
    { titulo: 'Actividades Económicas', valor: '6', icono: 'pi pi-briefcase', color: '#F59E0B', fondo: 'var(--stats-card-3-bg)' },
    { titulo: 'Unidades de Medida', valor: '8', icono: 'pi pi-percentage', color: '#EF4444', fondo: 'var(--stats-card-4-bg)' }
  ];

  return (
    <div className="p-4">
      <div className="mb-5 premium-fade-in">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Panel de Control</h2>
        <p className="mt-2" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Bienvenido al prototipo de facturación rápida.</p>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid">
        {estadisticas.map((estadistica, i) => (
          <div key={i} className={`col-12 sm:col-6 lg:col-3 premium-fade-in-delay-${i}`}>
            <div className="premium-stats-card" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', borderRadius: '16px', boxShadow: 'var(--card-shadow)' }}>
              <div className="p-3">
                <div className="flex justify-content-between align-items-center">
                  <div className="text-left">
                    <span className="block font-semibold mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>{estadistica.titulo}</span>
                    <h3 className="text-3xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>{estadistica.valor}</h3>
                  </div>
                  <div className="premium-icon-circle" style={{ background: estadistica.fondo }}>
                    <i className={`${estadistica.icono}`} style={{ fontSize: '20px', color: estadistica.color }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos Rápidos y Estado del Sistema */}
      <div className="grid mt-4">
        <div className="col-12 md:col-6 premium-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="premium-card-static p-4 h-full" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
            <h3 className="text-xl font-bold m-0 mb-3" style={{ color: 'var(--text-primary)' }}>Accesos Rápidos</h3>
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center justify-content-between p-2 border-round hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-shopping-cart" style={{ color: '#6366F1' }}></i>
                  <span style={{ color: 'var(--text-primary)' }}>Nueva Venta (POS)</span>
                </div>
                <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
              </div>
              <div className="flex align-items-center justify-content-between p-2 border-round hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-users" style={{ color: '#10B981' }}></i>
                  <span style={{ color: 'var(--text-primary)' }}>Registrar Cliente</span>
                </div>
                <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
              </div>
              <div className="flex align-items-center justify-content-between p-2 border-round hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-box" style={{ color: '#F59E0B' }}></i>
                  <span style={{ color: 'var(--text-primary)' }}>Gestión de Inventario</span>
                </div>
                <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 md:col-6 premium-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="premium-card-static p-4 h-full" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
            <h3 className="text-xl font-bold m-0 mb-3" style={{ color: 'var(--text-primary)' }}>Estado de Conexiones</h3>
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center justify-content-between">
                <span style={{ color: 'var(--text-secondary)' }}>Servicio de Facturación</span>
                <span className="p-badge p-badge-success" style={{ background: '#10B981', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>ACTIVO</span>
              </div>
              <div className="flex align-items-center justify-content-between">
                <span style={{ color: 'var(--text-secondary)' }}>Firma Electrónica (DTE)</span>
                <span className="p-badge p-badge-success" style={{ background: '#10B981', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>CONECTADO</span>
              </div>
              <div className="flex align-items-center justify-content-between">
                <span style={{ color: 'var(--text-secondary)' }}>Ministerio de Hacienda</span>
                <span className="p-badge p-badge-info" style={{ background: '#6366F1', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>PRUEBAS (00)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}