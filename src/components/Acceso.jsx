import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '../context/AuthContext';

export default function Acceso() {
  const [usuario, setUsuario] = useState('admin');
  const [clave, setClave] = useState('admin123');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login, motivoCierreSesion, limpiarMotivoCierre } = useAuth();

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!usuario || !clave) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setCargando(true);
    setError('');
    if (motivoCierreSesion) limpiarMotivoCierre();

    try {
      await login(usuario, clave);
    } catch (err) {
      console.error('Error de login:', err);
      if (err.response) {
        const status = err.response.status;
        let apiMessage = err.response.data?.message || err.response.data?.error || '';

        // Mapear errores comunes de backend en inglés a español
        if (apiMessage.toLowerCase() === 'bad credentials') {
          setError('Usuario o contraseña incorrectos.');
        } else if (apiMessage.toLowerCase() === 'user is disabled' || apiMessage.toLowerCase() === 'user disabled') {
          setError('Este usuario se encuentra deshabilitado.');
        } else if (status === 401) {
          setError('Usuario o contraseña incorrectos.');
        } else if (status === 403) {
          setError('No tiene autorización para acceder.');
        } else {
          setError(apiMessage || 'Error al validar credenciales con el servidor.');
        }
      } else if (err.request) {
        setError('No se pudo establecer comunicación con el servidor. Intente de nuevo más tarde.');
      } else {
        setError('Ocurrió un error inesperado al intentar iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen premium-login-bg p-3">
      <div className="premium-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <Card className="shadow-4 border-none premium-card">
          <div className="text-center mb-4 pt-3">
            <div className="inline-flex align-items-center justify-content-center premium-icon-circle mb-3" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <i className="pi pi-lock-open text-white text-xl"></i>
            </div>
            <h2 className="font-bold text-3xl mb-1 premium-page-header" style={{ background: 'linear-gradient(135deg, var(--text-primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BOOTCAMP 2026</h2>
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Sistema de Facturación</p>
          </div>

          <form onSubmit={manejarEnvio} className="flex flex-column gap-4 p-fluid">
            {error && (
              <Message severity="error" text={error} className="mb-2" />
            )}

            {motivoCierreSesion === 'inactividad' && (
              <Message 
                severity="warn" 
                text="Su sesión ha expirado por inactividad. Inicie sesión nuevamente." 
                className="mb-2" 
              />
            )}

            <div className="flex flex-column gap-2">
              <label htmlFor="usuario" className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Usuario o Correo</label>
              <div className="premium-input-group">
                <i className="pi pi-user premium-input-icon"></i>
                <InputText 
                  id="usuario" 
                  value={usuario} 
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    if (motivoCierreSesion) limpiarMotivoCierre();
                  }} 
                  placeholder="Ingrese su usuario o correo" 
                  className="w-full"
                  disabled={cargando}
                  required 
                />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label htmlFor="clave" className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Contraseña</label>
              <div className="premium-input-group">
                <i className="pi pi-lock premium-input-icon"></i>
                <Password 
                  id="clave" 
                  value={clave} 
                  onChange={(e) => {
                    setClave(e.target.value);
                    if (motivoCierreSesion) limpiarMotivoCierre();
                  }} 
                  placeholder="Ingrese su contraseña" 
                  feedback={false}
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                  disabled={cargando}
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              label={cargando ? "Iniciando sesión..." : "Ingresar al Sistema"} 
              icon="pi pi-sign-in" 
              loading={cargando}
              className="premium-btn mt-2"
              disabled={cargando}
            />
          </form>

            <div className="mt-4 p-3 border-round-xl flex align-items-start gap-2 text-sm border-left-3" style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--text-secondary)', borderColor: 'var(--card-hover-border)' }}>
              <i className="pi pi-info-circle mt-1 flex-shrink-0" style={{ color: '#6366f1' }}></i>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Credenciales por Defecto:</strong> Utilice <code style={{color: '#6366f1'}}>admin</code> y contraseña <code style={{color: '#6366f1'}}>admin123</code> para conectarse al servicio local.
              </div>
            </div>
        </Card>
      </div>
    </div>
  );
}