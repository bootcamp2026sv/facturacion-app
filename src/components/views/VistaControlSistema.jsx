import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';

export default function VistaControlSistema() {
  const [usuarios, setUsuarios] = useState([
    { id: 1, username: 'admin', correo: 'admin@facturacion.com', habilitado: true, rol: 'Administrador' },
    { id: 2, username: 'facturador1', correo: 'facturas@facturacion.com', habilitado: true, rol: 'Facturador' }
  ]);

  const [correlativos, setCorrelativos] = useState([
    { id: 1, tipoDte: '01 - Factura', ambiente: 'Pruebas', sucursal: 'M001', puntoVenta: 'P001', ultimo: 1000 },
    { id: 2, tipoDte: '03 - Crédito Fiscal', ambiente: 'Pruebas', sucursal: 'M001', puntoVenta: 'P001', ultimo: 254 }
  ]);

  const [nuevoUsuario, setNuevoUsuario] = useState({ username: '', correo: '', contrasena: '', rol: 'Facturador' });
  const [successUsuario, setSuccessUsuario] = useState(false);
  const [nextCorrelativoText, setNextCorrelativoText] = useState('');

  const rolesOpciones = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Facturador', value: 'Facturador' },
    { label: 'Auditor', value: 'Auditor' }
  ];

  const guardarUsuario = (e) => {
    e.preventDefault();
    if (!nuevoUsuario.username || !nuevoUsuario.correo || !nuevoUsuario.contrasena) return;
    const nuevo = {
      id: Date.now(),
      username: nuevoUsuario.username,
      correo: nuevoUsuario.correo,
      habilitado: true,
      rol: nuevoUsuario.rol
    };
    setUsuarios([...usuarios, nuevo]);
    setNuevoUsuario({ username: '', correo: '', contrasena: '', rol: 'Facturador' });
    setSuccessUsuario(true);
    setTimeout(() => setSuccessUsuario(false), 2000);
  };

  const generarSiguienteCorrelativo = (item) => {
    const nuevoValor = item.ultimo + 1;
    setCorrelativos(correlativos.map(c => c.id === item.id ? { ...c, ultimo: nuevoValor } : c));
    const controlNumber = `DTE-${item.tipoDte.substring(0, 2)}-${item.sucursal}${item.puntoVenta}-${String(nuevoValor).padStart(15, '0')}`;
    setNextCorrelativoText(`Siguiente número generado: ${controlNumber}`);
    setTimeout(() => setNextCorrelativoText(''), 8000);
  };

  return (
    <div className="p-4 premium-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold m-0" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Control y Parámetros del Sistema</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestión de correlativos DTE autorizados por Hacienda y control de accesos de personal.</p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs">
          
          <TabPanel header="Correlativos DTE" leftIcon="pi pi-hashtag" headerClassName="mr-2">
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>Rangos Autorizados</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Haga clic en "Generar Siguiente" para simular la petición de la API tributaria.</p>
              </div>

              {nextCorrelativoText && (
                <Message severity="info" text={nextCorrelativoText} className="mb-3 w-full font-monospace text-sm" />
              )}

              <div className="premium-table">
                <DataTable value={correlativos} size="small" emptyMessage="No hay correlativos configurados">
                  <Column field="tipoDte" header="Tipo DTE" className="font-bold"></Column>
                  <Column field="ambiente" header="Ambiente"></Column>
                  <Column field="sucursal" header="Sucursal"></Column>
                  <Column field="puntoVenta" header="Punto de Venta"></Column>
                  <Column field="ultimo" header="Último Correlativo Usado" body={(f) => String(f.ultimo).padStart(15, '0')} className="font-monospace text-sm"></Column>
                  <Column header="Acciones" body={(fila) => (
                    <Button 
                      label="Generar Siguiente" 
                      icon="pi pi-cog" 
                      className="p-button-sm p-button-outlined premium-btn-secondary" 
                      onClick={() => generarSiguienteCorrelativo(fila)}
                    />
                  )}></Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Gestión de Usuarios" leftIcon="pi pi-users">
            <div className="grid pt-3">
              
              <div className="col-12 md:col-4">
                <div className="premium-card-static">
                  <div className="p-card p-component">
                    <div className="p-card-title" style={{ padding: '1.25rem 1.25rem 0' }}>Nuevo Usuario</div>
                    <div className="p-card-content" style={{ padding: '1.25rem' }}>
                      <div className="p-fluid">
                        {successUsuario && (
                          <Message severity="success" text="Usuario registrado exitosamente." className="mb-3 w-full" />
                        )}
                        <form onSubmit={guardarUsuario} className="flex flex-column gap-3">
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Nombre de Usuario</label>
                            <div className="premium-input-group">
                              <i className="pi pi-user premium-input-icon"></i>
                              <InputText value={nuevoUsuario.username} onChange={(e) => setNuevoUsuario({...nuevoUsuario, username: e.target.value})} placeholder="Ej. jperez" required />
                            </div>
                          </div>
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Correo Electrónico</label>
                            <div className="premium-input-group">
                              <i className="pi pi-envelope premium-input-icon"></i>
                              <InputText type="email" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario({...nuevoUsuario, correo: e.target.value})} placeholder="jperez@correo.com" required />
                            </div>
                          </div>
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Contraseña</label>
                            <div className="premium-input-group">
                              <i className="pi pi-lock premium-input-icon"></i>
                              <InputText type="password" value={nuevoUsuario.contrasena} onChange={(e) => setNuevoUsuario({...nuevoUsuario, contrasena: e.target.value})} placeholder="Ingrese contraseña..." required />
                            </div>
                          </div>
                          <div className="flex flex-column gap-1">
                            <label className="premium-label">Rol asignado</label>
                            <div className="premium-input-group">
                              <i className="pi pi-shield premium-input-icon"></i>
                              <Dropdown value={nuevoUsuario.rol} options={rolesOpciones} onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.value})} />
                            </div>
                          </div>
                          <Button type="submit" label="Registrar Cuenta" icon="pi pi-user-plus" className="premium-btn mt-1" />
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="premium-table">
                  <DataTable value={usuarios} size="small" emptyMessage="No hay usuarios registrados">
                    <Column field="username" header="Usuario" className="font-bold"></Column>
                    <Column field="correo" header="Correo Electrónico"></Column>
                    <Column field="rol" header="Rol"></Column>
                    <Column field="habilitado" header="Estado" body={(f) => <Tag severity={f.habilitado ? "success" : "danger"} value={f.habilitado ? 'Activo' : 'Inactivo'} className="premium-tag"></Tag>}></Column>
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