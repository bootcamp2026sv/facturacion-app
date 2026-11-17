@echo off
setlocal
cd /d "%~dp0.."

echo Configurando URL del backend Tomcat...
> .env.production echo VITE_API_URL=http://localhost:9000/Facturacion

echo [1/4] Instalando dependencias npm...
call npm install
if errorlevel 1 goto :error

echo [2/4] Compilando frontend...
call npm run build
if errorlevel 1 goto :error

echo [3/4] Registrando inicio automatico de Windows...
call "%~dp0registrar-frontend-inicio.cmd"
if errorlevel 1 goto :error

echo [4/4] Iniciando servidor frontend...
schtasks /Run /TN "Facturacion Frontend"
if errorlevel 1 goto :error
echo.
echo Configuracion completada. Frontend: http://localhost:5173
exit /b 0

:error
echo.
echo La configuracion no pudo completarse. Revisa el mensaje anterior.
pause
exit /b 1
