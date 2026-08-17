import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import { TabPanel, TabView } from 'primereact/tabview';

import api from '../../services/api';
import { obtenerValoresCorreoPorDefecto } from '../../utils/configuracionCorreo';
import { useAuth } from '../../context/AuthContext';
import { resolverUrlMedia } from '../../utils/media';
import { guardarMarcaComercio } from '../../utils/marcaComercio';
import { actualizarCatalogoPosCache } from './puntoVenta/serviciosPuntoVenta';
import './VistaComercios.css';

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

function EncabezadoSeccion({ icono, titulo, descripcion, complemento }) {
  return (
    <div className="comercio-seccion__encabezado">
      <div className="comercio-seccion__titulo-wrap">
        <span className="comercio-seccion__icono"><i className={`pi ${icono}`} /></span>
        <div>
          <h3>{titulo}</h3>
          {descripcion && <p>{descripcion}</p>}
        </div>
      </div>
      {complemento}
    </div>
  );
}

export default function VistaComercios() {
  const { puede } = useAuth();
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
  const [logoArchivo, setLogoArchivo] = useState(null);
  const [logoVistaPrevia, setLogoVistaPrevia] = useState(null);
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
    actividadEconomica_id: 1,
    logoUrl: null
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
          guardarMarcaComercio(comercio);
          actualizarCatalogoPosCache('comercio', comercio);
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
            actividadEconomica_id: comercio.actividadEconomica_id || comercio.ActividadEconomica_id || comercio.actividadEconomica?.id || comercio.ActividadEconomica?.id || 1,
            logoUrl: comercio.logoUrl || null
          });
          setLogoVistaPrevia(resolverUrlMedia(comercio.logoUrl));
          if (puede('COMERCIO_CONFIGURAR')) {
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
  }, [puede]);

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

      let comercioGuardado = respuesta.data;
      let errorLogo = null;
      if (logoArchivo && comercioGuardado?.id) {
        const formularioLogo = new FormData();
        formularioLogo.append('archivo', logoArchivo);
        try {
          comercioGuardado = (await api.post(`/Comercios/${comercioGuardado.id}/logo`, formularioLogo, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })).data;
          setLogoArchivo(null);
          setLogoVistaPrevia(resolverUrlMedia(comercioGuardado.logoUrl));
        } catch (errorCargaLogo) {
          errorLogo = errorCargaLogo.response?.data?.message || 'El comercio se guardo, pero el logo no pudo procesarse.';
        }
      }
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
        actividadEconomica_id: comercioGuardado.actividadEconomica_id || comercioGuardado.ActividadEconomica_id || comercioGuardado.actividadEconomica?.id || comercioGuardado.ActividadEconomica?.id || 1,
        logoUrl: comercioGuardado.logoUrl || null
      });
      guardarMarcaComercio(comercioGuardado);
      actualizarCatalogoPosCache('comercio', comercioGuardado);

      toast.current.show(errorLogo
        ? { severity: 'warn', summary: 'Comercio guardado sin logo', detail: errorLogo, life: 5500 }
        : { severity: 'success', summary: 'Guardado', detail: 'Datos de comercio actualizados correctamente.', life: 3000 });

    } catch (error) {
      console.error("Error al guardar comercio:", error.response?.data || error);
      const apiMsg = error.response?.data?.message || error.response?.data?.error || 'No se pudo guardar la configuración de comercio.';
      toast.current.show({ severity: 'error', summary: 'Error', detail: apiMsg, life: 6000 });
    } finally {
      setCargando(false);
    }
  };

  const seleccionarLogo = (archivo) => {
    if (!archivo) return;
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) {
      toast.current.show({ severity: 'warn', summary: 'Formato no permitido', detail: 'Selecciona un logo PNG o JPEG.', life: 3500 });
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      toast.current.show({ severity: 'warn', summary: 'Logo demasiado grande', detail: 'El archivo original no puede superar 5 MB.', life: 3500 });
      return;
    }
    if (logoVistaPrevia?.startsWith('blob:')) URL.revokeObjectURL(logoVistaPrevia);
    setLogoArchivo(archivo);
    setLogoVistaPrevia(URL.createObjectURL(archivo));
  };

  const eliminarLogo = async () => {
    if (logoVistaPrevia?.startsWith('blob:')) URL.revokeObjectURL(logoVistaPrevia);
    setLogoArchivo(null);
    if (!datosComercio.id || !datosComercio.logoUrl) {
      setLogoVistaPrevia(null);
      setDatosComercio((actual) => ({ ...actual, logoUrl: null }));
      return;
    }
    try {
      await api.delete(`/Comercios/${datosComercio.id}/logo`);
      setLogoVistaPrevia(null);
      setDatosComercio((actual) => ({ ...actual, logoUrl: null }));
      guardarMarcaComercio({ ...datosComercio, logoUrl: null });
      actualizarCatalogoPosCache('comercio', { ...datosComercio, logoUrl: null });
      toast.current.show({ severity: 'success', summary: 'Logo eliminado', detail: 'Los documentos volveran a usar el encabezado sin logo.', life: 3500 });
    } catch (error) {
      const apiMsg = error.response?.data?.message || 'No se pudo eliminar el logo.';
      toast.current.show({ severity: 'error', summary: 'Error', detail: apiMsg, life: 4500 });
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
      <div className="comercio-configuracion comercio-configuracion--cargando premium-fade-in">
        <Toast ref={toast} />
        <div className="comercio-cargando">
          <span className="comercio-cargando__icono"><i className="pi pi-spin pi-spinner" /></span>
          <h3 className="text-xl font-bold m-0 mb-2" style={{ color: 'var(--text-primary)' }}>Cargando Configuración</h3>
          <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>Obteniendo datos del comercio emisor desde el servidor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comercio-configuracion premium-fade-in">
      <Toast ref={toast} />

      <header className="comercio-cabecera">
        <div>
          <span className="comercio-cabecera__ruta">Administración / Emisor</span>
          <h1>Configuración del comercio</h1>
          <p>Administra la identidad fiscal, la conexión con Hacienda y el envío de documentos.</p>
        </div>
        <div className="comercio-cabecera__estado">
          <span className={`comercio-chip ${datosComercio.id ? 'comercio-chip--exito' : 'comercio-chip--pendiente'}`}>
            <i className={`pi ${datosComercio.id ? 'pi-check-circle' : 'pi-clock'}`} />
            {datosComercio.id ? 'Emisor registrado' : 'Registro pendiente'}
          </span>
          <span className={`comercio-chip ${datosComercio.logoUrl || logoArchivo ? 'comercio-chip--exito' : ''}`}>
            <i className="pi pi-image" />
            {datosComercio.logoUrl || logoArchivo ? 'Logo configurado' : 'Sin logo'}
          </span>
        </div>
      </header>

      <section className="comercio-resumen">
        <div className="comercio-resumen__logo">
          {logoVistaPrevia ? (
            <img src={logoVistaPrevia} alt={`Logo de ${datosComercio.nombreComercial || datosComercio.nombre}`} />
          ) : (
            <i className="pi pi-building" />
          )}
        </div>
        <div className="comercio-resumen__identidad">
          <span>Comercio emisor</span>
          <h2>{datosComercio.nombreComercial || datosComercio.nombre || 'Comercio sin nombre'}</h2>
          <p>{datosComercio.nombre && datosComercio.nombre !== datosComercio.nombreComercial ? datosComercio.nombre : 'Identidad principal de tus documentos electrónicos'}</p>
        </div>
        <dl className="comercio-resumen__datos">
          <div><dt>NIT</dt><dd>{datosComercio.nit || 'No configurado'}</dd></div>
          <div><dt>Establecimiento</dt><dd>{datosComercio.codEstableMH || 'Pendiente'}</dd></div>
          <div><dt>Punto de venta</dt><dd>{datosComercio.codPuntoVentaMH || 'Pendiente'}</dd></div>
        </dl>
      </section>

      <div className="comercio-contenido premium-surface-card">
        <form onSubmit={guardarComercio} className="comercio-formulario p-fluid">
          <TabView className="comercio-tabs premium-tabs">
            <TabPanel header="Datos del comercio" leftIcon="pi pi-building mr-2">
              <div className="comercio-general-grid">
            <section className="comercio-seccion comercio-seccion--logo">
              <EncabezadoSeccion
                icono="pi-image"
                titulo="Identidad visual"
                descripcion="Este logo se utiliza en el PDF y en el ticket térmico."
              />
              <div className="comercio-logo-editor">
                <div className="comercio-logo-editor__preview">
                  {logoVistaPrevia ? (
                    <img src={logoVistaPrevia} alt="Vista previa del logo" />
                  ) : (
                    <i className="pi pi-building" />
                  )}
                </div>
                <div className="comercio-logo-editor__controles">
                  <input
                    id="logoComercio"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="p-inputtext p-component comercio-file-input"
                    onChange={(e) => seleccionarLogo(e.target.files?.[0])}
                    disabled={cargando || !puede('COMERCIO_EDITAR')}
                  />
                  <small>
                    PNG o JPEG, máximo 5 MB. Se ajustará automáticamente a 600 × 240 px.
                  </small>
                  {(logoVistaPrevia || datosComercio.logoUrl) && puede('COMERCIO_EDITAR') && (
                    <Button type="button" label="Quitar logo" icon="pi pi-trash" severity="danger" outlined onClick={eliminarLogo} disabled={cargando} className="align-self-start" />
                  )}
                </div>
              </div>
            </section>
            
            {/* 1. Información Legal */}
            <div className="comercio-seccion comercio-seccion--legal">
              <EncabezadoSeccion
                icono="pi-id-card"
                titulo="Identidad legal y fiscal"
                descripcion="Información con la que el comercio se identifica ante sus clientes y Hacienda."
              />
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
            <div className="comercio-seccion comercio-seccion--hacienda">
              <EncabezadoSeccion
                icono="pi-key"
                titulo="Parámetros del emisor"
                descripcion="Códigos operativos y actividad económica declarada."
              />
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
            <div className="comercio-seccion comercio-seccion--contacto">
              <EncabezadoSeccion
                icono="pi-map-marker"
                titulo="Dirección y contacto"
                descripcion="Datos visibles para clientes y documentos comerciales."
              />
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
                <div className="col-12 md:col-6 comercio-switch-card comercio-switch-card--compact">
                  <div>
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

              </div>
              {puede('COMERCIO_EDITAR') && (
                <div className="comercio-acciones comercio-acciones--principal">
                  <div>
                    <strong>Datos generales del emisor</strong>
                    <span>Guarda la identidad, los códigos fiscales, el logo y la dirección.</span>
                  </div>
                  <Button
                    type="submit"
                    label={cargando ? 'Guardando...' : 'Guardar datos del comercio'}
                    icon={cargando ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                    className="premium-btn"
                    disabled={cargando}
                  />
                </div>
              )}
            </TabPanel>

            {/* 4. Credenciales de facturación electrónica */}
            {puede('COMERCIO_CONFIGURAR') && (
            <TabPanel header="Facturación electrónica" leftIcon="pi pi-shield mr-2">
            <div className="comercio-seccion comercio-seccion--facturacion">
              <EncabezadoSeccion
                icono="pi-shield"
                titulo="Credenciales de Hacienda"
                descripcion="Cada ambiente conserva de forma independiente sus claves y certificado digital."
                complemento={(
                  <div className="comercio-ambientes" role="group" aria-label="Ambiente de facturación">
                    {['00', '01'].map((ambiente) => (
                      <button
                        key={ambiente}
                        type="button"
                        onClick={() => setAmbienteActivo(ambiente)}
                        className={ambienteActivo === ambiente ? 'is-active' : ''}
                      >
                        <span>{ambiente}</span>
                        <strong>{ambiente === '00' ? 'Pruebas' : 'Producción'}</strong>
                        <i className={`pi ${configuraciones[ambiente].nombreCertificado ? 'pi-check-circle' : 'pi-circle'}`} />
                      </button>
                    ))}
                  </div>
                )}
              />

              <div className={`comercio-aviso-ambiente comercio-aviso-ambiente--${ambienteActivo}`}>
                <i className={`pi ${ambienteActivo === '00' ? 'pi-wrench' : 'pi-bolt'}`} />
                <div>
                  <strong>Ambiente {ambienteActivo === '00' ? 'de pruebas' : 'de producción'}</strong>
                  <span>{ambienteActivo === '00' ? 'Úsalo para validar la integración sin emitir documentos productivos.' : 'Estas credenciales se usarán para documentos fiscales reales.'}</span>
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

              <div className="comercio-acciones comercio-acciones--facturacion">
                <span className="comercio-acciones__nota">
                  <i className="pi pi-info-circle text-primary"></i>
                  El certificado se guardará en la carpeta segura del ambiente seleccionado.
                </span>
                <Button type="button" label={guardandoAmbiente ? 'Guardando ambiente...' : `Guardar ${ambienteActivo === '00' ? 'pruebas' : 'producción'}`} icon={guardandoAmbiente ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-upload'} className="premium-btn" onClick={guardarConfiguracionFacturacion} disabled={guardandoAmbiente || cargando} />
              </div>
            </div>
            </TabPanel>
            )}

            {/* 5. Correo SMTP para documentos */}
            {puede('COMERCIO_CONFIGURAR') && (
            <TabPanel header="Correo SMTP" leftIcon="pi pi-envelope mr-2">
            <div className="comercio-seccion comercio-seccion--correo">
              <EncabezadoSeccion
                icono="pi-send"
                titulo="Envío de documentos por correo"
                descripcion="Configura una única cuenta SMTP para los ambientes de pruebas y producción."
                complemento={(
                  <span className={`comercio-chip ${configuracionCorreo.contrasenaConfigurada ? 'comercio-chip--exito' : 'comercio-chip--pendiente'}`}>
                    <i className={`pi ${configuracionCorreo.contrasenaConfigurada ? 'pi-check-circle' : 'pi-info-circle'}`} />
                    {configuracionCorreo.contrasenaConfigurada ? 'Contraseña guardada' : 'Falta contraseña'}
                  </span>
                )}
              />

              <div className={`comercio-switch-card comercio-switch-card--correo ${configuracionCorreo.correoActivo ? 'is-active' : ''}`}>
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

              <div className="comercio-acciones comercio-acciones--correo">
                <span className="comercio-acciones__nota">
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
            </TabPanel>
            )}
          </TabView>
          </form>
      </div>
    </div>
  );
}
