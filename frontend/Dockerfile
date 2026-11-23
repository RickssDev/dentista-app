# Etapa 1: Construir React con Vite
FROM node:22.23.4-alpine3.24@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# La API se consumirá por Nginx
ARG VITE_API_URL=/api/v1

ENV VITE_API_URL=$VITE_API_URL

# Client ID público de Google (botón "Continuar con Google"). Vite lo incrusta al construir y
# .env no se copia a la imagen: llega como argumento de build (docker-compose.prod.yml)
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Etapa 2: Servir React con Nginx
FROM nginx:1.31.9-alpine3.24@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cabeceras de seguridad que incluye cada location de nginx.conf (spec 024)
COPY nginx-seguridad.conf /etc/nginx/snippets/seguridad.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]