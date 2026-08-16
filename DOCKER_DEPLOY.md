# Despliegue Docker del frontend

Esta imagen compila React/Vite y sirve el resultado con Nginx. La URL de la API queda
incorporada durante el build; no es una variable que pueda cambiarse con `docker run`.

## Construir

Desde esta carpeta:

```bash
docker build --pull \
  --build-arg VITE_API_URL=https://api1.facturacionsv.store \
  -t facturacion-web:1.0.0 .
```

El `Dockerfile` ya usa `https://api1.facturacionsv.store` como valor predeterminado, pero
pasarlo expresamente deja el despliegue auditable. Si cambia la URL de la API, hay que
reconstruir la imagen.

Antes del build de produccion se recomienda validar:

```bash
npm ci
npm test
npm run lint
npm run build
```

## Ejecutar en la red del proxy

Sustituir `<NOMBRE_RED>` por la red Docker a la que ya esta conectado el proxy inverso:

```bash
docker run -d \
  --name facturacion-web \
  --restart unless-stopped \
  --network <NOMBRE_RED> \
  --read-only \
  --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=16m \
  --tmpfs /var/run:rw,noexec,nosuid,size=1m \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --cap-drop ALL \
  --cap-add CHOWN \
  --cap-add DAC_OVERRIDE \
  --cap-add SETGID \
  --cap-add SETUID \
  --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges:true \
  facturacion-web:1.0.0
```

El upstream del proxy es:

```text
http://facturacion-web:80
```

El frontend no necesita volumen persistente. Todo su contenido es estatico e inmutable;
preferencias y tokens de sesion se guardan en el `localStorage` del navegador del usuario.

## Relacion con la API

La API se ejecuta desde el proyecto Spring Boot con el contenedor `facturacion-api` y el
upstream interno `http://facturacion-api:8080`. En Nginx, el host externo debe ser
`api1.facturacionsv.store`, con TLS y los encabezados `Host`, `X-Forwarded-For` y
`X-Forwarded-Proto` reenviados.

Como el navegador accede a otro origen, la API debe recibir:

```dotenv
CORS_ALLOWED_ORIGINS=https://DOMINIO-REAL-DEL-FRONTEND
```

Use el origen exacto, sin ruta ni barra final. Si hay mas de uno, se separan con coma.

## Verificar

```bash
docker ps --filter name=facturacion-web
docker logs --tail 100 facturacion-web
docker exec facturacion-web wget -q -O - http://127.0.0.1/healthz
```
