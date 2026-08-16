# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Vite incorpora esta URL en los archivos estaticos durante el build.
ARG VITE_API_URL=https://api1.facturacionsv.store
ENV VITE_API_URL=${VITE_API_URL}

RUN case "${VITE_API_URL}" in \
      ""|https://*) ;; \
      *) echo "VITE_API_URL debe estar vacia o comenzar con https://" >&2; exit 1 ;; \
    esac \
    && npm run build

FROM nginx:alpine AS runtime

RUN rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
