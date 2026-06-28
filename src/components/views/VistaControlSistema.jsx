import React, { useState, useEffect } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import api from '../../services/api';

export default function VistaControlSistema() {
  // Datos de prueba
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombreUsuario: 'admin', correo: 'admin@facturacion.com', habilitado: true, rol: 'Administrador' },
    { id: 2, nombreUsuario: 'facturador1', correo: 'facturas@facturacion.com', habilitado: true, rol: 'Facturador' }
  ]);

  const [correlativos, setCorrelativos] = useState([
    { id: 1, tipoDte: '01 - Factura', ambiente: 'Pruebas', sucursal: 'M001', puntoVenta: 'P001', ultimo: 1000 },
    { id: 2, tipoDte: '03 - Crédito Fiscal', ambiente: 'Pruebas', sucursal: 'M001', puntoVenta: 'P001', ultimo: 254 }
  ]);

  // Estado del formulario
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombreUsuario: '', correo: '', contrasena: '', rol: 'Facturador' });
  const [successUsuario, setSuccessUsuario] = useState(false);
  const [nextCorrelativoText, setNextCorrelativoText] = useState('');

  const rolesOpciones = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Facturador', value: 'Facturador' },
    { label: 'Auditor', value: 'Auditor' }
  ];

  // Descomentar para conectar con la API
  /*
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const respuesta = await api.get('/usuarios');
        const listaUsuarios = (respuesta.data || []).map(u => ({
          id: u.id,
          nombreUsuario: u.nombreUsuario || u.username,
          correo: u.correo,
          habilitado: u.habilitado !== undefined ? u.habilitado : true,
          rol: u.roles && u.roles[0] ? u.roles[0].nombre : 'Facturador'
        }));
        setUsuarios(listaUsuarios);
      } catch (error) {
        console.error("Error al cargar usuarios de la API:", error);
      }
    };
    cargarUsuarios();
  }, []);
  */

  const guardarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.nombreUsuario || !nuevoUsuario.correo || !nuevoUsuario.contrasena) return;

    // Descomentar para guardar en la API
    /*
    try {
      const payload = {
        nombreUsuario: nuevoUsuario.nombreUsuario,
        correo: nuevoUsuario.correo,
        contrasena: nuevoUsuario.contrasena,
        habilitado: true
      };
      const respuesta = await api.post('/usuarios', payload);
      const usuarioCreado = respuesta.data;
      
      setUsuarios(prev => [...prev, {
        id: usuarioCreado.id,
        nombreUsuario: usuarioCreado.nombreUsuario,
        correo: usuarioCreado.correo,
        habilitado: usuarioCreado.habilitado !== undefined ? usuarioCreado.habilitado : true,
        rol: nuevoUsuario.rol
      }]);
      setNuevoUsuario({ nombreUsuario: '', correo: '', contrasena: '', rol: 'Facturador' });
      setSuccessUsuario(true);
      setTimeout(() => setSuccessUsuario(false), 2000);
      return;
    } catch (error) {
      console.error("Error al guardar usuario en la API:", error);
      return;
    }
    */

    // Simulación local (comentar al conectar API)
    const nuevo = {
      id: Date.now(),
      nombreUsuario: nuevoUsuario.nombreUsuario,
      correo: nuevoUsuario.correo,
      habilitado: true,
      rol: nuevoUsuario.rol
    };
    setUsuarios([...usuarios, nuevo]);
    setNuevoUsuario({ nombreUsuario: '', correo: '', contrasena: '', rol: 'Facturador' });
    setSuccessUsuario(true);
    setTimeout(() => setSuccessUsuario(false), 2000);
  };

  const generarSiguienteCorrelativo = async (item) => {
    // Descomentar para conectar con la API
    /*
    try {
      const params = {
        tipoDte: item.tipoDte.substring(0, 2),
        ambiente: item.ambiente === 'Pruebas' ? '00' : '01',
        codEstable: item.sucursal,
        codPuntoVenta: item.puntoVenta
      };
      
      const respuesta = await api.get('/auth/correlativos/siguiente', { params });
      const siguienteNumero = respuesta.data.siguiente || respuesta.data;
      
      setNextCorrelativoText(`Siguiente número generado por la API: ${siguienteNumero}`);
      
      const match = siguienteNumero.match(/-(\d+)$/);
      if (match) {
        const nuevoValor = parseInt(match[1], 10);
        setCorrelativos(correlativos.map(c => c.id === item.id ? { ...c, ultimo: nuevoValor } : c));
      }
      setTimeout(() => setNextCorrelativoText(''), 8000);
      return;
    } catch (error) {
      console.error("Error al obtener correlativo de la API:", error);
      return;
    }
    */

    // Simulación local (comentar al conectar API)
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
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Gestión de correlativos DTE autorizados y control de accesos.</p>
      </div>

      <div className="premium-surface-card">
        <TabView className="premium-tabs">
          
          <TabPanel header="Correlativos DTE" leftIcon="pi pi-hashtag" headerClassName="mr-2">
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>Rangos Autorizados</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Haga clic en "Generar Siguiente" para calcular el correlativo.</p>
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
                              <InputText value={nuevoUsuario.nombreUsuario} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombreUsuario: e.target.value})} placeholder="Ej. jperez" required />
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
                    <Column field="nombreUsuario" header="Usuario" className="font-bold"></Column>
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