import { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import api from '../../services/api';

const ENDPOINTS = {
  tiposItem: '/tipos-transporte',
  recintos: '/recintos-fiscales',
  tiposRegimen: '/tipos-regimen',
  regimenes: '/regimenes',
  paises: '/paises',
  tiposPersona: '/tipos-persona',
  incoterms: '/incoterms',
};

const normalizarCatalogo = (respuesta, numerico = false) => (Array.isArray(respuesta?.data) ? respuesta.data : [])
  .map((registro) => ({
    label: `${registro.codigo} - ${registro.descripcion}`,
    value: numerico ? Number(registro.codigo) : String(registro.codigo),
    codigo: registro.codigo,
    descripcion: registro.descripcion,
  }));

const Campo = ({ label, children, obligatorio = true }) => (
  <div className="col-12 md:col-6 flex flex-column gap-1">
    <label className="premium-label">
      {label} {obligatorio && <span style={{ color: '#f43f5e' }}>*</span>}
    </label>
    {children}
  </div>
);

export default function FormularioExportacionDte11({ cliente, value, onChange, disabled = false }) {
  const [catalogos, setCatalogos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const dropdownRefs = useRef({});

  const cerrarRegimenAlDesplazar = (evento) => {
    if (evento?.target?.closest?.('.p-dropdown-panel')) return;
    Object.values(dropdownRefs.current).forEach((dropdown) => dropdown?.hide?.());
  };

  useEffect(() => {
    window.addEventListener('scroll', cerrarRegimenAlDesplazar, true);
    return () => window.removeEventListener('scroll', cerrarRegimenAlDesplazar, true);
  }, []);

  const refDropdown = (nombre) => (elemento) => {
    dropdownRefs.current[nombre] = elemento;
  };

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError('');

    Promise.all(Object.entries(ENDPOINTS).map(async ([clave, endpoint]) => {
      const numerico = clave === 'tiposItem' || clave === 'tiposPersona';
      const respuesta = await api.get(endpoint, { signal: controller.signal });
      return [clave, normalizarCatalogo(respuesta, numerico)];
    }))
      .then((entradas) => setCatalogos(Object.fromEntries(entradas)))
      .catch((e) => {
        if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
          setError(e.response?.data?.message || 'No se pudieron cargar los catálogos de exportación.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, []);

  const direccion = useMemo(() => cliente?.direccion?.complemento || '', [cliente]);
  const faltantesCliente = useMemo(() => [
    !cliente?.nombre && 'nombre',
    !cliente?.correo && 'correo',
    !cliente?.telefono && 'teléfono',
    !direccion && 'dirección',
  ].filter(Boolean), [cliente, direccion]);

  const actualizar = (campo, nuevoValor) => onChange({ ...value, [campo]: nuevoValor });
  const seleccionar = (campo, catalogo, evento) => {
    const valor = evento?.value?.value ?? evento?.value;
    const seleccionado = (catalogos[catalogo] || []).find((opcion) => String(opcion.value) === String(valor));
    const descripcionCampo = {
      codPais: 'nombrePais',
      codIncoterms: 'descIncoterms',
      tipoItemExpor: 'tipoItemExporDescripcion',
      recintoFiscal: 'recintoFiscalDescripcion',
      tipoRegimen: 'tipoRegimenDescripcion',
      regimen: 'regimenDescripcion',
      tipoPersona: 'tipoPersonaDescripcion',
    }[campo];
    onChange({
      ...value,
      [campo]: valor,
      ...(descripcionCampo ? { [descripcionCampo]: seleccionado?.descripcion || '' } : {}),
    });
  };

  return (
    <div className="flex flex-column gap-3 p-3 border-round-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="flex align-items-start gap-3">
        <div className="flex align-items-center justify-content-center border-circle" style={{ width: 42, height: 42, minWidth: 42, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          <i className="pi pi-globe text-white" />
        </div>
        <div>
          <p className="font-bold m-0" style={{ color: 'var(--text-primary)' }}>Datos de exportación</p>
          <p className="text-xs m-0 mt-1" style={{ color: 'var(--text-muted)' }}>Completa los catálogos que formarán el JSON del DTE-11.</p>
        </div>
      </div>

      <div className="p-3 border-round-lg" style={{ background: 'var(--surface-muted)', border: '1px solid var(--surface-border-light)' }}>
        <div className="flex align-items-center gap-2 mb-2">
          <i className="pi pi-user" style={{ color: '#6366f1' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Receptor de exportación</span>
        </div>
        <div className="grid m-0">
          {[
            ['Nombre', cliente?.nombre || 'No registrado', !cliente?.nombre],
            ['Correo', cliente?.correo || 'No registrado', !cliente?.correo],
            ['Teléfono', cliente?.telefono || 'No registrado', !cliente?.telefono],
            ['Dirección', direccion || 'No registrada', !direccion],
          ].map(([label, texto, falta]) => (
            <div key={label} className="col-12 md:col-6 p-1 flex align-items-center gap-2 text-xs" style={{ color: falta ? '#f43f5e' : 'var(--text-muted)' }}>
              <i className={`pi ${falta ? 'pi-exclamation-circle' : 'pi-check-circle'}`} />
              <span><strong>{label}:</strong> {texto}</span>
            </div>
          ))}
        </div>
        {faltantesCliente.length > 0 && <small style={{ color: '#f43f5e' }}>Completa en el registro del cliente: {faltantesCliente.join(', ')}.</small>}
      </div>

      {error && <div className="p-2 border-round-lg text-xs" style={{ color: '#b42318', background: 'rgba(244,63,94,0.1)' }}><i className="pi pi-exclamation-circle mr-2" />{error}</div>}

      <div className="grid m-0">
        <Campo label="País de destino">
          <Dropdown ref={refDropdown('pais')} value={value.codPais || null} options={catalogos.paises || []} onChange={(e) => seleccionar('codPais', 'paises', e)} placeholder="Seleccione el país" filter showClear disabled={disabled || cargando} className="w-full" />
        </Campo>
        <Campo label="Tipo de persona">
          <Dropdown ref={refDropdown('tipoPersona')} value={value.tipoPersona ?? null} options={catalogos.tiposPersona || []} onChange={(e) => seleccionar('tipoPersona', 'tiposPersona', e)} placeholder="Seleccione el tipo" disabled={disabled || cargando} className="w-full" />
        </Campo>
        <Campo label="Tipo de exportación">
          <Dropdown ref={refDropdown('tipoItem')} value={value.tipoItemExpor ?? null} options={catalogos.tiposItem || []} onChange={(e) => seleccionar('tipoItemExpor', 'tiposItem', e)} placeholder="Seleccione el medio" disabled={disabled || cargando} className="w-full" />
        </Campo>
        <Campo label="Recinto fiscal">
          <Dropdown ref={refDropdown('recinto')} value={value.recintoFiscal || null} options={catalogos.recintos || []} onChange={(e) => seleccionar('recintoFiscal', 'recintos', e)} placeholder="Seleccione el recinto" filter disabled={disabled || cargando} className="w-full" />
        </Campo>
        <Campo label="Tipo de régimen">
          <Dropdown ref={refDropdown('tipoRegimen')} value={value.tipoRegimen || null} options={catalogos.tiposRegimen || []} onChange={(e) => seleccionar('tipoRegimen', 'tiposRegimen', e)} placeholder="Seleccione el tipo" filter disabled={disabled || cargando} className="w-full" />
        </Campo>
        <Campo label="Régimen aduanero">
          <div className="exportacion-regimen-dropdown">
            <Dropdown
              ref={refDropdown('regimen')}
              value={value.regimen || null}
              options={catalogos.regimenes || []}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => seleccionar('regimen', 'regimenes', e)}
              placeholder="Seleccione el régimen aduanero"
              filter
              filterBy="label"
              filterPlaceholder="Buscar por código o descripción"
              showClear
              filterInputAutoFocus
              panelClassName="exportacion-regimen-panel"
              disabled={disabled || cargando}
              className="w-full"
            />
            <small>Busca por código, por ejemplo <strong>1000.000</strong>, o por descripción.</small>
          </div>
        </Campo>
        <Campo label="Incoterm">
          <Dropdown ref={refDropdown('incoterm')} value={value.codIncoterms || null} options={catalogos.incoterms || []} onChange={(e) => seleccionar('codIncoterms', 'incoterms', e)} placeholder="Seleccione el Incoterm" disabled={disabled || cargando} className="w-full" />
        </Campo>
        <Campo label="Dirección / complemento del receptor">
          <InputText value={value.complemento ?? direccion} onChange={(e) => actualizar('complemento', e.target.value)} placeholder="Dirección del cliente" disabled={disabled} className="w-full" />
        </Campo>
      </div>

      <div className="exportacion-costos">
        <div className="exportacion-costos__cabecera">
          <div>
            <span className="exportacion-dialogo__kicker">COSTOS DE LOGÍSTICA</span>
            <strong>Agrega los cargos que forman parte de la exportación</strong>
          </div>
          <span className="exportacion-costos__moneda">USD</span>
        </div>
        <div className="grid m-0">
          <div className="col-12 md:col-6 p-1">
            <label className="premium-label">Flete</label>
            <InputNumber
              value={Number(value.flete) || 0}
              onValueChange={(e) => actualizar('flete', Math.max(Number(e.value) || 0, 0))}
              mode="currency"
              currency="USD"
              locale="en-US"
              min={0}
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={disabled}
              className="w-full"
              inputClassName="w-full"
              placeholder="$0.00"
            />
          </div>
          <div className="col-12 md:col-6 p-1">
            <label className="premium-label">Seguro</label>
            <InputNumber
              value={Number(value.seguro) || 0}
              onValueChange={(e) => actualizar('seguro', Math.max(Number(e.value) || 0, 0))}
              mode="currency"
              currency="USD"
              locale="en-US"
              min={0}
              minFractionDigits={2}
              maxFractionDigits={2}
              disabled={disabled}
              className="w-full"
              inputClassName="w-full"
              placeholder="$0.00"
            />
          </div>
        </div>
        <small>Estos valores se sumarán al total a cobrar y aparecerán en el resumen del DTE-11.</small>
      </div>
    </div>
  );
}
