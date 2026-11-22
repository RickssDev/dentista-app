# Etapa 1: Construir React con Vite
FROM node:22-alpine AS build

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
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cabeceras de seguridad que incluye cada location de nginx.conf (spec 024)
COPY nginx-seguridad.conf /etc/nginx/snippets/seguridad.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]