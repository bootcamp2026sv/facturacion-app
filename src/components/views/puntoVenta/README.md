# Punto de venta

Esta carpeta contiene las piezas que usa la vista principal del punto de venta.

Los archivos también tienen comentarios breves dentro del código. El README explica el mapa completo; los comentarios ayudan a entender cada archivo mientras se está trabajando en él.

La pantalla principal está en:

`src/components/views/VistaPuntoVenta.jsx`

Desde ahí se coordinan los productos, el cliente, el carrito, el tipo de DTE, el pago y el ticket.

## ¿Dónde se abre el punto de venta?

La entrada está en `src/components/PanelPrincipal.jsx`.

Ahí se importa `VistaPuntoVenta` y se muestra cuando se selecciona la opción **Punto de Venta**. La vista clásica (`VistaPuntoVentaClasico`) es otra pantalla y no usa estos componentes.

## Idea sencilla de la estructura

`VistaPuntoVenta.jsx` es el coordinador. Guarda los datos importantes y decide qué debe pasar cuando el usuario hace algo.

Los componentes de esta carpeta muestran la pantalla y reciben datos y funciones desde la vista principal. No guardan ventas por su cuenta ni llaman directamente a la API.

El flujo general es:

```text
VistaPuntoVenta
  ├─ carga catálogos
  ├─ muestra productos y carrito
  ├─ prepara el DTE y el pago
  ├─ guarda la venta
  └─ muestra e imprime el ticket
```

## Archivos principales

### `constantesPuntoVenta.js`

Contiene datos que se usan en varios lugares:

- Tipos de DTE.
- Métodos de pago.
- Tipos de documento del cliente.
- Colores y anchos del ticket.
- Valores iniciales para cliente rápido, receptor y exportación.
- Relación entre la tributación de la API y el tipo de IVA usado en pantalla.

Si se agrega un método de pago o un tipo de DTE, este es el primer archivo que se debe revisar.

### `mapeadoresPuntoVenta.js`

Convierte la respuesta de la API al formato que entiende el punto de venta.

- `mapearProductoApi`: prepara nombre, precios, categoría, imagen e IVA del producto.
- `mapearClienteApi`: prepara nombre, documento, dirección, actividad económica y datos fiscales del cliente.

Si la API cambia el nombre de un campo, normalmente el cambio debe hacerse aquí y no en todos los componentes visuales.

### `reglasPuntoVenta.js`

Contiene las reglas que no necesitan mostrar HTML. Aquí están los cálculos y la preparación de datos:

- Precio con o sin IVA según el DTE.
- Cálculo de cada producto con descuento e IVA.
- Resumen de la venta.
- Retención del 1% y retención de renta del 10%.
- Campos faltantes para una exportación.
- Interpretación de errores devueltos por Hacienda.
- Conversión de montos y plazos.
- Construcción de `detallesVenta` y del payload enviado al backend.
- Construcción de los datos que usa el ticket.

Cuando se cambie una regla fiscal o un cálculo, debe hacerse aquí y actualizar sus pruebas.

### `serviciosPuntoVenta.js`

Es el único archivo de esta carpeta que conoce las llamadas principales al backend.

Usa estos endpoints:

| Función | Endpoint | Uso |
| --- | --- | --- |
| `obtenerCatalogosPos` | `GET /Productos`, `GET /Clientes`, `GET /Comercios`, `GET /distritos`, `GET /ActividadEconomicas` | Carga inicial de la pantalla. |
| `obtenerProductosPuntoVenta` | `GET /Productos` | Recarga productos. |
| `obtenerClientesPuntoVenta` | `GET /Clientes` | Recarga clientes. |
| `crearClientePuntoVenta` | `POST /Clientes` | Guarda un cliente desde el POS. |
| `guardarVentaPuntoVenta` | `POST /Ventas` | Guarda la venta. |
| `enviarVentaPorCorreo` | `POST /Ventas/{id}/correo` | Envía el DTE por correo. |

También mantiene la caché de catálogos. No se debe eliminar esa caché sin revisar el tiempo de carga inicial.

## Hooks

Los hooks guardan estados que pertenecen a una parte concreta del punto de venta.

### `useCatalogosPuntoVenta.js`

Se encarga de:

- Cargar productos, clientes, comercio, distritos y actividades económicas.
- Informar si los catálogos están cargando.
- Guardar errores de carga.
- Recargar productos y clientes.
- Seleccionar el cliente predeterminado y conocer si es gran contribuyente.

La vista principal usa sus datos para alimentar el catálogo, el selector de clientes y el formulario de cliente nuevo.

### `useCarritoPuntoVenta.js`

Se encarga de:

- Agregar productos normales directamente al carrito.
- Abrir el editor para productos personalizables.
- Editar precio, cantidad, IVA y descuento.
- Cambiar la cantidad de un producto.
- Eliminar productos.
- Mantener abierto o cerrado el diálogo de personalización.

Recibe `tipoDte` y `documentoSinIva` porque el precio que se muestra depende del documento seleccionado.

### `usePagoPuntoVenta.js`

Se encarga de los datos que se escriben en el pago:

- Efectivo recibido.
- Texto y número del efectivo.
- Referencia de tarjeta o transferencia.
- Plazo y tipo de plazo del crédito.
- Referencia al campo donde se escribe el efectivo.
- Reinicio de los datos al abrir una nueva confirmación de pago.

El hook no guarda la venta. La función `cobrar` de `VistaPuntoVenta.jsx` sigue controlando ese proceso.

## Componentes visuales

Todos están dentro de `puntoVenta/componentes/`.

### `PanelCatalogoPuntoVenta.jsx`

Muestra:

- Búsqueda de productos.
- Categorías.
- Botón para recargar productos.
- Botón de pantalla completa.
- Tarjetas de productos.

Cuando se pulsa un producto llama a `seleccionarItem(producto)`. No agrega el producto por su cuenta; esa función viene de `useCarritoPuntoVenta`.

### `PanelCarritoPuntoVenta.jsx`

Muestra la parte derecha de la pantalla:

- Cliente seleccionado y sus datos.
- Gran contribuyente.
- Tipo de DTE.
- Retención de renta para DTE-14.
- Productos del carrito.
- Cantidades, descuentos y totales.
- Métodos de pago.
- Botón **Cobrar**.

Recibe los datos y funciones desde `VistaPuntoVenta`. No llama a `/Ventas` directamente.

### `DialogoProductoPuntoVenta.jsx`

Es el diálogo **Personalizar producto**.

Permite cambiar:

- Nombre.
- Precio con o sin IVA.
- Cantidad.
- Tipo de IVA.
- Descuento.

Al pulsar **Agregar al Carrito** o **Actualizar**, llama a `agregarAlCarrito`.

### `DialogoPagoPuntoVenta.jsx`

Es el diálogo **Confirmar Cobro**.

Muestra el formulario adecuado según el método seleccionado:

- Efectivo y cálculo del cambio.
- Número de autorización para tarjeta.
- Plazo para crédito.
- Número de referencia para transferencia.
- Datos opcionales del receptor cuando se usa Cliente Final.
- Errores recibidos desde Hacienda.

Al confirmar llama a `cobrar` de `VistaPuntoVenta.jsx`.

### `DialogosClientePuntoVenta.jsx`

Contiene dos diálogos:

1. **Seleccionar Cliente**: busca y selecciona un cliente existente.
2. **Registrar cliente**: crea un cliente rápido y lo selecciona para la venta.

La validación y el guardado los controla la vista principal mediante `guardarClienteRapido`.

### `DialogoTicketPuntoVenta.jsx`

Muestra el ticket después de guardar la venta.

Permite:

- Cambiar entre 58 mm y 80 mm.
- Cerrar el ticket.
- Imprimirlo.

Usa internamente `TicketVenta.jsx` para dibujar el contenido.

### `TicketVenta.jsx`

Solo dibuja el ticket. Recibe:

- `ticket`: datos de la venta, cliente, comercio, productos y totales.
- `ticketAncho`: ancho seleccionado para impresión.

No guarda información ni llama a la API.

### `AvisosPuntoVenta.jsx`

Muestra los avisos de:

- Pago exitoso.
- Correo enviado.
- Error al enviar el correo.
- Error al cargar catálogos.

## Componentes relacionados que están fuera de esta carpeta

### `componentesPuntoVenta.jsx`

Está en `src/components/views/componentesPuntoVenta.jsx`.

Contiene pequeños contenedores compartidos, como:

- `ContenedorPuntoVenta`.
- `PanelCatalogo`.
- `PanelCarrito`.
- `DialogoPuntoVenta`.
- `ImpresionTicket`.
- Avisos de éxito y error.

Estos componentes ayudan a mantener las clases CSS comunes.

### `DialogoExportacionDte11.jsx`

Está en `src/components/views/DialogoExportacionDte11.jsx`.

Es el diálogo especial del DTE-11. `VistaPuntoVenta` le entrega:

- El cliente.
- Los datos de exportación.
- Los campos faltantes.
- La función para actualizar los datos.
- La función para continuar al cobro.

No debe duplicarse dentro de la carpeta `puntoVenta`.

### `VistaPuntoVenta.css`

Está en `src/components/views/VistaPuntoVenta.css`.

Contiene los estilos del POS, los estilos del ticket, los cambios para pantallas pequeñas y los estilos de impresión. Los componentes nuevos conservan las clases existentes para no cambiar el diseño.

## Flujo de una venta

1. Se abre `VistaPuntoVenta` desde `PanelPrincipal`.
2. `useCatalogosPuntoVenta` carga los catálogos.
3. El usuario pulsa un producto en `PanelCatalogoPuntoVenta`.
4. `useCarritoPuntoVenta` lo agrega o abre el diálogo de personalización.
5. Se selecciona el cliente y el tipo de DTE.
6. `reglasPuntoVenta.js` calcula IVA, descuentos, retenciones y total.
7. Para DTE-11 se abre primero `DialogoExportacionDte11`.
8. `DialogoPagoPuntoVenta` recoge los datos del pago.
9. `cobrar` construye el payload con `construirPayloadVenta`.
10. `serviciosPuntoVenta.js` guarda la venta.
11. Si hay correo, se intenta enviar el DTE.
12. Se crea el ticket y se muestra `DialogoTicketPuntoVenta`.
13. Al cerrar el ticket se prepara la siguiente venta.

## ¿Dónde hago un cambio?

- Cambiar textos, colores de DTE o métodos de pago: `constantesPuntoVenta.js` o el componente visual correspondiente.
- Cambiar nombres de campos recibidos de la API: `mapeadoresPuntoVenta.js`.
- Cambiar endpoints: `serviciosPuntoVenta.js`.
- Cambiar IVA, descuentos, retenciones o payload: `reglasPuntoVenta.js`.
- Cambiar la forma de agregar o editar productos: `useCarritoPuntoVenta.js`.
- Cambiar la forma de capturar pagos: `usePagoPuntoVenta.js` y `DialogoPagoPuntoVenta.jsx`.
- Cambiar la pantalla de productos: `PanelCatalogoPuntoVenta.jsx`.
- Cambiar la pantalla del carrito: `PanelCarritoPuntoVenta.jsx`.
- Cambiar el ticket: `TicketVenta.jsx` y `VistaPuntoVenta.css`.
- Cambiar el orden general del proceso: `VistaPuntoVenta.jsx`.

## Pruebas

Las reglas principales tienen pruebas en:

`test/puntoVenta.test.js`

También se mantienen las pruebas generales de:

- Cálculos de IVA.
- Validaciones de clientes.
- Validaciones de Crédito Fiscal.

Cuando se cambie un cálculo o el payload, primero se deben actualizar o agregar pruebas antes de modificar la pantalla.

## Reglas para mantenerlo ordenado

- Los componentes visuales no deben llamar directamente a la API.
- Los cálculos no deben repetirse dentro del JSX.
- Las reglas fiscales deben quedarse en `reglasPuntoVenta.js`.
- Los nombres nuevos deben mantenerse en español.
- Las clases de `VistaPuntoVenta.css` deben conservarse salvo que el cambio visual sea intencional.
- Si se agrega una función nueva, conviene colocarla donde corresponde y explicar aquí su uso si afecta el flujo general.
