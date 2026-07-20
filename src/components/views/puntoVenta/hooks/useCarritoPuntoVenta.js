import { useState } from 'react';
import {
  obtenerPrecioParaDte,
  TASA_IVA,
} from '../reglasPuntoVenta.js';
import {
  obtenerPrecioUnitarioMostrado,
  redondearMoneda as redondear,
} from '../../../../utils/calculosVenta.js';

// Mantiene el carrito y el producto que se está editando.
export function useCarritoPuntoVenta({ tipoDte, documentoSinIva }) {
  const [carrito, setCarrito] = useState([]);
  const [dialogoItem, setDialogoItem] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [precioIncluyeIva, setPrecioIncluyeIva] = useState(false);

  // Los productos normales entran directamente; los personalizables abren el diálogo.
  const seleccionarItem = (producto) => {
    if (!producto.lineaLibre) {
      setCarrito((actual) => {
        const existente = actual.find((item) => item.id === producto.id);
        if (existente) {
          return actual.map((item) => item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item);
        }

        return [...actual, {
          ...producto,
          _key: Date.now() + Math.random(),
          cantidad: 1,
          descuentoTipo: 'porcentaje',
          descuentoValor: 0,
        }];
      });
      return;
    }

    setItemEditando({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precio,
      precioConIVA: producto.precioConIVA,
      precioLiteralSinIva: obtenerPrecioParaDte(producto, tipoDte),
      cantidad: 1,
      descuentoTipo: 'porcentaje',
      descuentoValor: 0,
      tipoIva: producto.tipoIva,
    });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  };

  // Cambia el modo de precio del editor y ajusta el valor mostrado.
  const cambiarModoIvaPrecio = (valor) => {
    if (documentoSinIva) {
      setPrecioIncluyeIva(false);
      return;
    }
    if (valor === precioIncluyeIva) return;

    setPrecioIncluyeIva(valor);
    if (itemEditando) {
      if (valor) {
        setItemEditando((previo) => ({
          ...previo,
          precio: previo.tipoIva === 'gravado'
            ? redondear(previo.precio * (1 + TASA_IVA))
            : previo.precio,
        }));
      } else {
        setItemEditando((previo) => ({
          ...previo,
          precio: previo.tipoIva === 'gravado'
            ? redondear(previo.precio / (1 + TASA_IVA))
            : previo.precio,
        }));
      }
    }
  };

  // Guarda un producto nuevo o reemplaza el que se estaba editando.
  const agregarAlCarrito = () => {
    if (!itemEditando) return;

    const { precioLiteralSinIva, ...itemSinPrecioTemporal } = itemEditando;
    const precioLiteral = Math.max(Number(precioLiteralSinIva) || 0, 0);
    const precioLiteralAnterior = obtenerPrecioUnitarioMostrado(itemEditando, true);
    const cambioPrecioLiteral = Math.abs(precioLiteral - precioLiteralAnterior) > 0.000001;

    let precioFinal;
    let precioConIVA;

    if (documentoSinIva) {
      if (itemEditando.tipoIva === 'gravado') {
        precioFinal = cambioPrecioLiteral
          ? precioLiteral / (1 + TASA_IVA)
          : itemEditando.precio;
        precioConIVA = precioLiteral;
      } else {
        precioFinal = precioLiteral;
        precioConIVA = precioLiteral;
      }
    } else {
      precioFinal = precioIncluyeIva && itemEditando.tipoIva === 'gravado'
        ? itemEditando.precio / (1 + TASA_IVA)
        : itemEditando.precio;
      precioConIVA = itemEditando.tipoIva === 'gravado'
        ? (precioIncluyeIva ? itemEditando.precio : redondear(itemEditando.precio * (1 + TASA_IVA)))
        : itemEditando.precio;
    }

    const itemConPrecioBase = { ...itemSinPrecioTemporal, precio: precioFinal, precioConIVA };
    setCarrito((actual) => {
      const indice = actual.findIndex((item) => item._key === itemEditando._key);
      if (indice >= 0) {
        const nuevaLista = [...actual];
        nuevaLista[indice] = itemConPrecioBase;
        return nuevaLista;
      }
      return [...actual, { ...itemConPrecioBase, _key: Date.now() + Math.random() }];
    });
    setDialogoItem(false);
    setItemEditando(null);
  };

  const editarItem = (item) => {
    setItemEditando({
      ...item,
      precioLiteralSinIva: obtenerPrecioParaDte(item, tipoDte),
    });
    setPrecioIncluyeIva(false);
    setDialogoItem(true);
  };

  const cambiarCantidad = (clave, delta) => {
    setCarrito((actual) => actual.map((item) => {
      if (item._key !== clave) return item;
      const nuevaCantidad = item.cantidad + delta;
      return nuevaCantidad <= 0 ? null : { ...item, cantidad: nuevaCantidad };
    }).filter(Boolean));
  };

  const quitarDelCarrito = (clave) => {
    setCarrito((actual) => actual.filter((item) => item._key !== clave));
  };

  const cancelarEdicion = () => {
    setDialogoItem(false);
    setItemEditando(null);
  };

  return {
    carrito,
    setCarrito,
    dialogoItem,
    setDialogoItem,
    itemEditando,
    setItemEditando,
    precioIncluyeIva,
    seleccionarItem,
    cambiarModoIvaPrecio,
    agregarAlCarrito,
    editarItem,
    cambiarCantidad,
    quitarDelCarrito,
    cancelarEdicion,
  };
}
