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

      {/* Sección Informativa del Prototipo */}
      <div className="mt-5 premium-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="premium-card-static p-4">
          <h3 className="text-xl font-bold m-0 mb-3" style={{ color: 'var(--text-primary)' }}>Especificaciones del Prototipo</h3>
          <p className="line-height-3 mb-3" style={{ color: 'var(--text-muted)' }}>
            Maquetación e interfaz construida sobre React 19 y PrimeReact. La navegación lateral colapsable gestiona vistas en memoria para la simulación de registros sin almacenamiento persistente.
          </p>
          <div className="p-3 border-round-xl flex align-items-start gap-2 text-sm" style={{ background: 'var(--stats-card-1-bg)', color: 'var(--text-primary)', borderLeft: '3px solid #6366f1' }}>
            <div>
              <h4 className="font-bold m-0 mb-1">Instrucciones de Integración (Desarrollo)</h4>
              <p className="m-0">
                Para añadir secciones: incorpore el componente correspondiente en el arreglo <code>ELEMENTOS_MENU</code> dentro de <code>PanelPrincipal.jsx</code>. El menú lateral y el enrutador principal se actualizarán de forma automática.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}