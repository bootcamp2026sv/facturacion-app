import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';

import api from '../../services/api';
import { obtenerValoresCorreoPorDefecto } from '../../utils/configuracionCorreo';

// Catálogos de prueba locales
const MUNICIPIOS_SIMULADOS = [
  { id: 1, Nombre: 'San Salvador Centro', Codigo: '0614' },
  { id: 2, Nombre: 'La Libertad Este', Codigo: '0501' },
  { id: 3, Nombre: 'Santa Ana Centro', Codigo: '0201' },
  { id: 4, Nombre: 'San Miguel Centro', Codigo: '1201' },
  { id: 5, Nombre: 'La Libertad Sur', Codigo: '0502' }
];

void MUNICIPIOS_SIMULADOS;

const ACTIVIDADES_SIMULADAS = [
  { id: 1, CodActividad: '62010', DescActividad: 'Actividades de programación informática (Desarrollo de software)' },
  { id: 2, CodActividad: '62020', DescActividad: 'Consultoría de informática y de gestión de instalaciones informáticas' },
  { id: 3, CodActividad: '47730', DescActividad: 'Venta al por menor de productos farmacéuticos y médicos en establecimientos especializados' },
  { id: 4, CodActividad: '56101', DescActividad: 'Restaurantes y servicios móviles de comidas' }
];

const PROVEEDORES_CORREO = [
  { label: 'Gmail / Google Workspace', value: 'GMAIL' },
  { label: 'cPanel', value: 'CPANEL' },
  { label: 'Plesk', value: 'PLESK' },
  { label: 'Servidor personalizado', value: 'PERSONALIZADO' }
];

const SEGURIDADES_SMTP = [
  { label: 'STARTTLS (puerto 587)', value: 'STARTTLS' },
  { label: 'SSL/TLS (puerto 465)', value: 'SSL' },
  { label: 'Sin cifrado', value: 'NINGUNA' }
];

const crearConfiguracionInicial = () => ({
  claveCertificadoPublica: '',
  claveCertificadoPrivada: '',
  claveApi: '',
  certificado: null,
  nombreCertificado: ''
});

const crearConfiguracionCorreoInicial = () => ({
  correoActivo: false,
  proveedorCorreo: 'GMAIL',
  servidorSmtp: 'smtp.gmail.com',
  puertoSmtp: 587,
  seguridadSmtp: 'STARTTLS',
  usuarioSmtp: '',
  contrasenaSmtp: '',
  correoRemitente: '',
  nombreRemitente: '',
  destinatarioPrueba: '',
  contrasenaConfigurada: false
});

export default function VistaComercios() {
  const toast = useRef(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Estados para catálogos
  const [distritosLista, setDistritosLista] = useState([]);
  const [actividadesLista, setActividadesLista] = useState(ACTIVIDADES_SIMULADAS);
  const [ambienteActivo, setAmbienteActivo] = useState('00');
  const [guardandoAmbiente, setGuardandoAmbiente] = useState(false);
  const [guardandoCorreo, setGuardandoCorreo] = useState(false);
  const [probandoCorreo, setProbandoCorreo] = useState(false);
  const [configuraciones, setConfiguraciones] = useState({
    '00': crearConfiguracionInicial(),
    '01': crearConfiguracionInicial()
  });
  const [configuracionCorreo, setConfiguracionCorreo] = useState(crearConfiguracionCorreoInicial());

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
          const resConfiguracion = await api.get(`/Comercios/${comercio.id}/configuracion-facturacion`);
          setConfiguraciones((actual) => {
            const configuracionesAPI = { ...actual };
          (resConfiguracion.data || []).forEach((config) => {
            if (config.ambiente === '00' || config.ambiente === '01') {
              configuracionesAPI[config.ambiente] = {
                ...configuracionesAPI[config.ambiente],
                nombreCertificado: config.nombreCertificado || '',
                // La API devuelve estos valores enmascarados; no se vuelven a cargar
                // en los inputs para evitar guardar la máscara como si fuera el secreto.
                claveCertificadoPublica: '',
                claveCertificadoPrivada: '',
                claveApi: ''
              };
            }
          });
            return configuracionesAPI;
          });
          const resCorreo = await api.get(`/Comercios/${comercio.id}/configuracion-correo`);
          setConfiguracionCorreo((actual) => ({
            ...actual,
            correoActivo: Boolean(resCorreo.data?.correoActivo),
            proveedorCorreo: resCorreo.data?.proveedorCorreo || actual.proveedorCorreo,
            servidorSmtp: resCorreo.data?.servidorSmtp || actual.servidorSmtp,
            puertoSmtp: resCorreo.data?.puertoSmtp || actual.puertoSmtp,
            seguridadSmtp: resCorreo.data?.seguridadSmtp || actual.seguridadSmtp,
            usuarioSmtp: resCorreo.data?.usuarioSmtp || '',
            correoRemitente: resCorreo.data?.correoRemitente || comercio.correo || '',
            nombreRemitente: resCorreo.data?.nombreRemitente || comercio.nombreComercial || comercio.nombre || '',
            destinatarioPrueba: comercio.correo || '',
            contrasenaSmtp: '',
            contrasenaConfigurada: Boolean(resCorreo.data?.contrasenaConfigurada)
          }));
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

  const actualizarConfiguracion = (campo, valor) => {
    setConfiguraciones((actual) => ({
      ...actual,
      [ambienteActivo]: { ...actual[ambienteActivo], [campo]: valor }
    }));
  };

  const actualizarConfiguracionCorreo = (campo, valor) => {
    setConfiguracionCorreo((actual) => ({ ...actual, [campo]: valor }));
  };

  const aplicarValoresCorreo = (proveedor) => {
    const valores = obtenerValoresCorreoPorDefecto(
      proveedor,
      configuracionCorreo.correoRemitente || datosComercio.correo
    );

    setConfiguracionCorreo((actual) => ({ ...actual, ...valores }));
  };

  const guardarConfiguracionFacturacion = async () => {
    if (!datosComercio.id) {
      toast.current.show({ severity: 'warn', summary: 'Primero guarda el comercio', detail: 'La configuración electrónica necesita un comercio emisor.', life: 4000 });
      return;
    }
    const config = configuraciones[ambienteActivo];
    const formulario = new FormData();
    formulario.append('claveCertificadoPublica', config.claveCertificadoPublica || '');
    formulario.append('claveCertificadoPrivada', config.claveCertificadoPrivada || '');
    formulario.append('claveApi', config.claveApi || '');
    if (config.certificado) formulario.append('certificado', config.certificado);

    setGuardandoAmbiente(true);
    try {
      const respuesta = await api.put(`/Comercios/${datosComercio.id}/configuracion-facturacion/${ambienteActivo}`, formulario, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setConfiguraciones((actual) => ({
        ...actual,
        [ambienteActivo]: { ...actual[ambienteActivo], claveCertificadoPublica: '', claveCertificadoPrivada: '', claveApi: '', nombreCertificado: respuesta.data.nombreCertificado || actual[ambienteActivo].nombreCertificado, certificado: null }
      }));
      toast.current.show({ severity: 'success', summary: 'Ambiente guardado', detail: `Credenciales de ${ambienteActivo === '00' ? 'pruebas' : 'producción'} actualizadas correctamente.`, life: 3500 });
    } catch (error) {
      const apiMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar la configuración del ambiente.';
      toast.current.show({ severity: 'error', summary: 'Error de configuración', detail: apiMsg, life: 6000 });
    } finally {
      setGuardandoAmbiente(false);
    }
  };

  const guardarConfiguracionCorreo = async () => {
    if (!datosComercio.id) {
      toast.current.show({ severity: 'warn', summary: 'Primero guarda el comercio', detail: 'La configuración SMTP necesita un comercio emisor.', life: 4000 });
      return;
    }

    setGuardandoCorreo(true);
    try {
      const respuesta = await api.put(`/Comercios/${datosComercio.id}/configuracion-correo`, {
        correoActivo: configuracionCorreo.correoActivo,
        proveedorCorreo: configuracionCorreo.proveedorCorreo,
        servidorSmtp: configuracionCorreo.servidorSmtp,
        puertoSmtp: Number(configuracionCorreo.puertoSmtp),
        seguridadSmtp: configuracionCorreo.seguridadSmtp,
        usuarioSmtp: configuracionCorreo.usuarioSmtp,
        contrasenaSmtp: configuracionCorreo.contrasenaSmtp,
        correoRemitente: configuracionCorreo.correoRemitente,
        nombreRemitente: configuracionCorreo.nombreRemitente
      });

      setConfiguracionCorreo((actual) => ({
        ...actual,
        contrasenaSmtp: '',
        contrasenaConfigurada: Boolean(respuesta.data?.contrasenaConfigurada)
      }));
      toast.current.show({ severity: 'success', summary: 'SMTP guardado', detail: 'La configuración de correo se guardó correctamente.', life: 3500 });
    } catch (error) {
      const apiMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar la configuración SMTP.';
      toast.current.show({ severity: 'error', summary: 'Error SMTP', detail: apiMsg, life: 6000 });
    } finally {
      setGuardandoCorreo(false);
    }
  };

  const probarConfiguracionCorreo = async () => {
    if (!datosComercio.id) {
      toast.current.show({ severity: 'warn', summary: 'Primero guarda el comercio', detail: 'La prueba SMTP necesita un comercio emisor.', life: 4000 });
      return;
    }

    const destinatario = configuracionCorreo.destinatarioPrueba || datosComercio.correo;
    if (!destinatario) {
      toast.current.show({ severity: 'warn', summary: 'Destinatario requerido', detail: 'Indica un correo para recibir la prueba SMTP.', life: 4000 });
      return;
    }

    setProbandoCorreo(true);
    try {
      const respuesta = await api.post(`/Comercios/${datosComercio.id}/configuracion-correo/test`, {
        correoActivo: configuracionCorreo.correoActivo,
        proveedorCorreo: configuracionCorreo.proveedorCorreo,
        servidorSmtp: configuracionCorreo.servidorSmtp,
        puertoSmtp: Number(configuracionCorreo.puertoSmtp),
        seguridadSmtp: configuracionCorreo.seguridadSmtp,
        usuarioSmtp: configuracionCorreo.usuarioSmtp,
        contrasenaSmtp: configuracionCorreo.contrasenaSmtp,
        correoRemitente: configuracionCorreo.correoRemitente,
        nombreRemitente: configuracionCorreo.nombreRemitente,
        destinatarioPrueba: destinatario
      });
      toast.current.show({ severity: 'success', summary: 'Prueba SMTP exitosa', detail: respuesta.data?.mensaje || 'Correo de prueba enviado correctamente.', life: 5000 });
    } catch (error) {
      const apiMsg = error.response?.data?.message || error.response?.data?.error || 'No fue posible enviar el correo de prueba.';
      toast.current.show({ severity: 'error', summary: 'Prueba SMTP fallida', detail: apiMsg, life: 7000 });
    } finally {
      setProbandoCorreo(false);
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

            {/* 4. Credenciales de facturación electrónica */}
            <div className="border-round-xl p-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.04))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold mt-0 mb-2 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="pi pi-shield text-primary"></i> 4. Facturación electrónica
                  </h3>
                  <p className="text-xs m-0" style={{ color: 'var(--text-muted)', maxWidth: '560px' }}>
                    Guarda las credenciales y el certificado del Ministerio de Hacienda por separado. Los valores existentes se muestran protegidos.
                  </p>
                </div>
                <div className="flex gap-2 p-1 border-round-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  {['00', '01'].map((ambiente) => (
                    <button
                      key={ambiente}
                      type="button"
                      onClick={() => setAmbienteActivo(ambiente)}
                      className={`border-none border-round-lg px-3 py-2 cursor-pointer text-xs font-bold transition-colors ${ambienteActivo === ambiente ? 'bg-primary text-white' : 'bg-transparent text-primary'}`}
                    >
                      {ambiente === '00' ? '00 · Pruebas' : '01 · Producción'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="claveCertificadoPublica" className="font-bold text-xs text-800">Clave certificado pública</label>
                  <div className="premium-input-group">
                    <i className="pi pi-lock premium-input-icon"></i>
                    <InputText id="claveCertificadoPublica" type="password" autoComplete="new-password" value={configuraciones[ambienteActivo].claveCertificadoPublica} onChange={(e) => actualizarConfiguracion('claveCertificadoPublica', e.target.value)} placeholder="Se conserva si lo dejas vacío" />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="claveCertificadoPrivada" className="font-bold text-xs text-800">Clave certificado privada</label>
                  <div className="premium-input-group">
                    <i className="pi pi-key premium-input-icon"></i>
                    <InputText id="claveCertificadoPrivada" type="password" autoComplete="new-password" value={configuraciones[ambienteActivo].claveCertificadoPrivada} onChange={(e) => actualizarConfiguracion('claveCertificadoPrivada', e.target.value)} placeholder="Se conserva si lo dejas vacío" />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="claveApi" className="font-bold text-xs text-800">Clave de API de Hacienda</label>
                  <div className="premium-input-group">
                    <i className="pi pi-key premium-input-icon"></i>
                    <InputText id="claveApi" type="password" autoComplete="new-password" value={configuraciones[ambienteActivo].claveApi} onChange={(e) => actualizarConfiguracion('claveApi', e.target.value)} placeholder="Se conserva si lo dejas vacío" />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="certificado" className="font-bold text-xs text-800">Certificado digital (.crt)</label>
                  <input id="certificado" type="file" accept=".crt" className="p-inputtext p-component w-full" onChange={(e) => actualizarConfiguracion('certificado', e.target.files?.[0] || null)} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {configuraciones[ambienteActivo].certificado?.name || configuraciones[ambienteActivo].nombreCertificado || 'Ningún certificado cargado'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(99,102,241,0.14)' }}>
                <span className="text-xs flex align-items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <i className="pi pi-info-circle text-primary"></i>
                  El certificado se guardará en la carpeta segura del ambiente seleccionado.
                </span>
                <Button type="button" label={guardandoAmbiente ? 'Guardando ambiente...' : `Guardar ${ambienteActivo === '00' ? 'pruebas' : 'producción'}`} icon={guardandoAmbiente ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-upload'} className="premium-btn" onClick={guardarConfiguracionFacturacion} disabled={guardandoAmbiente || cargando} />
              </div>
            </div>

            {/* 5. Correo SMTP para documentos */}
            <div className="border-round-xl p-4 mt-4 bg-light border-1 border-300 dark:border-slate-700" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(59,130,246,0.05))', border: '1px solid rgba(16,185,129,0.22)' }}>
              <div className="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold mt-0 mb-2 flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <i className="pi pi-envelope text-green-500"></i> 5. Configuración de correo para documentos
                  </h3>
                  <p className="text-xs m-0" style={{ color: 'var(--text-muted)', maxWidth: '620px' }}>
                    Esta configuración pertenece al comercio y se utiliza para enviar documentos tanto en pruebas como en producción. La contraseña no se muestra después de guardarla.
                  </p>
                </div>
                <div className="flex align-items-center gap-2 px-3 py-2 border-round-lg" style={{ background: configuracionCorreo.contrasenaConfigurada ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }}>
                  <i className={`pi ${configuracionCorreo.contrasenaConfigurada ? 'pi-check-circle text-green-500' : 'pi-info-circle text-orange-500'}`}></i>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {configuracionCorreo.contrasenaConfigurada ? 'Contraseña guardada' : 'Sin contraseña guardada'}
                  </span>
                </div>
              </div>

              <div className="flex align-items-center justify-content-between gap-3 mb-4 p-3 border-round-lg" style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(16,185,129,0.14)' }}>
                <div>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Activar envío de correo</span>
                  <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-muted)' }}>Permite enviar documentos desde cualquier ambiente fiscal.</p>
                </div>
                <InputSwitch checked={Boolean(configuracionCorreo.correoActivo)} onChange={(e) => actualizarConfiguracionCorreo('correoActivo', e.value)} />
              </div>

              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="proveedorCorreo" className="font-bold text-xs text-800">Proveedor</label>
                  <Dropdown id="proveedorCorreo" value={configuracionCorreo.proveedorCorreo} options={PROVEEDORES_CORREO} optionLabel="label" optionValue="value" onChange={(e) => aplicarValoresCorreo(e.value)} className="w-full" />
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="seguridadSmtp" className="font-bold text-xs text-800">Seguridad SMTP</label>
                  <Dropdown id="seguridadSmtp" value={configuracionCorreo.seguridadSmtp} options={SEGURIDADES_SMTP} optionLabel="label" optionValue="value" onChange={(e) => actualizarConfiguracionCorreo('seguridadSmtp', e.value)} className="w-full" />
                </div>
                <div className="col-12 md:col-8 flex flex-column gap-2 mt-2">
                  <label htmlFor="servidorSmtp" className="font-bold text-xs text-800">Servidor SMTP</label>
                  <div className="premium-input-group">
                    <i className="pi pi-server premium-input-icon"></i>
                    <InputText id="servidorSmtp" value={configuracionCorreo.servidorSmtp} onChange={(e) => actualizarConfiguracionCorreo('servidorSmtp', e.target.value)} placeholder="smtp.gmail.com o mail.tudominio.com" />
                  </div>
                </div>
                <div className="col-12 md:col-4 flex flex-column gap-2 mt-2">
                  <label htmlFor="puertoSmtp" className="font-bold text-xs text-800">Puerto</label>
                  <div className="premium-input-group">
                    <i className="pi pi-hashtag premium-input-icon"></i>
                    <InputText id="puertoSmtp" type="number" min="1" max="65535" value={configuracionCorreo.puertoSmtp} onChange={(e) => actualizarConfiguracionCorreo('puertoSmtp', e.target.value)} />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="usuarioSmtp" className="font-bold text-xs text-800">Usuario SMTP</label>
                  <div className="premium-input-group">
                    <i className="pi pi-user premium-input-icon"></i>
                    <InputText id="usuarioSmtp" value={configuracionCorreo.usuarioSmtp} onChange={(e) => actualizarConfiguracionCorreo('usuarioSmtp', e.target.value)} placeholder="correo@tudominio.com" autoComplete="username" />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="contrasenaSmtp" className="font-bold text-xs text-800">Contraseña SMTP / contraseña de aplicación</label>
                  <div className="premium-input-group">
                    <i className="pi pi-key premium-input-icon"></i>
                    <InputText id="contrasenaSmtp" type="password" value={configuracionCorreo.contrasenaSmtp} onChange={(e) => actualizarConfiguracionCorreo('contrasenaSmtp', e.target.value)} placeholder="Se conserva si lo dejas vacío" autoComplete="new-password" />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="correoRemitente" className="font-bold text-xs text-800">Correo remitente</label>
                  <div className="premium-input-group">
                    <i className="pi pi-at premium-input-icon"></i>
                    <InputText id="correoRemitente" type="email" value={configuracionCorreo.correoRemitente} onChange={(e) => actualizarConfiguracionCorreo('correoRemitente', e.target.value)} placeholder="facturacion@tudominio.com" />
                  </div>
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2 mt-2">
                  <label htmlFor="nombreRemitente" className="font-bold text-xs text-800">Nombre del remitente</label>
                  <div className="premium-input-group">
                    <i className="pi pi-id-card premium-input-icon"></i>
                    <InputText id="nombreRemitente" value={configuracionCorreo.nombreRemitente} onChange={(e) => actualizarConfiguracionCorreo('nombreRemitente', e.target.value)} placeholder="Nombre del comercio" />
                  </div>
                </div>
                <div className="col-12 flex flex-column gap-2 mt-2">
                  <label htmlFor="destinatarioPrueba" className="font-bold text-xs text-800">Destinatario del correo de prueba</label>
                  <div className="premium-input-group">
                    <i className="pi pi-send premium-input-icon"></i>
                    <InputText id="destinatarioPrueba" type="email" value={configuracionCorreo.destinatarioPrueba} onChange={(e) => actualizarConfiguracionCorreo('destinatarioPrueba', e.target.value)} placeholder="correo donde recibirás la prueba" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(16,185,129,0.16)' }}>
                <span className="text-xs flex align-items-start gap-2" style={{ color: 'var(--text-muted)', maxWidth: '620px' }}>
                  <i className="pi pi-info-circle text-green-500 mt-1"></i>
                  <span>Gmail normalmente usa una contraseña de aplicación. En cPanel y Plesk confirma el nombre exacto del servidor y el puerto con tu proveedor.</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" label="Aplicar valores recomendados" icon="pi pi-sliders-h" className="p-button-outlined p-button-secondary" onClick={() => aplicarValoresCorreo(configuracionCorreo.proveedorCorreo)} disabled={guardandoCorreo || probandoCorreo || cargando || !datosComercio.id} />
                  <Button type="button" label={probandoCorreo ? 'Enviando prueba...' : 'Enviar correo de prueba'} icon={probandoCorreo ? 'pi pi-spin pi-spinner' : 'pi pi-send'} className="p-button-outlined p-button-success" onClick={probarConfiguracionCorreo} disabled={probandoCorreo || guardandoCorreo || cargando || !datosComercio.id} />
                  <Button type="button" label={guardandoCorreo ? 'Guardando SMTP...' : 'Guardar SMTP'} icon={guardandoCorreo ? 'pi pi-spin pi-spinner' : 'pi pi-save'} className="premium-btn" onClick={guardarConfiguracionCorreo} disabled={guardandoCorreo || probandoCorreo || cargando || !datosComercio.id} />
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
