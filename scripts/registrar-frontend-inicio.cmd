@echo off
setlocal
set "FRONTEND_DIR=%~dp0.."
for %%I in ("%FRONTEND_DIR%") do set "FRONTEND_DIR=%%~fI"
set "STARTER=%FRONTEND_DIR%\scripts\iniciar-frontend.cmd"

echo Registrando Facturacion Frontend para iniciar con Windows...
schtasks /Create /TN "Facturacion Frontend" /SC ONLOGON /TR "\"%STARTER%\"" /F
if errorlevel 1 (
  echo No se pudo registrar la tarea.
  pause
  exit /b 1
)

echo Tarea registrada correctamente.
echo Puedes probarla con: schtasks /Run /TN "Facturacion Frontend"
pause
