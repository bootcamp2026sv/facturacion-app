import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';

import api from '../../services/api';

// Catálogos de prueba locales
const MUNICIPIOS_SIMULADOS = [
  { id: 1, Nombre: 'San Salvador Centro', Codigo: '0614' },
  { id: 2, Nombre: 'La Libertad Este', Codigo: '0501' },
  { id: 3, Nombre: 'Santa Ana Centro', Codigo: '0201' },
  { id: 4, Nombre: 'San Miguel Centro', Codigo: '1201' },
  { id: 5, Nombre: 'La Libertad Sur', Codigo: '0502' }
];

const ACTIVIDADES_SIMULADAS = [
  { id: 1, CodActividad: '62010', DescActividad: 'Actividades de programación informática (Desarrollo de software)' },
  { id: 2, CodActividad: '62020', DescActividad: 'Consultoría de informática y de gestión de instalaciones informáticas' },
  { id: 3, CodActividad: '47730', DescActividad: 'Venta al por menor de productos farmacéuticos y médicos en establecimientos especializados' },
  { id: 4, CodActividad: '56101', DescActividad: 'Restaurantes y servicios móviles de comidas' }
];

export default function VistaComercios() {
  const toast = useRef(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Estados para catálogos
  const [distritosLista, setDistritosLista] = useState([]);
  const [actividadesLista, setActividadesLista] = useState(ACTIVIDADES_SIMULADAS);

  // Estado del formulario
  const [datosComercio, setDatosComercio] = useState({
    id: null,
    nombre: 'TECHSERVICES EL SALVADOR',
    nombreComercial: 'TECHSERVICES EL SALVADOR',
    nit: '0614-150822-101-9',
    nrc: '261453-8',
    telefono: '2525-4000',
    correo: 'facturacion@techservices.com.sv',
    granContribuyente: false,
    complementoDireccion: 'Avenida Las Magnolias, Edificio Insigne, Nivel 8, Colonia San Benito',
    tipoEstablecimiento: 2,
    codEstableMH: 'M001',
    codPuntoVentaMH: 'P001',
    distrito_id: 1,
    actividadEconomica_id: 1
  });

  const cargadoRef = useRef(false);

  // Conectar con la API para cargar catálogos y el comercio único
  useEffect(() => {
    if (cargadoRef.current) return;
    cargadoRef.current = true;
    const cargarDatosAPI = async () => {
      setCargando(true);
      try {
        const resDist = await api.get('/distritos');
        setDistritosLista(resDist.data || []);

        const resAct = await api.get('/ActividadEconomicas');
        setActividadesLista(resAct.data || []);

        const respuesta = await api.get('/Comercios');
        const listaComercios = respuesta.data || [];
        
        // Tomamos el primer comercio registrado
        const comercio = listaComercios.length > 0 ? listaComercios[0] : null;

        if (comercio) {
          setDatosComercio({
            id: comercio.id,
            nombre: comercio.nombre || comercio.Nombre || '',
            nombreComercial: comercio.nombreComercial || comercio.NombreComercial || '',
            nit: comercio.nit || comercio.Nit || '',
            nrc: comercio.nrc || comercio.Nrc || '',
            telefono: comercio.telefono || comercio.Telefono || '',
            correo: comercio.correo || comercio.Correo || '',
            granContribuyente: comercio.granContribuyente !== undefined ? (comercio.granContribuyente || comercio.GranContribuyente) : false,
            complementoDireccion: comercio.complementoDireccion || comercio.ComplementoDireccion || '',
            tipoEstablecimiento: comercio.tipoEstablecimiento || comercio.TipoEstablecimiento || 2,
            codEstableMH: comercio.codEstableMH || comercio.CodEstableMH || '',
            codPuntoVentaMH: comercio.codPuntoVentaMH || comercio.CodPuntoVentaMH || '',
            distrito_id: comercio.distrito_id || comercio.Distrito_id || comercio.distrito?.id || comercio.Distrito?.id || 1,
            actividadEconomica_id: comercio.actividadEconomica_id || comercio.ActividadEconomica_id || comercio.actividadEconomica?.id || comercio.ActividadEconomica?.id || 1
          });
        }
      } catch (error) {
        console.error("Error al cargar datos de la API:", error);
        toast.current.show({ 
          severity: 'error', 
          summary: 'Error de Sincronización', 
          detail: 'No se pudieron descargar los catálogos o los establecimientos del servidor.', 
          life: 4000 
        });
      } finally {
        setCargando(false);
        setCargandoInicial(false);
      }
    };
    cargarDatosAPI();
  }, []);

  // Guardar cambios a la API
  const guardarComercio = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      let respuesta;
      if (datosComercio.id) {
        respuesta = await api.put(`/Comercios/${datosComercio.id}`, datosComercio);
      } else {
        respuesta = await api.post('/Comercios', datosComercio);
      }

      const comercioGuardado = respuesta.data;
      setDatosComercio({
        id: comercioGuardado.id,
        nombre: comercioGuardado.nombre || comercioGuardado.Nombre || '',
        nombreComercial: comercioGuardado.nombreComercial || comercioGuardado.NombreComercial || '',
        nit: comercioGuardado.nit || comercioGuardado.Nit || '',
        nrc: comercioGuardado.nrc || comercioGuardado.Nrc || '',
        telefono: comercioGuardado.telefono || comercioGuardado.Telefono || '',
        correo: comercioGuardado.correo || comercioGuardado.Correo || '',
        granContribuyente: comercioGuardado.granContribuyente !== undefined ? (comercioGuardado.granContribuyente || comercioGuardado.GranContribuyente) : false,
        complementoDireccion: comercioGuardado.complementoDireccion || comercioGuardado.ComplementoDireccion || '',
        tipoEstablecimiento: comercioGuardado.tipoEstablecimiento || comercioGuardado.TipoEstablecimiento || 2,
        codEstableMH: comercioGuardado.codEstableMH || comercioGuardado.CodEstableMH || '',
        codPuntoVentaMH: comercioGuardado.codPuntoVentaMH || comercioGuardado.CodPuntoVentaMH || '',
        distrito_id: comercioGuardado.distrito_id || comercioGuardado.Distrito_id || comercioGuardado.distrito?.id || comercioGuardado.Distrito?.id || 1,
        actividadEconomica_id: comercioGuardado.actividadEconomica_id || comercioGuardado.ActividadEconomica_id || comercioGuardado.actividadEconomica?.id || comercioGuardado.ActividadEconomica?.id || 1
      });

      toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Datos de comercio actualizados correctamente.', life: 3000 });

    } catch (error) {
      console.error("Error al guardar comercio:", error.response?.data || error);
      const apiMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar la configuración de comercio.';
      toast.current.show({ severity: 'error', summary: 'Error', detail: apiMsg, life: 6000 });
    } finally {
      setCargando(false);
    }
  };

  if (cargandoInicial) {
    return (
      <div className="p-4 premium-fade-in flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="premium-surface-card text-center p-6 flex flex-column align-items-center justify-content-center border-round-xl border-1 border-300 dark:border-slate-700" style={{ maxWidth: '400px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
          <i className="pi pi-spin pi-spinner text-primary text-5xl mb-4"></i>
          <h3 className="text-xl font-bold m-0 mb-2" style={{ color: 'var(--text-primary)' }}>Cargando Configuración</h3>
          <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>Obteniendo datos del comercio emisor desde el servidor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 premium-fade-in">
      <Toast ref={toast} />

      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Configuración de Comercio Emisor
        </h2>
      </div>

      <div className="premium-surface-card">
        <div className="p-fluid pt-3" style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          <form onSubmit={guardarComercio} className="flex flex-column gap-4">
            
            {/* 1. Información Legal */}
            <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
              <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-building text-primary"></i> 1. Información Legal y Fiscal
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="nombre" className="font-bold text-xs text-800">Razón Social <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-building premium-input-icon"></i>
                    <InputText 
                      id="nombre" 
                      value={datosComercio.nombre} 
                      onChange={(e) => setDatosComercio({...datosComercio, nombre: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="nombreComercial" className="font-bold text-xs text-800">Nombre Comercial</label>
                  <div className="premium-input-group">
                    <i className="pi pi-tag premium-input-icon"></i>
                    <InputText 
                      id="nombreComercial" 
                      value={datosComercio.nombreComercial} 
                      onChange={(e) => setDatosComercio({...datosComercio, nombreComercial: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="nit" className="font-bold text-xs text-800">NIT <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-id-card premium-input-icon"></i>
                    <InputText 
                      id="nit" 
                      value={datosComercio.nit} 
                      onChange={(e) => setDatosComercio({...datosComercio, nit: e.target.value})} 
                      placeholder="0614-150822-101-9" 
                      required 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="nrc" className="font-bold text-xs text-800">NRC <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-file premium-input-icon"></i>
                    <InputText 
                      id="nrc" 
                      value={datosComercio.nrc} 
                      onChange={(e) => setDatosComercio({...datosComercio, nrc: e.target.value})} 
                      placeholder="261453-8" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Hacienda */}
            <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
              <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-key text-primary"></i> 2. Parámetros de Hacienda (MH)
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="codEstableMH" className="font-bold text-xs text-800">Cod. Establecimiento <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-map-marker premium-input-icon"></i>
                    <InputText 
                      id="codEstableMH" 
                      value={datosComercio.codEstableMH} 
                      onChange={(e) => setDatosComercio({...datosComercio, codEstableMH: e.target.value})} 
                      placeholder="M001" 
                      required 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="codPuntoVentaMH" className="font-bold text-xs text-800">Cod. Punto de Venta <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-qrcode premium-input-icon"></i>
                    <InputText 
                      id="codPuntoVentaMH" 
                      value={datosComercio.codPuntoVentaMH} 
                      onChange={(e) => setDatosComercio({...datosComercio, codPuntoVentaMH: e.target.value})} 
                      placeholder="P001" 
                      required 
                    />
                  </div>
                </div>
                <div className="col-12 flex flex-column gap-2 mt-2">
                  <label htmlFor="actividadEconomica_id" className="font-bold text-xs text-800">Actividad Económica Emisor</label>
                  <Dropdown 
                    id="actividadEconomica_id" 
                    value={datosComercio.actividadEconomica_id} 
                    options={actividadesLista.map(a => ({ label: `${a.CodActividad || a.codActividad} - ${a.DescActividad || a.descActividad}`, value: a.id }))} 
                    onChange={(e) => setDatosComercio({...datosComercio, actividadEconomica_id: e.value})} 
                  />
                </div>
              </div>
            </div>

            {/* 3. Dirección y contacto */}
            <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
              <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-map text-primary"></i> 3. Dirección y Contacto Comercial
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="telefono" className="font-bold text-xs text-800">Teléfono Emisor</label>
                  <div className="premium-input-group">
                    <i className="pi pi-phone premium-input-icon"></i>
                    <InputText 
                      id="telefono" 
                      value={datosComercio.telefono} 
                      onChange={(e) => setDatosComercio({...datosComercio, telefono: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="correo" className="font-bold text-xs text-800">Correo Comercial <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-envelope premium-input-icon"></i>
                    <InputText 
                      id="correo" 
                      value={datosComercio.correo || ''} 
                      onChange={(e) => setDatosComercio({...datosComercio, correo: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="distrito_id" className="font-bold text-xs text-800">Distrito</label>
                  <Dropdown 
                    id="distrito_id" 
                    value={datosComercio.distrito_id} 
                    options={distritosLista.map(d => ({ label: d.Nombre || d.nombre || 'Distrito', value: d.id }))} 
                    onChange={(e) => setDatosComercio({...datosComercio, distrito_id: e.value})} 
                  />
                </div>
                <div className="col-12 md:col-6 flex align-items-center justify-content-between mt-4 p-2 bg-transparent">
                  <div className="flex flex-column">
                    <span className="font-bold text-xs text-800">¿Gran Contribuyente?</span>
                    <span className="text-xs text-500" style={{ color: 'var(--text-muted)' }}>Clasificación del comercio emisor</span>
                  </div>
                  <InputSwitch 
                    checked={datosComercio.granContribuyente} 
                    onChange={(e) => setDatosComercio({...datosComercio, granContribuyente: e.value})} 
                  />
                </div>
                <div className="col-12 flex flex-column gap-2 mt-2">
                  <label htmlFor="complementoDireccion" className="font-bold text-xs text-800">Dirección Física Completa</label>
                  <div className="premium-input-group">
                    <i className="pi pi-compass premium-input-icon"></i>
                    <InputText 
                      id="complementoDireccion" 
                      value={datosComercio.complementoDireccion} 
                      onChange={(e) => setDatosComercio({...datosComercio, complementoDireccion: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-content-end mt-2">
              <Button 
                type="submit" 
                label={cargando ? "Guardando..." : "Guardar Configuración"} 
                icon={cargando ? "pi pi-spin pi-spinner" : "pi pi-save"} 
                className="premium-btn" 
                style={{ width: '240px' }}
                disabled={cargando}
              />
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}