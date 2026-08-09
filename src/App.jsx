import { AuthProvider, useAuth } from './context/AuthContext';
import Acceso from './components/Acceso';
import PanelPrincipal from './components/PanelPrincipal';

function ContenidoApp() {
  const { usuario, cargando } = useAuth();

  if (cargando && localStorage.getItem('accessToken')) {
    return <div className="flex align-items-center justify-content-center min-h-screen surface-ground"><i className="pi pi-spin pi-spinner text-3xl text-primary" /></div>;
  }

  if (!usuario) {
    return <Acceso />;
  }

  return <PanelPrincipal />;
}

function App() {
  return (
    <AuthProvider>
      <ContenidoApp />
    </AuthProvider>
  );
}

export default App;
