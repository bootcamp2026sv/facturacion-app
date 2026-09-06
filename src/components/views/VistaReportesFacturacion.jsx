import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import api from '../../services/api.js';
import {
  ajustesDesdeFilas,
  erroresLocalesReporte,
  extraerNombreArchivo,
  filasParaEnvio,
  MESES_REPORTE,
  rangoMensual,
  REPORTES_FACTURACION,
  TIPOS_INGRESO_RENTA,
} from '../../utils/reportesFacturacion.js';
import './VistaReportesFacturacion.css';

const ahora = new Date();
const FILTROS_INICIALES = {
  comercioId: null,
  ambiente: null,
  anio: ahora.getFullYear(),
  mes: ahora.getMonth() + 1,
  incluirNotasContribuyentes: false,
  tipoIngresoRenta: 1,
};

const AMBIENTES = [
  { label: 'Pruebas (00)', value: '00' },
  { label: 'Producción (01)', value: '01' },
];

const etiquetaComercio = (comercio) => comercio.nombreComercial || comercio.nombre || `Comercio ${comercio.id}`;

export default function VistaReportesFacturacion() {
  const toast = useRef(null);
  const [comercios, setComercios] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [visible, setVisible] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [anios, setAnios] = useState([ahora.getFullYear()]);
  const [preview, setPreview] = useState(null);
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let activa = true;
    api.get('/Comercios')
      .then((respuestaComercios) => {
        if (!activa) return;
        const lista = respuestaComercios.data || [];
        setComercios(lista);
        if (lista.length) setFiltros((actuales) => ({ ...actuales, comercioId: actuales.comercioId || lista[0].id }));
      })
      .catch((ex) => setError(ex.response?.data?.message || 'No se pudieron cargar los comercios.'));
    return () => { activa = false; };
  }, []);

  useEffect(() => {
    if (!visible || !filtros.comercioId || !filtros.ambiente) return undefined;
    let activa = true;
    api.get('/reportes-facturas/anios', { params: { comercioId: filtros.comercioId, ambiente: filtros.ambiente } })
      .then(({ data }) => {
        if (!activa) return;
        const disponibles = data?.length ? data : [ahora.getFullYear()];
        setAnios(disponibles);
        setFiltros((actuales) => ({
          ...actuales,
          anio: disponibles.includes(actuales.anio) ? actuales.anio : disponibles[0],
        }));
      })
      .catch((ex) => setError(ex.response?.data?.message || 'No se pudieron consultar los años disponibles.'));
    return () => { activa = false; };
  }, [visible, filtros.comercioId, filtros.ambiente]);

  const opcionesComercio = useMemo(() => comercios.map((item) => ({
    value: item.id,
    label: etiquetaComercio(item),
  })), [comercios]);

  const erroresLocales = useMemo(
    () => preview ? erroresLocalesReporte(reporte?.tipo, filas, preview.columnas) : [],
    [preview, reporte, filas],
  );

  const abrir = (seleccionado) => {
    setReporte(seleccionado);
    setVisible(true);
    setPreview(null);
    setFilas([]);
    setError('');
    setProgreso(0);
  };

  const cambiarFiltro = (campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    setPreview(null);
    setFilas([]);
    setError('');
  };

  const solicitudBase = () => ({
    comercioId: filtros.comercioId,
    ambiente: filtros.ambiente,
    anio: Number(filtros.anio),
    mes: Number(filtros.mes),
    incluirNotasContribuyentes: Boolean(filtros.incluirNotasContribuyentes),
    tipoIngresoRenta: Number(filtros.tipoIngresoRenta),
  });

  const cargarPrevisualizacion = async () => {
    if (!filtros.comercioId || !filtros.ambiente || !filtros.anio || !filtros.mes) {
      setError('Seleccione comercio, ambiente, mes y año.');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post(`/reportes-facturas/previsualizaciones/${reporte.tipo}`, solicitudBase());
      setPreview(data);
      setFilas(data.filas || []);
    } catch (ex) {
      setError(ex.response?.data?.message || 'No se pudo generar la previsualización.');
    } finally {
      setCargando(false);
    }
  };

  const actualizarCelda = (indice, campo, valor) => {
    setFilas((actuales) => actuales.map((fila, posicion) => (
      posicion === indice ? { ...fila, [campo]: valor } : fila
    )));
  };

  const obtenerMensajeError = async (ex) => {
    const datos = ex.response?.data;
    if (datos instanceof Blob) {
      try { return JSON.parse(await datos.text()).message || 'No se pudo descargar el reporte.'; } catch { return 'No se pudo descargar el reporte.'; }
    }
    return datos?.message || 'No se pudo descargar el reporte.';
  };

  const descargar = async () => {
    if (descargando || !preview || erroresLocales.length) return;
    setDescargando(true);
    setProgreso(0);
    setError('');
    try {
      const solicitud = { ...solicitudBase(), tokenVistaPrevia: preview.token };
      if (reporte.tipo === 'excel-general') solicitud.ajustes = ajustesDesdeFilas(filas);
      if (reporte.tipo.startsWith('anexo-') || reporte.tipo.startsWith('libro-')) solicitud.filas = filasParaEnvio(filas);
      const respuesta = await api.post(`/reportes-facturas/descargas/${reporte.tipo}`, solicitud, {
        responseType: 'blob',
        onDownloadProgress: ({ loaded, total }) => setProgreso(total ? Math.round((loaded / total) * 100) : 50),
      });
      const nombre = extraerNombreArchivo(respuesta.headers['content-disposition'], `${reporte.tipo}.bin`);
      const url = URL.createObjectURL(respuesta.data);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      setProgreso(100);
      toast.current?.show({ severity: 'success', summary: 'Reporte descargado', detail: nombre, life: 4500 });
    } catch (ex) {
      if (ex.response?.status === 409) {
        setPreview(null);
        setFilas([]);
      }
      setError(await obtenerMensajeError(ex));
    } finally {
      setDescargando(false);
    }
  };

  const cuerpoCelda = (columna) => (fila, opciones) => {
    const valor = fila[columna.campo] ?? '';
    if (!columna.editable) return <span>{String(valor)}</span>;
    return (
      <InputText
        value={String(valor)}
        onChange={(evento) => actualizarCelda(opciones.rowIndex, columna.campo, evento.target.value)}
        className="reportes-tabla__editor"
        aria-label={columna.etiqueta}
      />
    );
  };

  const pie = (
    <div className="reportes-dialogo__pie">
      <Button label="Cerrar" icon="pi pi-times" text onClick={() => setVisible(false)} disabled={descargando} />
      <Button
        label={cargando ? 'Consultando…' : 'Actualizar vista previa'}
        icon={cargando ? 'pi pi-spin pi-spinner' : 'pi pi-eye'}
        outlined
        onClick={cargarPrevisualizacion}
        disabled={cargando || descargando}
      />
      <Button
        label={descargando ? 'Descargando…' : 'Descargar archivo'}
        icon={descargando ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
        onClick={descargar}
        disabled={!preview || Boolean(erroresLocales.length) || cargando || descargando}
      />
    </div>
  );

  return (
    <section className="reportes-facturacion">
      <Toast ref={toast} position="top-right" />
      <div className="reportes-encabezado">
        <div>
          <span className="reportes-encabezado__etiqueta">Cumplimiento fiscal y control interno</span>
          <h2>Reportes de facturación</h2>
          <p>Seleccione un entregable. Los datos se consultan al momento de previsualizar y se validan nuevamente al descargar.</p>
        </div>
        <i className="pi pi-chart-line" aria-hidden="true" />
      </div>

      {error && !visible && <div className="reportes-aviso reportes-aviso--error"><i className="pi pi-exclamation-circle" />{error}</div>}

      <div className="reportes-grid">
        {REPORTES_FACTURACION.map((item) => (
          <button type="button" className={`reporte-tarjeta reporte-tarjeta--${item.tono}`} key={item.tipo} onClick={() => abrir(item)}>
            <span className="reporte-tarjeta__icono"><i className={item.icono} /></span>
            <span className="reporte-tarjeta__contenido">
              <strong>{item.titulo}</strong>
              <small>{item.descripcion}</small>
            </span>
            <i className="pi pi-arrow-right reporte-tarjeta__flecha" />
          </button>
        ))}
      </div>

      <Dialog
        header={reporte?.titulo || 'Reporte'}
        visible={visible}
        onHide={() => !descargando && setVisible(false)}
        footer={pie}
        className="reportes-dialogo"
        style={{ width: 'min(1500px, 97vw)' }}
        breakpoints={{ '900px': '99vw' }}
        draggable={false}
        resizable={false}
        maximizable
      >
        <div className="reportes-filtros">
          <label><span>Comercio *</span><Dropdown value={filtros.comercioId} options={opcionesComercio} onChange={(e) => cambiarFiltro('comercioId', e.value)} placeholder="Seleccione" filter /></label>
          <label><span>Ambiente *</span><Dropdown value={filtros.ambiente} options={AMBIENTES} onChange={(e) => cambiarFiltro('ambiente', e.value)} placeholder="Seleccione" /></label>
          <label><span>Mes *</span><Dropdown value={filtros.mes} options={MESES_REPORTE} onChange={(e) => cambiarFiltro('mes', e.value)} /></label>
          <label><span>Año *</span><Dropdown value={filtros.anio} options={anios.map((value) => ({ label: String(value), value }))} onChange={(e) => cambiarFiltro('anio', e.value)} /></label>
        </div>

        <div className={`reportes-periodo ${filtros.ambiente === '00' ? 'reportes-periodo--pruebas' : ''}`}>
          <i className="pi pi-calendar" />
          <div><strong>Período exacto</strong><span>{rangoMensual(filtros.anio, filtros.mes)}</span></div>
          {filtros.ambiente && <b>{filtros.ambiente === '00' ? 'PRUEBAS' : 'PRODUCCIÓN'}</b>}
        </div>

        {reporte?.tipo === 'libro-contribuyentes' && (
          <label className="reportes-opcion">
            <Checkbox inputId="incluir-notas" checked={filtros.incluirNotasContribuyentes} onChange={(e) => cambiarFiltro('incluirNotasContribuyentes', e.checked)} />
            <span><strong>Incluir notas 05 y 06</strong><small>Desmarcado genera únicamente DTE 03.</small></span>
          </label>
        )}

        {reporte?.tipo.startsWith('anexo-') && Number(filtros.anio) >= 2025 && (
          <label className="reportes-ingreso">
            <span>Tipo de ingreso inicial (F07 desde enero de 2025) *</span>
            <Dropdown value={filtros.tipoIngresoRenta} options={TIPOS_INGRESO_RENTA} onChange={(e) => cambiarFiltro('tipoIngresoRenta', e.value)} />
          </label>
        )}

        {error && <div className="reportes-aviso reportes-aviso--error"><i className="pi pi-exclamation-circle" /><span>{error}</span></div>}

        {preview && (
          <div className="reportes-preview">
            <div className="reportes-conteos">
              {Object.entries(preview.conteos || {}).map(([clave, valor]) => <span key={clave}><b>{valor}</b>{clave}</span>)}
            </div>
            {(preview.advertencias || []).map((aviso) => <div className="reportes-aviso" key={aviso}><i className="pi pi-info-circle" /><span>{aviso}</span></div>)}

            {erroresLocales.length > 0 && (
              <div className="reportes-aviso reportes-aviso--error">
                <i className="pi pi-ban" />
                <span><strong>Corrija antes de descargar:</strong> {erroresLocales.slice(0, 6).join(' ')}</span>
              </div>
            )}

            <DataTable
              value={filas}
              paginator={filas.length > 12}
              rows={12}
              rowsPerPageOptions={[12, 25, 50]}
              scrollable
              scrollHeight="430px"
              size="small"
              emptyMessage="No hay filas para este reporte"
              className="reportes-tabla"
            >
              {(preview.columnas || []).map((columna) => (
                <Column
                  key={columna.campo}
                  field={columna.campo}
                  header={columna.etiqueta}
                  body={cuerpoCelda(columna)}
                  style={{ minWidth: columna.tipo === 'numero' ? '130px' : '180px' }}
                />
              ))}
            </DataTable>
          </div>
        )}

        {descargando && <ProgressBar value={progreso} showValue className="reportes-progreso" />}
      </Dialog>
    </section>
  );
}
