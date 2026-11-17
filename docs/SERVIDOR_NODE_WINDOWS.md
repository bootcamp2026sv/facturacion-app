# Servidor Node.js al iniciar Windows

Instalar dependencias y generar la versión de producción:

```powershell
npm install
npm run build
```

Iniciar el servidor:

```powershell
npm run start
```

También se incluyen:

- `scripts\iniciar-frontend.cmd`: inicia el servidor.
- `scripts\registrar-frontend-inicio.cmd`: registra automáticamente la tarea `Facturacion Frontend` para iniciar sesión en Windows.
- `scripts\configurar-frontend-windows.cmd`: instala npm, compila, registra la tarea y arranca el servidor en un solo paso.

Ejecutar `registrar-frontend-inicio.cmd` una sola vez desde el explorador o una terminal.
Para hacer toda la preparación automáticamente, ejecutar `configurar-frontend-windows.cmd`.

El servidor escucha en `http://localhost:5173` y sirve el contenido de `dist` mediante Vite Preview.
