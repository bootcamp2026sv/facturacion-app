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

También se incluye `scripts\iniciar-frontend.cmd`, que puede registrarse en el Programador de tareas de Windows con la opción **Ejecutar tanto si el usuario inició sesión como si no** y **Ejecutar con los privilegios más altos**.

El servidor escucha en `http://localhost:5173` y sirve el contenido de `dist` mediante Vite Preview.
