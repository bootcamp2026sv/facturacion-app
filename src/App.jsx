import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

const Acceso = lazy(() => import('./components/Acceso'));
const PanelPrincipal = lazy(() => import('./components/PanelPrincipal'));

const CargandoVista = () => (
  <div className="flex align-items-center justify-content-center min-h-screen surface-ground">
    <i className="pi pi-spin pi-spinner text-3xl text-primary" />
  </div>
);

function ContenidoApp() {
  const { usuario, cargando } = useAuth();

  if (cargando && localStorage.getItem('accessToken')) {
    return <div className="flex align-items-center justify-content-center min-h-screen surface-ground"><i className="pi pi-spin pi-spinner text-3xl text-primary" /></div>;
  }

  if (!usuario) {
    return <Suspense fallback={<CargandoVista />}><Acceso /></Suspense>;
  }

  return <Suspense fallback={<CargandoVista />}><PanelPrincipal /></Suspense>;
}

function App() {
  return (
    <AuthProvider>
      <ContenidoApp />
    </AuthProvider>
  );
}

export default App;
