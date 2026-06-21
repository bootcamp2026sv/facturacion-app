import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';

import api from '../../services/api';

// Catálogos de respaldo local (Fallback)
const MUNICIPIOS_MOCK = [
  { id: 1, Nombre: 'San Salvador Centro', Codigo: '0614' },
  { id: 2, Nombre: 'La Libertad Este', Codigo: '0501' },
  { id: 3, Nombre: 'Santa Ana Centro', Codigo: '0201' },
  { id: 4, Nombre: 'San Miguel Centro', Codigo: '1201' },
  { id: 5, Nombre: 'La Libertad Sur', Codigo: '0502' }
];

const ACTIVIDADES_MOCK = [
  { id: 1, CodActividad: '62010', DescActividad: 'Actividades de programación informática (Desarrollo de software)' },
  { id: 2, CodActividad: '62020', DescActividad: 'Consultoría de informática y de gestión de instalaciones informáticas' },
  { id: 3, CodActividad: '47730', DescActividad: 'Venta al por menor de productos farmacéuticos y médicos en establecimientos especializados' },
  { id: 4, CodActividad: '56101', DescActividad: 'Restaurantes y servicios móviles de comidas' }
];

export default function VistaComercios() {
  const toast = useRef(null);
  const [cargando, setCargando] = useState(false);

  // Estados para catálogos dinámicos
  const [municipiosLista, setMunicipiosLista] = useState(MUNICIPIOS_MOCK);
  const [actividadesLista, setActividadesLista] = useState(ACTIVIDADES_MOCK);

  // Formulario de Casa Matriz (tipoEstablecimiento: 2)
  const [datosMatriz, setDatosMatriz] = useState({
    id: 1,
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
    municipio_id: 1,
    actividadEconomica_id: 1
  });

  // --- INTEGRACIÓN API ---
  /*
  useEffect(() => {
    const cargarDatosAPI = async () => {
      setCargando(true);
      try {
        // 1. Cargar municipios reales de la API
        const resMuni = await api.get('/municipios');
        const listaMuni = resMuni.data || [];
        setMunicipiosLista(listaMuni);

        // 2. Cargar actividades económicas reales de la API
        const resAct = await api.get('/ActividadEconomicas');
        const listaAct = resAct.data || [];
        setActividadesLista(listaAct);

        // 3. Cargar comercios reales
        const respuesta = await api.get('/Comercios');
        const listaComercios = respuesta.data || [];

        // Encontrar la casa matriz para rellenar el formulario principal
        const matriz = listaComercios.find(c => {
          const tipo = c.tipoEstablecimiento || c.TipoEstablecimiento;
          return tipo === 2;
        });

        if (matriz) {
          setDatosMatriz({
            id: matriz.id,
            nombre: matriz.nombre || matriz.Nombre || '',
            nombreComercial: matriz.nombreComercial || matriz.NombreComercial || '',
            nit: matriz.nit || matriz.Nit || '',
            nrc: matriz.nrc || matriz.Nrc || '',
            telefono: matriz.telefono || matriz.Telefono || '',
            correo: matriz.correo || matriz.Correo || '',
            granContribuyente: matriz.granContribuyente !== undefined ? (matriz.granContribuyente || matriz.GranContribuyente) : false,
            complementoDireccion: matriz.complementoDireccion || matriz.ComplementoDireccion || '',
            tipoEstablecimiento: 2,
            codEstableMH: matriz.codEstableMH || matriz.CodEstableMH || '',
            codPuntoVentaMH: matriz.codPuntoVentaMH || matriz.CodPuntoVentaMH || '',
            municipio_id: matriz.municipio_id || matriz.Municipio_id || matriz.municipio?.id || matriz.Municipio?.id || 1,
            actividadEconomica_id: matriz.actividadEconomica_id || matriz.ActividadEconomica_id || matriz.actividadEconomica?.id || matriz.ActividadEconomica?.id || 1
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
      }
    };
    cargarDatosAPI();
  }, []);
  */

  // --- MÉTODOS DE GUARDADO ---

  // Guardar/Actualizar Casa Matriz
  const guardarMatriz = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      // --- PERSISTENCIA API ---
      /*
      const payload = {
        Nombre: datosMatriz.nombre,
        NombreComercial: datosMatriz.nombreComercial,
        Nit: datosMatriz.nit,
        Nrc: datosMatriz.nrc,
        Telefono: datosMatriz.telefono,
        Correo: datosMatriz.correo,
        GranContribuyente: datosMatriz.granContribuyente,
        ComplementoDireccion: datosMatriz.complementoDireccion,
        TipoEstablecimiento: 2,
        CodEstableMH: datosMatriz.codEstableMH,
        CodPuntoVentaMH: datosMatriz.codPuntoVentaMH,
        Municipio_id: datosMatriz.municipio_id,
        municipio_id: datosMatriz.municipio_id,
        ActividadEconomica_id: datosMatriz.actividadEconomica_id,
        actividadEconomica_id: datosMatriz.actividadEconomica_id
      };

      const respuesta = datosMatriz.id
        ? await api.put(`/Comercios/${datosMatriz.id}`, payload)
        : await api.post('/Comercios', payload);

      toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Datos de Casa Matriz actualizados en el servidor.', life: 3000 });
      */

      // Fallback local
      toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Datos de Casa Matriz actualizados localmente.', life: 3000 });

    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración de Casa Matriz.', life: 3000 });
    } finally {
      setCargando(false);
    }
  };

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
          
          <form onSubmit={guardarMatriz} className="flex flex-column gap-4">
            
            {/* Bloque 1.1: Identificación Legal */}
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
                      value={datosMatriz.nombre} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, nombre: e.target.value})} 
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
                      value={datosMatriz.nombreComercial} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, nombreComercial: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="nit" className="font-bold text-xs text-800">NIT <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-id-card premium-input-icon"></i>
                    <InputText 
                      id="nit" 
                      value={datosMatriz.nit} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, nit: e.target.value})} 
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
                      value={datosMatriz.nrc} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, nrc: e.target.value})} 
                      placeholder="261453-8" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 1.2: Establecimiento MH */}
            <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--surface-border-light)' }}>
              <h3 className="text-base font-bold mt-0 mb-3 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <i className="pi pi-key text-primary"></i> 2. Parámetros de Hacienda (MH)
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="codEstableMH" className="font-bold text-xs text-800">Cod. Establecimiento Casa Matriz <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-map-marker premium-input-icon"></i>
                    <InputText 
                      id="codEstableMH" 
                      value={datosMatriz.codEstableMH} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, codEstableMH: e.target.value})} 
                      placeholder="M001" 
                      required 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="codPuntoVentaMH" className="font-bold text-xs text-800">Cod. Punto de Venta Casa Matriz <span className="text-red-500">*</span></label>
                  <div className="premium-input-group">
                    <i className="pi pi-qrcode premium-input-icon"></i>
                    <InputText 
                      id="codPuntoVentaMH" 
                      value={datosMatriz.codPuntoVentaMH} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, codPuntoVentaMH: e.target.value})} 
                      placeholder="P001" 
                      required 
                    />
                  </div>
                </div>
                <div className="col-12 flex flex-column gap-2 mt-2">
                  <label htmlFor="actividadEconomica_id" className="font-bold text-xs text-800">Actividad Económica Emisor</label>
                  <Dropdown 
                    id="actividadEconomica_id" 
                    value={datosMatriz.actividadEconomica_id} 
                    options={actividadesLista.map(a => ({ label: `${a.CodActividad || a.codActividad} - ${a.DescActividad || a.descActividad}`, value: a.id }))} 
                    onChange={(e) => setDatosMatriz({...datosMatriz, actividadEconomica_id: e.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Bloque 1.3: Contacto y Dirección */}
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
                      value={datosMatriz.telefono} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, telefono: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="correo" className="font-bold text-xs text-800">Correo Comercial</label>
                  <div className="premium-input-group">
                    <i className="pi pi-envelope premium-input-icon"></i>
                    <InputText 
                      id="correo" 
                      value={datosMatriz.correo} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, correo: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="municipio_id" className="font-bold text-xs text-800">Municipio de Matriz</label>
                  <Dropdown 
                    id="municipio_id" 
                    value={datosMatriz.municipio_id} 
                    options={municipiosLista.map(m => ({ label: m.Nombre || m.nombre || 'Municipio', value: m.id }))} 
                    onChange={(e) => setDatosMatriz({...datosMatriz, municipio_id: e.value})} 
                  />
                </div>
                <div className="col-12 md:col-6 flex align-items-center justify-content-between mt-4 p-2 bg-transparent">
                  <div className="flex flex-column">
                    <span className="font-bold text-xs text-800">¿Gran Contribuyente?</span>
                    <span className="text-xs text-500" style={{ color: 'var(--text-muted)' }}>Clasificación del comercio emisor</span>
                  </div>
                  <InputSwitch 
                    checked={datosMatriz.granContribuyente} 
                    onChange={(e) => setDatosMatriz({...datosMatriz, granContribuyente: e.value})} 
                  />
                </div>
                <div className="col-12 flex flex-column gap-2 mt-2">
                  <label htmlFor="complementoDireccion" className="font-bold text-xs text-800">Dirección Física Completa</label>
                  <div className="premium-input-group">
                    <i className="pi pi-compass premium-input-icon"></i>
                    <InputText 
                      id="complementoDireccion" 
                      value={datosMatriz.complementoDireccion} 
                      onChange={(e) => setDatosMatriz({...datosMatriz, complementoDireccion: e.target.value})} 
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