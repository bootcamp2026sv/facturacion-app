import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { useAuth } from '../context/AuthContext';
import { resolverUrlMedia } from '../utils/media';
import { obtenerMarcaComercio } from '../utils/marcaComercio';
import './Acceso.css';

export default function Acceso() {
  const [marca] = useState(() => obtenerMarcaComercio());
  const [logoDisponible, setLogoDisponible] = useState(() => Boolean(marca?.logoUrl));
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login, motivoCierreSesion, limpiarMotivoCierre } = useAuth();
  const nombreComercio = marca?.nombre || '';
  const logoUrl = logoDisponible ? resolverUrlMedia(marca?.logoUrl) : null;

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
    <main className="acceso-shell premium-login-bg">
      <div className="acceso-contenedor premium-fade-in">
        <section className="acceso-presentacion" aria-label="Identidad del sistema">
          <div className="acceso-presentacion__identidad">
            <div className="acceso-marca">
              <div className={`acceso-logo ${logoUrl ? 'acceso-logo--comercio' : ''}`}>
                {logoUrl ? (
                  <img src={logoUrl} alt={`Logo de ${nombreComercio}`} onError={() => setLogoDisponible(false)} />
                ) : (
                  <i className="pi pi-bolt text-2xl" aria-hidden="true"></i>
                )}
              </div>
              <div className="acceso-marca__texto">
                {nombreComercio && <strong>{nombreComercio}</strong>}
                <span>Facturación Electrónica</span>
              </div>
            </div>
          </div>
        </section>

        <section className="acceso-formulario" aria-labelledby="acceso-titulo">
          <div className="acceso-formulario__contenido">
            <header className="acceso-formulario__encabezado">
              <span className="acceso-formulario__eyebrow">Acceso</span>
              <h2 id="acceso-titulo">Iniciar sesión</h2>
              <p>Ingresa tus credenciales.</p>
            </header>

            <form onSubmit={manejarEnvio} className="acceso-formulario__form">
              {error && (
                <div className="acceso-formulario__alerta" role="alert">
                  <i className="pi pi-exclamation-circle" aria-hidden="true"></i>
                  <span>{error}</span>
                </div>
              )}

              {motivoCierreSesion === 'inactividad' && (
                <div className="acceso-formulario__alerta acceso-formulario__alerta--aviso" role="status">
                  <i className="pi pi-clock" aria-hidden="true"></i>
                  <span>Su sesión expiró por inactividad. Inicie sesión nuevamente.</span>
                </div>
              )}

              <div className="acceso-formulario__campo">
                <label htmlFor="usuario">Usuario o correo</label>
                <div className="premium-input-group">
                  <i className="pi pi-user premium-input-icon" aria-hidden="true"></i>
                  <InputText
                    id="usuario"
                    value={usuario}
                    onChange={(e) => {
                      setUsuario(e.target.value);
                      if (motivoCierreSesion) limpiarMotivoCierre();
                    }}
                    placeholder="Ingrese su usuario o correo"
                    autoComplete="username"
                    className="w-full"
                    disabled={cargando}
                    required
                  />
                </div>
              </div>

              <div className="acceso-formulario__campo">
                <label htmlFor="clave">Contraseña</label>
                <div className="premium-input-group">
                  <i className="pi pi-lock premium-input-icon" aria-hidden="true"></i>
                  <Password
                    id="clave"
                    value={clave}
                    onChange={(e) => {
                      setClave(e.target.value);
                      if (motivoCierreSesion) limpiarMotivoCierre();
                    }}
                    placeholder="Ingrese su contraseña"
                    autoComplete="current-password"
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
                label={cargando ? 'Iniciando sesión...' : 'Ingresar al sistema'}
                icon="pi pi-arrow-right"
                iconPos="right"
                loading={cargando}
                className="acceso-formulario__submit w-full"
                disabled={cargando}
              />
            </form>

          </div>
        </section>
      </div>
    </main>
  );
}
