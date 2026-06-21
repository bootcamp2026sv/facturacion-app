import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Acceso from './components/Acceso';
import PanelPrincipal from './components/PanelPrincipal';

function ContenidoApp() {
  const { usuario } = useAuth();

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
