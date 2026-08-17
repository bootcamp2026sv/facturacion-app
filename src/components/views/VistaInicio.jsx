import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function VistaInicio({ alCambiarVista }) {
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({
    totalFacturado: 0,
    dtesEmitidos: 0,
    clientesCount: 0,
    productosCount: 0
  });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      setCargando(true);
      setErrorCarga('');
      try {
        const { data } = await api.get('/dashboard/resumen');
        setStats({
          totalFacturado: Number(data?.totalFacturado || 0),
          dtesEmitidos: Number(data?.dtesEmitidos || 0),
          clientesCount: Number(data?.clientesCount || 0),
          productosCount: Number(data?.productosCount || 0)
        });
        setUltimasVentas(Array.isArray(data?.ultimasVentas) ? data.ultimasVentas : []);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        setErrorCarga(error.response?.data?.message || 'No fue posible obtener el resumen del servidor.');
        setUltimasVentas([]);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosDashboard();
  }, []);

  const formatearDNI = (tipo) => {
    if (tipo === '01') return 'Factura';
    if (tipo === '03') return 'Crédito Fiscal';
    return tipo || 'Factura';
  };

  const estadisticas = [
    { 
      titulo: 'Facturación Total', 
      valor: `$${stats.totalFacturado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icono: 'pi pi-dollar', 
      color: '#10B981', 
      fondo: 'rgba(16, 185, 129, 0.12)',
      detalle: 'Ventas acumuladas'
    },
    { 
      titulo: 'Documentos DTE Emitidos', 
      valor: stats.dtesEmitidos, 
      icono: 'pi pi-file-pdf', 
      color: '#8B5CF6', 
      fondo: 'rgba(139, 92, 246, 0.12)',
      detalle: 'Facturas y Créditos Fiscales'
    },
    { 
      titulo: 'Clientes Registrados', 
      valor: stats.clientesCount, 
      icono: 'pi pi-users', 
      color: '#3B82F6', 
      fondo: 'rgba(59, 130, 246, 0.12)',
      detalle: 'Cuentas activas'
    },
    { 
      titulo: 'Productos en Catálogo', 
      valor: stats.productosCount, 
      icono: 'pi pi-box', 
      color: '#F59E0B', 
      fondo: 'rgba(245, 158, 11, 0.12)',
      detalle: 'Artículos y tarifas'
    }
  ];

  if (cargando) {
    return (
      <div className="p-4 premium-fade-in flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-primary text-5xl mb-3"></i>
          <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>Cargando resumen de facturación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 premium-fade-in">
      {errorCarga && (
        <div className="p-3 mb-4 border-round bg-red-50 text-red-700 flex align-items-center gap-2">
          <i className="pi pi-exclamation-triangle" />
          <span>{errorCarga}</span>
        </div>
      )}
      {/* Encabezado */}
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Resumen de Operación
        </h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Indicadores clave del negocio y estado del servicio de facturación electrónica.
        </p>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid mb-4">
        {estadisticas.map((estadistica, i) => (
          <div key={i} className="col-12 sm:col-6 lg:col-3">
            <div className="premium-surface-card p-3 h-full border-1 border-300 dark:border-slate-700" style={{ borderRadius: '16px', background: 'var(--card-bg)' }}>
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {estadistica.titulo}
                </span>
                <div className="flex align-items-center justify-content-center border-circle" style={{ width: '40px', height: '40px', background: estadistica.fondo }}>
                  <i className={estadistica.icono} style={{ fontSize: '1.2rem', color: estadistica.color }}></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold m-0 mb-1" style={{ color: 'var(--text-primary)' }}>
                {estadistica.valor}
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {estadistica.detalle}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Cuerpo principal */}
      <div className="grid">
        {/* Columna Izquierda: Últimas Ventas */}
        <div className="col-12 lg:col-7 mb-4">
          <div className="premium-surface-card p-4 h-full border-1 border-300 dark:border-slate-700" style={{ borderRadius: '16px', background: 'var(--card-bg)' }}>
            <div className="flex justify-content-between align-items-center mb-4">
              <h3 className="text-lg font-bold m-0" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-receipt text-primary mr-2"></i>Últimos DTEs Emitidos
              </h3>
            </div>
            
            <div className="premium-table">
              <DataTable 
                value={ultimasVentas} 
                size="small" 
                emptyMessage="No hay ventas registradas recientemente"
                responsiveLayout="scroll"
              >
                <Column 
                  header="Fecha" 
                  body={(f) => new Date(f.fecha).toLocaleDateString()} 
                  style={{ width: '100px' }}
                ></Column>
                <Column 
                  header="Tipo DTE" 
                  body={(f) => formatearDNI(f.tipoDte || f.tipo)}
                  style={{ width: '120px' }}
                ></Column>
                <Column 
                  header="Cliente" 
                  body={(f) => f.cliente?.nombre || f.cliente?.Nombre || f.cliente || 'Consumidor Final'}
                ></Column>
                <Column 
                  header="Total" 
                  body={(f) => `$${parseFloat(f.totalGeneral || f.total || 0).toFixed(2)}`} 
                  style={{ width: '100px', fontWeight: 'bold' }}
                  className="text-right"
                ></Column>
              </DataTable>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Accesos rápidos y Estado del sistema */}
        <div className="col-12 lg:col-5 mb-4">
          <div className="flex flex-column gap-4 h-full">
            {/* Accesos Rápidos */}
            <div className="premium-surface-card p-4 border-1 border-300 dark:border-slate-700" style={{ borderRadius: '16px', background: 'var(--card-bg)' }}>
              <h3 className="text-lg font-bold m-0 mb-3" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-directions text-primary mr-2"></i>Accesos Rápidos
              </h3>
              <div className="flex flex-column gap-2">
                <button type="button" onClick={() => alCambiarVista?.('pos')} className="flex align-items-center justify-content-between w-full p-2 border-round border-none bg-transparent text-left hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-shopping-cart text-primary"></i>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Nueva Venta (POS)</span>
                  </div>
                  <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
                </button>
                <button type="button" onClick={() => alCambiarVista?.('clientes')} className="flex align-items-center justify-content-between w-full p-2 border-round border-none bg-transparent text-left hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-users text-primary"></i>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Registrar Nuevo Cliente</span>
                  </div>
                  <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
                </button>
                <button type="button" onClick={() => alCambiarVista?.('productos')} className="flex align-items-center justify-content-between w-full p-2 border-round border-none bg-transparent text-left hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-box text-primary"></i>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Administrar Inventario</span>
                  </div>
                  <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
                </button>
              </div>
            </div>

            {/* Estado de Conexiones */}
            <div className="premium-surface-card p-4 border-1 border-300 dark:border-slate-700" style={{ borderRadius: '16px', background: 'var(--card-bg)' }}>
              <h3 className="text-lg font-bold m-0 mb-3" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-server text-primary mr-2"></i>Estado de Servicios DTE
              </h3>
              <div className="flex flex-column gap-3">
                <div className="flex align-items-center justify-content-between">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Servicio de Facturación</span>
                  <span className="p-badge p-badge-success" style={{ background: '#10B981', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>ACTIVO</span>
                </div>
                <div className="flex align-items-center justify-content-between">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Firma Electrónica (DTE)</span>
                  <span className="p-badge p-badge-success" style={{ background: '#10B981', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>CONECTADO</span>
                </div>
                <div className="flex align-items-center justify-content-between">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ministerio de Hacienda</span>
                  <span className="p-badge p-badge-info" style={{ background: '#6366F1', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>PRUEBAS (00)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
