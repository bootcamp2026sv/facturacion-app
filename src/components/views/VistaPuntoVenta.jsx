import { useCallback, useEffect, useMemo, useState } from 'react';
import DialogoExportacionDte11 from './DialogoExportacionDte11';
import { ContenedorPuntoVenta, ImpresionTicket } from './componentesPuntoVenta';
import PanelCatalogoPuntoVenta from './puntoVenta/componentes/PanelCatalogoPuntoVenta';
import PanelCarritoPuntoVenta from './puntoVenta/componentes/PanelCarritoPuntoVenta';
import DialogoProductoPuntoVenta from './puntoVenta/componentes/DialogoProductoPuntoVenta';
import DialogoPagoPuntoVenta from './puntoVenta/componentes/DialogoPagoPuntoVenta';
import DialogoTicketPuntoVenta from './puntoVenta/componentes/DialogoTicketPuntoVenta';
import DialogosClientePuntoVenta from './puntoVenta/componentes/DialogosClientePuntoVenta';
import TicketVenta from './puntoVenta/componentes/TicketVenta';
import AvisosPuntoVenta from './puntoVenta/componentes/AvisosPuntoVenta';
import { useCatalogosPuntoVenta } from './puntoVenta/hooks/useCatalogosPuntoVenta';
import { useCarritoPuntoVenta } from './puntoVenta/hooks/useCarritoPuntoVenta';
import { usePagoPuntoVenta } from './puntoVenta/hooks/usePagoPuntoVenta';
import {
  clienteRapidoInicial,
  datosExportacionDte11Iniciales,
  datosReceptorVentaInicial,
  TICKET_ANCHO_STORAGE_KEY,
  ANCHOS_TICKET,
} from './puntoVenta/constantesPuntoVenta';
import {
  calcularResumenVenta,
  calcularCambioPago,
  construirPayloadVenta,
  crearDatosTicketVenta,
  esClienteFinal,
  esTipoDteSinIva,
  interpretarErrorHacienda,
  obtenerCamposFaltantesExportacion,
  obtenerDatosReceptorVenta,
} from './puntoVenta/reglasPuntoVenta';
import {
  agregarClienteAlCatalogoPosCache,
  crearClientePuntoVenta,
  enviarVentaPorCorreo,
  guardarVentaPuntoVenta,
} from './puntoVenta/serviciosPuntoVenta';
import { mapearClienteApi } from './puntoVenta/mapeadoresPuntoVenta';
import { obtenerErrorFormatoCliente } from '../../utils/validacionesCliente';
import { obtenerCamposFaltantesCreditoFiscal } from '../../utils/validacionesVenta';
import './VistaPuntoVenta.css';

/**
 * Pantalla principal del punto de venta.
 *
 * Esta vista no dibuja todos los detalles por sí sola. Une los componentes
 * de catálogo, carrito, clientes, pago y ticket. También mantiene las
 * acciones que necesitan coordinar más de un componente.
 */
export default function VistaPuntoVenta() {
  // Búsqueda y filtro del catálogo.
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

  // Mensajes y estados de guardado de la venta.
  const [errorVenta, setErrorVenta] = useState('');
  const [guardandoVenta, setGuardandoVenta] = useState(false);

  // Datos opcionales del receptor y de una exportación DTE-11.
  const [mostrarDatosCliente, setMostrarDatosCliente] = useState(false);
  const [datosReceptorVenta, setDatosReceptorVenta] = useState(datosReceptorVentaInicial);
  const [datosExportacion, setDatosExportacion] = useState(datosExportacionDte11Iniciales);
  const [mostrarDatosReceptor, setMostrarDatosReceptor] = useState(false);

  // Estado de los pagos y de los diálogos que aparecen durante la venta.
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dialogoPago, setDialogoPago] = useState(false);
  const [dialogoExportacion, setDialogoExportacion] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [avisoCorreo, setAvisoCorreo] = useState(null);
  const [dialogoTicket, setDialogoTicket] = useState(false);
  const [ticketVenta, setTicketVenta] = useState(null);
  const [ticketAncho, setTicketAncho] = useState(() => {
    const guardado = Number(localStorage.getItem(TICKET_ANCHO_STORAGE_KEY));
    return ANCHOS_TICKET.some((ancho) => ancho.value === guardado) ? guardado : 80;
  });

  // Reglas del documento seleccionado.
  const [retenerRenta, setRetenerRenta] = useState(false);
  const [tipoDte, setTipoDte] = useState('01');

  // Estado de selección y creación rápida de clientes.
  const [dialogoCliente, setDialogoCliente] = useState(false);
  const [dialogoNuevoCliente, setDialogoNuevoCliente] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [errorClienteRapido, setErrorClienteRapido] = useState('');
  const [clienteRapido, setClienteRapido] = useState(clienteRapidoInicial);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  // Estos hooks guardan la parte más grande de cada responsabilidad:
  // catálogos, carrito y campos del pago.
  const documentoSinIva = esTipoDteSinIva(tipoDte);
  const catalogos = useCatalogosPuntoVenta({ busquedaProducto: busqueda, busquedaCliente });
  const carritoVenta = useCarritoPuntoVenta({ tipoDte, documentoSinIva });
  const pago = usePagoPuntoVenta();

  const {
    productos,
    clientes,
    distritos,
    actividades,
    comercio,
    cargandoCatalogos,
    recargandoProductos,
    cargandoClientes,
    errorCatalogos,
    errorClientes,
    cliente,
    setCliente,
    esGranContribuyente,
    setEsGranContribuyente,
    setClientes,
    recargarProductos,
    recargarClientes,
  } = catalogos;
  const {
    carrito,
    setCarrito,
    dialogoItem,
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
  } = carritoVenta;

  // Cliente seleccionado y textos preparados para mostrarlos en el panel.
  const clienteSeleccionado = useMemo(
    () => clientes.find((clienteDisponible) => clienteDisponible.value === cliente) || null,
    [cliente, clientes]
  );

  const nombreClienteSeleccionado = clienteSeleccionado
    ? [clienteSeleccionado.nombre, clienteSeleccionado.apellidos].filter(Boolean).join(' ').trim()
      || clienteSeleccionado.nombreComercial
      || clienteSeleccionado.label
    : '';
  const direccionClienteSeleccionado = clienteSeleccionado?.direccion
    ? [
      clienteSeleccionado.direccion.departamento,
      clienteSeleccionado.direccion.municipio,
      clienteSeleccionado.direccion.distrito,
      clienteSeleccionado.direccion.complemento,
    ].filter(Boolean).join(', ')
    : '';
  const actividadClienteSeleccionado = clienteSeleccionado?.actividadEconomica;
  const actividadClienteTexto = actividadClienteSeleccionado
    ? [
      actividadClienteSeleccionado.codActividad || actividadClienteSeleccionado.CodActividad,
      actividadClienteSeleccionado.descActividad || actividadClienteSeleccionado.DescActividad,
    ].filter(Boolean).join(' - ')
    : '';
  const tipoDocumentoClienteSeleccionado = clienteSeleccionado
    ? ({ 13: 'DUI', 36: 'NIT', 3: 'Pasaporte', 2: 'Carnet residente', 37: 'Otro' }[clienteSeleccionado.tipoDocumento] || '')
    : '';
  const detalleErrorVenta = useMemo(() => interpretarErrorHacienda(errorVenta), [errorVenta]);

  // Validaciones que bloquean el cobro antes de llamar al backend.
  const camposFaltantesCreditoFiscal = useMemo(
    () => tipoDte === '03' ? obtenerCamposFaltantesCreditoFiscal(clienteSeleccionado) : [],
    [tipoDte, clienteSeleccionado]
  );
  const mensajeClienteCreditoFiscal = camposFaltantesCreditoFiscal.length > 0
    ? `Crédito Fiscal: completa ${camposFaltantesCreditoFiscal.join(', ')} del cliente antes de cobrar.`
    : '';
  const camposFaltantesExportacion = useMemo(
    () => obtenerCamposFaltantesExportacion({ tipoDte, clienteSeleccionado, datosExportacion }),
    [tipoDte, clienteSeleccionado, datosExportacion]
  );
  const esClienteVariosParaFactura = tipoDte === '01' && clienteSeleccionado && esClienteFinal(clienteSeleccionado);
  const tieneDatosReceptorVenta = Boolean(datosReceptorVenta.nombre.trim() || datosReceptorVenta.correo.trim());
  const datosReceptor = obtenerDatosReceptorVenta({ esClienteVariosParaFactura, datosReceptorVenta });

  // El resumen es la fuente de verdad para los totales de la pantalla y del payload.
  const resumen = useMemo(
    () => calcularResumenVenta({
      carrito,
      tipoDte,
      documentoSinIva,
      esGranContribuyente,
      retenerRenta,
      datosExportacion,
    }),
    [carrito, tipoDte, documentoSinIva, esGranContribuyente, retenerRenta, datosExportacion]
  );

  // Listas que se muestran en los filtros y selectores.
  const categorias = useMemo(() => {
    const unicas = [...new Set(productos.map((producto) => producto.categoria).filter(Boolean))];
    return ['Todas', ...unicas];
  }, [productos]);
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente) return clientes;
    const textoBusqueda = busquedaCliente.toLowerCase();
    return clientes.filter((clienteDisponible) => clienteDisponible.label.toLowerCase().includes(textoBusqueda) || clienteDisponible.nit.toLowerCase().includes(textoBusqueda));
  }, [busquedaCliente, clientes]);
  const productosFiltrados = useMemo(() => productos.filter((producto) => {
    if (categoriaActiva !== 'Todas' && producto.categoria !== categoriaActiva) return false;
    if (busqueda && !producto.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [busqueda, categoriaActiva, productos]);

  // Guarda el ancho del ticket y controla los cambios de pantalla completa.
  useEffect(() => {
    localStorage.setItem(TICKET_ANCHO_STORAGE_KEY, String(ticketAncho));
  }, [ticketAncho]);

  // En pantalla completa se bloquea el desplazamiento de la página principal.
  const togglePantallaCompleta = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const manejarCambioPantalla = () => {
      const estaEnPantallaCompleta = !!document.fullscreenElement;
      setPantallaCompleta(estaEnPantallaCompleta);
      document.body.style.overflow = estaEnPantallaCompleta ? 'hidden' : '';
      document.documentElement.style.overflow = estaEnPantallaCompleta ? 'hidden' : '';
      const principal = document.querySelector('main');
      if (principal) principal.style.overflow = estaEnPantallaCompleta ? 'hidden' : '';
    };

    document.addEventListener('fullscreenchange', manejarCambioPantalla);
    return () => {
      document.removeEventListener('fullscreenchange', manejarCambioPantalla);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const principal = document.querySelector('main');
      if (principal) principal.style.overflow = '';
    };
  }, []);

  // Cambiar de DTE también limpia los datos que solo pertenecen al DTE anterior.
  const seleccionarTipoDte = (nuevoTipoDte) => {
    setTipoDte(nuevoTipoDte);
    if (nuevoTipoDte !== '14') setRetenerRenta(false);
    if (nuevoTipoDte !== '11') setDatosExportacion(datosExportacionDte11Iniciales);
    if (nuevoTipoDte !== '01') {
      setDatosReceptorVenta(datosReceptorVentaInicial);
      setMostrarDatosReceptor(false);
    }
  };

  // Al seleccionar un cliente se actualizan también los datos que se usan
  // para retenciones y exportaciones.
  const seleccionarCliente = (clienteNuevo) => {
    setCliente(clienteNuevo.value);
    setEsGranContribuyente(!!clienteNuevo.granContribuyente);
    if (!esClienteFinal(clienteNuevo)) {
      setDatosReceptorVenta(datosReceptorVentaInicial);
      setMostrarDatosReceptor(false);
    }
    setMostrarDatosCliente(false);
    if (tipoDte === '11') {
      setDatosExportacion((actual) => ({
        ...actual,
        complemento: actual.complemento || clienteNuevo.direccion?.complemento || '',
        descActividad: actual.descActividad || clienteNuevo.actividadEconomica?.descActividad || '',
      }));
    }
    setDialogoCliente(false);
    setBusquedaCliente('');
  };

  // Después de cerrar el ticket, la siguiente venta vuelve al cliente final y al DTE-01.
  const restablecerClienteFinalYFactura = () => {
    const clienteFinal = clientes.find(esClienteFinal) || null;
    setCliente(clienteFinal?.value ?? null);
    setEsGranContribuyente(!!clienteFinal?.granContribuyente);
    setRetenerRenta(false);
    setTipoDte('01');
    setMostrarDatosCliente(false);
    setDatosReceptorVenta(datosReceptorVentaInicial);
    setDatosExportacion(datosExportacionDte11Iniciales);
    setMostrarDatosReceptor(false);
    setAvisoCorreo(null);
  };

  const cerrarDialogoPago = () => setDialogoPago(false);

  // El DTE-11 tiene un paso adicional antes de mostrar el diálogo de pago.
  const abrirDialogoCobro = () => {
    if (carrito.length === 0) return;
    setErrorVenta('');
    if (tipoDte === '11') {
      setDialogoExportacion(true);
      return;
    }
    pago.reiniciarDatosPago();
    setDialogoPago(true);
  };

  const continuarDesdeExportacion = () => {
    if (camposFaltantesExportacion.length > 0) return;
    setDialogoExportacion(false);
    pago.reiniciarDatosPago();
    setDialogoPago(true);
  };

  // Cerrar el ticket también deja lista la venta siguiente.
  const cerrarDialogoTicket = () => {
    setDialogoTicket(false);
    restablecerClienteFinalYFactura();
  };

  // Abrir el selector actualiza los clientes antes de mostrarlos.
  const abrirDialogoCliente = async () => {
    setDialogoCliente(true);
    setBusquedaCliente('');
    const resultado = await recargarClientes(cliente);
    if (resultado.siguienteCliente) {
      setCliente(resultado.siguienteCliente.value || null);
      setEsGranContribuyente(!!resultado.siguienteCliente.granContribuyente);
    }
  };

  const abrirNuevoCliente = () => {
    setClienteRapido({ ...clienteRapidoInicial, distrito_id: distritos[0]?.id || null, actividadEconomica_id: null });
    setErrorClienteRapido('');
    setDialogoCliente(false);
    setDialogoNuevoCliente(true);
  };

  // Valida y guarda el cliente rápido. Al terminar lo deja seleccionado.
  const guardarClienteRapido = async () => {
    if (!clienteRapido.nombre.trim()) {
      setErrorClienteRapido('El nombre o razón social es obligatorio.');
      return;
    }
    if (tipoDte === '11' && !clienteRapido.correo.trim()) {
      setErrorClienteRapido('Para una exportación, el cliente debe tener correo.');
      return;
    }
    if (tipoDte === '11' && !clienteRapido.complementoDireccion.trim()) {
      setErrorClienteRapido('Para una exportación, el cliente debe tener dirección.');
      return;
    }

    const errorFormato = obtenerErrorFormatoCliente(clienteRapido);
    if (errorFormato) {
      setErrorClienteRapido(errorFormato);
      return;
    }

    setGuardandoCliente(true);
    setErrorClienteRapido('');
    try {
      const clienteGuardado = await crearClientePuntoVenta({
        ...clienteRapido,
        distrito_id: clienteRapido.distrito_id || distritos[0]?.id || 1,
        actividadEconomica_id: clienteRapido.actividadEconomica_id || null,
      });
      const clienteMapeado = mapearClienteApi(clienteGuardado);
      agregarClienteAlCatalogoPosCache(clienteGuardado);
      setClientes((actual) => [...actual, clienteMapeado]);
      setCliente(clienteMapeado.value);
      setEsGranContribuyente(!!clienteMapeado.granContribuyente);
      setDialogoNuevoCliente(false);
      setClienteRapido(clienteRapidoInicial);
    } catch (error) {
      console.error('Error al crear cliente desde POS:', error);
      setErrorClienteRapido(error.response?.data?.message || error.response?.data?.error || 'No se pudo crear el cliente.');
    } finally {
      setGuardandoCliente(false);
    }
  };

  // 1. Comprueba que la venta puede cobrarse.
  // 2. Construye el payload que espera la API.
  // 3. Guarda la venta y trata de enviar el correo.
  // 4. Prepara el ticket y limpia el carrito.
  const cobrar = async () => {
    if (carrito.length === 0 || !clienteSeleccionado || !comercio) return;
    if (tipoDte === '03' && camposFaltantesCreditoFiscal.length > 0) {
      setErrorVenta(mensajeClienteCreditoFiscal);
      cerrarDialogoPago();
      return;
    }
    if (tipoDte === '11' && camposFaltantesExportacion.length > 0) {
      setErrorVenta(`Exportación: completa ${camposFaltantesExportacion.join(', ')} antes de cobrar.`);
      return;
    }
    if (datosReceptor.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosReceptor.correo)) {
      setErrorVenta('El correo del receptor no tiene un formato válido.');
      return;
    }

    setGuardandoVenta(true);
    setErrorVenta('');
    setAvisoCorreo(null);
    const cambio = metodoPago === 'efectivo' ? calcularCambioPago(pago.efectivoRecibido, resumen.totalCobrar) : null;

    // Esta función conserva los nombres del contrato del backend.
    const payload = construirPayloadVenta({
      carrito,
      tipoDte,
      resumen,
      metodoPago,
      referenciaPago: pago.referenciaPago,
      cambio,
      efectivoRecibido: pago.efectivoRecibido,
      plazoValor: pago.plazoValor,
      plazoTipo: pago.plazoTipo,
      clienteSeleccionado,
      comercio,
      datosExportacion,
      datosReceptor,
    });

    try {
      // La respuesta puede traer número de control, código de generación y sello.
      const ventaGuardada = await guardarVentaPuntoVenta(payload);
      if (datosReceptor.correo) {
        // Un error de correo no cancela una venta que ya fue guardada.
        try {
          await enviarVentaPorCorreo(ventaGuardada.id, datosReceptor.correo);
          setAvisoCorreo({ tipo: 'exito', mensaje: `DTE enviado a ${datosReceptor.correo}.` });
        } catch (errorCorreo) {
          console.error('La venta se guardó, pero no se pudo enviar el correo:', errorCorreo);
          setAvisoCorreo({ tipo: 'error', mensaje: 'La venta se guardó, pero no se pudo enviar el DTE al correo indicado.' });
        }
      }
      setTicketVenta(crearDatosTicketVenta({
        ventaGuardada,
        cambio,
        carrito,
        tipoDte,
        metodoPago,
        referenciaPago: pago.referenciaPago,
        efectivoRecibido: pago.efectivoRecibido,
        plazoValor: pago.plazoValor,
        plazoTipo: pago.plazoTipo,
        clienteSeleccionado,
        comercio,
        resumen,
        datosReceptor,
      }));
      setDatosReceptorVenta(datosReceptorVentaInicial);
      setMostrarDatosReceptor(false);
      setMetodoPago('efectivo');
      setDialogoPago(false);
      setDialogoTicket(true);
      setPagoExitoso(true);
      setCarrito([]);
      setTimeout(() => setPagoExitoso(false), 3000);
    } catch (error) {
      // El error se conserva para que DialogoPagoPuntoVenta lo muestre.
      console.error('Error al guardar venta:', error);
      setErrorVenta(
        error.response?.data?.message
        || error.response?.data?.mensaje
        || error.response?.data?.error
        || 'No se pudo guardar la venta.',
      );
    } finally {
      setGuardandoVenta(false);
    }
  };

  // La impresión usa los estilos de impresión definidos en VistaPuntoVenta.css.
  const imprimirTicket = () => requestAnimationFrame(() => window.print());

  // La vista solo conecta los componentes; cada uno se encarga de una parte de la pantalla.
  return (
    <ContenedorPuntoVenta style={{ '--ancho-ticket': `${ticketAncho}mm` }}>
      {/* Copia oculta que se usa al imprimir el ticket. */}
      <ImpresionTicket>
        <TicketVenta ticket={ticketVenta} ticketAncho={ticketAncho} />
      </ImpresionTicket>

      {/* Mensajes cortos que no pertenecen a un diálogo específico. */}
      <AvisosPuntoVenta pagoExitoso={pagoExitoso} avisoCorreo={avisoCorreo} errorCatalogos={errorCatalogos} />

      <div className="punto-venta__contenido">
        {/* Panel izquierdo: productos y filtros. */}
        <PanelCatalogoPuntoVenta
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          setCategoriaActiva={setCategoriaActiva}
          recargarProductos={recargarProductos}
          cargandoCatalogos={cargandoCatalogos}
          recargandoProductos={recargandoProductos}
          pantallaCompleta={pantallaCompleta}
          togglePantallaCompleta={togglePantallaCompleta}
          productosFiltrados={productosFiltrados}
          tipoDte={tipoDte}
          seleccionarItem={seleccionarItem}
        />

        {/* Panel derecho: cliente, DTE, carrito, totales y botón de cobro. */}
        <PanelCarritoPuntoVenta
          carrito={carrito}
          cliente={cliente}
          clienteSeleccionado={clienteSeleccionado}
          abrirDialogoCliente={abrirDialogoCliente}
          mostrarDatosCliente={mostrarDatosCliente}
          setMostrarDatosCliente={setMostrarDatosCliente}
          nombreClienteSeleccionado={nombreClienteSeleccionado}
          direccionClienteSeleccionado={direccionClienteSeleccionado}
          actividadClienteTexto={actividadClienteTexto}
          tipoDocumentoClienteSeleccionado={tipoDocumentoClienteSeleccionado}
          documentoSinIva={documentoSinIva}
          esGranContribuyente={esGranContribuyente}
          setEsGranContribuyente={setEsGranContribuyente}
          tipoDte={tipoDte}
          seleccionarTipoDte={seleccionarTipoDte}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          retenerRenta={retenerRenta}
          setRetenerRenta={setRetenerRenta}
          resumen={resumen}
          cambiarCantidad={cambiarCantidad}
          quitarDelCarrito={quitarDelCarrito}
          editarItem={editarItem}
          mensajeClienteCreditoFiscal={mensajeClienteCreditoFiscal}
          abrirDialogoCobro={abrirDialogoCobro}
          cargandoCatalogos={cargandoCatalogos}
          comercio={comercio}
          camposFaltantesCreditoFiscal={camposFaltantesCreditoFiscal}
        />
      </div>

      {/* El DTE-11 necesita completar los datos de exportación antes del pago. */}
      {tipoDte === '11' && <DialogoExportacionDte11 visible={dialogoExportacion} onHide={() => setDialogoExportacion(false)} cliente={clienteSeleccionado} value={datosExportacion} onChange={setDatosExportacion} faltantes={camposFaltantesExportacion} onContinuar={continuarDesdeExportacion} guardando={guardandoVenta} />}

      {/* Diálogo para personalizar o editar una línea del carrito. */}
      <DialogoProductoPuntoVenta visible={dialogoItem} itemEditando={itemEditando} setItemEditando={setItemEditando} carrito={carrito} precioIncluyeIva={precioIncluyeIva} documentoSinIva={documentoSinIva} tipoDte={tipoDte} cambiarModoIvaPrecio={cambiarModoIvaPrecio} agregarAlCarrito={agregarAlCarrito} onCancelar={cancelarEdicion} />

      {/* Diálogo donde se confirma el método de pago y el monto recibido. */}
      <DialogoPagoPuntoVenta
        visible={dialogoPago}
        onHide={cerrarDialogoPago}
        clienteSeleccionado={clienteSeleccionado}
        carrito={carrito}
        tipoDte={tipoDte}
        metodoPago={metodoPago}
        errorVenta={errorVenta}
        detalleErrorVenta={detalleErrorVenta}
        guardandoVenta={guardandoVenta}
        cobrar={cobrar}
        camposFaltantesExportacion={camposFaltantesExportacion}
        resumen={resumen}
        efectivoRecibidoRef={pago.efectivoRecibidoRef}
        efectivoRecibidoTexto={pago.efectivoRecibidoTexto}
        actualizarEfectivoRecibido={pago.actualizarEfectivoRecibido}
        efectivoRecibido={pago.efectivoRecibido}
        referenciaPago={pago.referenciaPago}
        setReferenciaPago={pago.setReferenciaPago}
        plazoValor={pago.plazoValor}
        setPlazoValor={pago.setPlazoValor}
        plazoTipo={pago.plazoTipo}
        setPlazoTipo={pago.setPlazoTipo}
        esClienteVariosParaFactura={esClienteVariosParaFactura}
        tieneDatosReceptorVenta={tieneDatosReceptorVenta}
        datosReceptorVenta={datosReceptorVenta}
        mostrarDatosReceptor={mostrarDatosReceptor}
        setMostrarDatosReceptor={setMostrarDatosReceptor}
        setDatosReceptorVenta={setDatosReceptorVenta}
      />

      {/* Diálogo que muestra la venta ya guardada y permite imprimirla. */}
      <DialogoTicketPuntoVenta visible={dialogoTicket} ticket={ticketVenta} ticketAncho={ticketAncho} setTicketAncho={setTicketAncho} onCerrar={cerrarDialogoTicket} onImprimir={imprimirTicket} />

      {/* Selector de cliente y formulario de cliente nuevo. */}
      <DialogosClientePuntoVenta
        visibleSeleccion={dialogoCliente}
        visibleNuevo={dialogoNuevoCliente}
        cerrarSeleccion={() => { setDialogoCliente(false); setBusquedaCliente(''); }}
        cerrarNuevo={() => { setDialogoNuevoCliente(false); setErrorClienteRapido(''); }}
        abrirNuevoCliente={abrirNuevoCliente}
        cargandoClientes={cargandoClientes}
        errorClientes={errorClientes}
        busquedaCliente={busquedaCliente}
        setBusquedaCliente={setBusquedaCliente}
        clientesFiltrados={clientesFiltrados}
        cliente={cliente}
        seleccionarCliente={seleccionarCliente}
        clienteRapido={clienteRapido}
        setClienteRapido={setClienteRapido}
        distritos={distritos}
        actividades={actividades}
        tipoDte={tipoDte}
        errorClienteRapido={errorClienteRapido}
        guardandoCliente={guardandoCliente}
        guardarClienteRapido={guardarClienteRapido}
      />
    </ContenedorPuntoVenta>
  );
}
