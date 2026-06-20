import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';

export default function VistaComercios() {
  const [sucursales, setSucursales] = useState([
    { id: 1, codEstable: 'M001', codPuntoVenta: 'P001', nombre: 'Casa Matriz - San Salvador', tipo: 'Matriz', telefono: '2200-0000', direccion: 'Paseo Gral Escalón #3500' },
    { id: 2, codEstable: 'S001', codPuntoVenta: 'P001', nombre: 'Sucursal 1 - Santa Tecla', tipo: 'Sucursal', telefono: '2233-1111', direccion: 'Avenida Manuel Enrique Araujo' }
  ]);

  const [datosComercio, setDatosComercio] = useState({
    nombre: 'BOOTCAMP FACTURACION S.A. DE C.V.',
    nombreComercial: 'FacturaPro',
    nit: '0614-121285-101-5',
    nrc: '123456-7',
    correo: 'administracion@facturapro.com',
    codEstableMH: 'M001',
    codPuntoVentaMH: 'P001',
    actividadEconomicaId: 1
  });

  const [nuevaSucursal, setNuevaSucursal] = useState({
    codEstable: '',
    codPuntoVenta: '',
    nombre: '',
    tipo: 'Sucursal',
    telefono: '',
    direccion: ''
  });

  const [indiceTabActivo, setIndiceTabActivo] = useState(0);
  const [successComercio, setSuccessComercio] = useState(false);
  const [successSucursal, setSuccessSucursal] = useState(false);

  const tiposOpciones = [
    { label: 'Casa Matriz', value: 'Matriz' },
    { label: 'Sucursal', value: 'Sucursal' }
  ];

  const guardarComercio = (e) => {
    e.preventDefault();
    setSuccessComercio(true);
    setTimeout(() => setSuccessComercio(false), 3000);
  };

  const guardarSucursal = (e) => {
    e.preventDefault();
    if (!nuevaSucursal.codEstable || !nuevaSucursal.nombre) return;
    const nueva = {
      id: Date.now(),
      ...nuevaSucursal
    };
    setSucursales([...sucursales, nueva]);
    setNuevaSucursal({ codEstable: '', codPuntoVenta: '', nombre: '', tipo: 'Sucursal', telefono: '', direccion: '' });
    setSuccessSucursal(true);
    setTimeout(() => setSuccessSucursal(false), 2000);
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Configuración de Comercio Emisor</h2>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Mantenimiento de credenciales tributarias y sucursales ante el Ministerio de Hacienda.</p>
        </div>
        
        <div className="flex align-items-center gap-2">
          <Tag severity="danger" value="PUT" className="premium-tag" />
          <code className="text-sm" style={{ color: '#64748b' }}>/api/v1/Comercios/{'{id}'}</code>
        </div>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs" activeIndex={indiceTabActivo} onTabChange={(e) => setIndiceTabActivo(e.index)}>
          
          <TabPanel header="Comercio Emisor" leftIcon="pi pi-briefcase" headerClassName="mr-2">
            <div className="p-fluid pt-2 w-full md:w-9">
              {successComercio && (
                <Message severity="success" text="Datos del comercio emisor actualizados correctamente." className="mb-3 w-full" />
              )}
              
              <form onSubmit={guardarComercio} className="flex flex-column gap-4">
                <div className="flex flex-column md:flex-row gap-3">
                  <div className="flex-1 flex flex-column gap-2">
                    <label className="font-bold text-sm text-900">Razón Social</label>
                    <div className="premium-input-group">
                      <i className="pi pi-building premium-input-icon"></i>
                      <InputText value={datosComercio.nombre} onChange={(e) => setDatosComercio({...datosComercio, nombre: e.target.value})} required />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-column gap-2">
                    <label className="font-bold text-sm text-900">Nombre Comercial</label>
                    <div className="premium-input-group">
                      <i className="pi pi-tag premium-input-icon"></i>
                      <InputText value={datosComercio.nombreComercial} onChange={(e) => setDatosComercio({...datosComercio, nombreComercial: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-column md:flex-row gap-3">
                  <div className="flex-1 flex flex-column gap-2">
                    <label className="font-bold text-sm text-900">NIT</label>
                    <div className="premium-input-group">
                      <i className="pi pi-id-card premium-input-icon"></i>
                      <InputText value={datosComercio.nit} onChange={(e) => setDatosComercio({...datosComercio, nit: e.target.value})} required />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-column gap-2">
                    <label className="font-bold text-sm text-900">NRC</label>
                    <div className="premium-input-group">
                      <i className="pi pi-file premium-input-icon"></i>
                      <InputText value={datosComercio.nrc} onChange={(e) => setDatosComercio({...datosComercio, nrc: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <div className="flex flex-column md:flex-row gap-3">
                  <div className="flex-1 flex flex-column gap-2">
                    <label className="font-bold text-sm text-900">Código Establecimiento MH</label>
                    <div className="premium-input-group">
                      <i className="pi pi-map-marker premium-input-icon"></i>
                      <InputText value={datosComercio.codEstableMH} onChange={(e) => setDatosComercio({...datosComercio, codEstableMH: e.target.value})} required />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-column gap-2">
                    <label className="font-bold text-sm text-900">Código Punto Venta MH</label>
                    <div className="premium-input-group">
                      <i className="pi pi-qrcode premium-input-icon"></i>
                      <InputText value={datosComercio.codPuntoVentaMH} onChange={(e) => setDatosComercio({...datosComercio, codPuntoVentaMH: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <Button type="submit" label="Guardar Configuración" icon="pi pi-save" className="premium-btn w-13rem" />
              </form>
            </div>
          </TabPanel>

          <TabPanel header="Sucursales / Establecimientos" leftIcon="pi pi-map-marker">
            <div className="grid pt-3">
              
              <div className="col-12 md:col-5">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Añadir Establecimiento</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <div className="p-fluid">
                        {successSucursal && (
                          <Message severity="success" text="Sucursal agregada exitosamente." className="mb-3 w-full" />
                        )}
                        <form onSubmit={guardarSucursal} className="flex flex-column gap-3">
                          <div className="flex flex-column md:flex-row gap-2">
                            <div className="flex-1 flex flex-column gap-1">
                              <label className="premium-label">Cod. Establecimiento</label>
                              <div className="premium-input-group">
                                <i className="pi pi-building premium-input-icon" style={{ fontSize: '0.8rem' }}></i>
                                <InputText value={nuevaSucursal.codEstable} onChange={(e) => setNuevaSucursal({...nuevaSucursal, codEstable: e.target.value})} placeholder="S002" required />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-column gap-1">
                              <label className="premium-label">Cod. Punto Venta</label>
                              <div className="premium-input-group">
                                <i className="pi pi-qrcode premium-input-icon" style={{ fontSize: '0.8rem' }}></i>
                                <InputText value={nuevaSucursal.codPuntoVenta} onChange={(e) => setNuevaSucursal({...nuevaSucursal, codPuntoVenta: e.target.value})} placeholder="P002" required />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Nombre Sucursal</label>
                            <div className="premium-input-group">
                              <i className="pi pi-map-marker premium-input-icon"></i>
                              <InputText value={nuevaSucursal.nombre} onChange={(e) => setNuevaSucursal({...nuevaSucursal, nombre: e.target.value})} placeholder="Sucursal 2 - San Miguel" required />
                            </div>
                          </div>

                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Tipo</label>
                            <div className="premium-input-group">
                              <i className="pi pi-sitemap premium-input-icon"></i>
                              <Dropdown value={nuevaSucursal.tipo} options={tiposOpciones} onChange={(e) => setNuevaSucursal({...nuevaSucursal, tipo: e.value})} />
                            </div>
                          </div>

                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Dirección Sucursal</label>
                            <div className="premium-input-group">
                              <i className="pi pi-chevron-circle-right premium-input-icon"></i>
                              <InputText value={nuevaSucursal.direccion} onChange={(e) => setNuevaSucursal({...nuevaSucursal, direccion: e.target.value})} placeholder="Av. Roosevelt Sur #45" />
                            </div>
                          </div>

                          <Button type="submit" label="Registrar Sucursal" icon="pi pi-plus" className="premium-btn mt-1" />
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-7">
                <div className="premium-table">
                  <DataTable value={sucursales} size="small" emptyMessage="No hay sucursales registradas" responsiveLayout="scroll">
                    <Column field="codEstable" header="Cod. Estable" className="font-bold"></Column>
                    <Column field="codPuntoVenta" header="Cod. PV"></Column>
                    <Column field="nombre" header="Nombre"></Column>
                    <Column field="tipo" header="Tipo"></Column>
                    <Column field="telefono" header="Teléfono"></Column>
                    <Column field="direccion" header="Dirección"></Column>
                  </DataTable>
                </div>
              </div>

            </div>
          </TabPanel>

        </TabView>
      </div>
    </div>
  );
}