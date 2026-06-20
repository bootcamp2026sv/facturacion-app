/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('tema', tema);
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de ThemeProvider');
  return ctx;
}
