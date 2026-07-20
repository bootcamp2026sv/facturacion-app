import { useCallback, useRef, useState } from 'react';
import { parsearMontoPago } from '../reglasPuntoVenta.js';

// Guarda los campos que se escriben durante la confirmación del pago.
export function usePagoPuntoVenta() {
  const [efectivoRecibido, setEfectivoRecibido] = useState(null);
  const [efectivoRecibidoTexto, setEfectivoRecibidoTexto] = useState('');
  const [plazoValor, setPlazoValor] = useState(1);
  const [plazoTipo, setPlazoTipo] = useState('meses');
  const [referenciaPago, setReferenciaPago] = useState('');
  const efectivoRecibidoRef = useRef(null);

  // Limpia y limita el texto del efectivo antes de convertirlo a número.
  const actualizarEfectivoRecibido = useCallback((valor) => {
    const limpio = String(valor ?? '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    const texto = partes.length > 1
      ? `${partes[0]}.${partes.slice(1).join('').slice(0, 2)}`
      : limpio;

    setEfectivoRecibidoTexto(texto);
    setEfectivoRecibido(parsearMontoPago(texto));
  }, []);

  // Se usa al abrir una nueva confirmación de pago.
  const reiniciarDatosPago = useCallback(() => {
    setEfectivoRecibido(null);
    setEfectivoRecibidoTexto('');
    setPlazoValor(1);
    setPlazoTipo('meses');
    setReferenciaPago('');
  }, []);

  return {
    efectivoRecibido,
    efectivoRecibidoTexto,
    efectivoRecibidoRef,
    plazoValor,
    plazoTipo,
    referenciaPago,
    setPlazoValor,
    setPlazoTipo,
    setReferenciaPago,
    actualizarEfectivoRecibido,
    reiniciarDatosPago,
  };
}
