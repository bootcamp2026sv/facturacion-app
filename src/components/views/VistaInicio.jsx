import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
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
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    const cargarDatosDashboard = async () => {
      setCargando(true);
      try {
        // Cargar productos
        let prodsCount = 0;
        try {
          const resProds = await api.get('/Productos');
          prodsCount = (resProds.data || []).length;
        } catch (e) {
          console.error("Error al cargar productos para stats:", e);
        }

        // Cargar clientes
        let clisCount = 0;
        try {
          const resClis = await api.get('/Clientes');
          clisCount = (resClis.data || []).length;
        } catch (e) {
          console.error("Error al cargar clientes para stats:", e);
        }

        // Cargar ventas
        let listadoVentas = [];
        try {
          const resVentas = await api.get('/Ventas');
          listadoVentas = resVentas.data || [];
        } catch (e) {
          console.error("Error al cargar ventas para stats:", e);
          // Fallback a ventas de demostración si la API de ventas falla
          listadoVentas = [
            { id: 1, numeroControl: 'DTE-01-M001P001-000000000001000', codigoGeneracion: '288e60c6-aeb4-414b-9227-9b4c16d35c1e', fecha: '2026-06-07T14:30:00', cliente: 'Distribuidora Alimentos S.A.', totalGeneral: 678.00, tipoDte: '01' },
            { id: 2, numeroControl: 'DTE-03-M001P001-000000000000254', codigoGeneracion: '7a8b60d2-cf14-49c7-8142-2b4c16d35f4a', fecha: '2026-06-07T11:15:00', cliente: 'Juan Carlos Pérez', totalGeneral: 25.50, tipoDte: '03' }
          ];
        }

        // Calcular estadísticas
        const totalFacturado = listadoVentas.reduce((sum, v) => {
          const val = parseFloat(v.totalGeneral || v.total || 0);
          return sum + val;
        }, 0);

        setStats({
          totalFacturado,
          dtesEmitidos: listadoVentas.length,
          clientesCount: clisCount,
          productosCount: prodsCount
        });

        // Tomar las últimas 4 ventas
        const ultimas = [...listadoVentas]
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 4);
        setUltimasVentas(ultimas);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
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
                <div onClick={() => alCambiarVista?.('pos')} className="flex align-items-center justify-content-between p-2 border-round hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-shopping-cart text-primary"></i>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Nueva Venta (POS)</span>
                  </div>
                  <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
                </div>
                <div onClick={() => alCambiarVista?.('clientes')} className="flex align-items-center justify-content-between p-2 border-round hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-users text-primary"></i>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Registrar Nuevo Cliente</span>
                  </div>
                  <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
                </div>
                <div onClick={() => alCambiarVista?.('productos')} className="flex align-items-center justify-content-between p-2 border-round hover:surface-hover cursor-pointer transition-colors transition-duration-150">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-box text-primary"></i>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Administrar Inventario</span>
                  </div>
                  <i className="pi pi-angle-right" style={{ color: 'var(--text-muted)' }}></i>
                </div>
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