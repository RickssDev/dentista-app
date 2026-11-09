#!/usr/bin/env bash
# Respaldo de MySQL y de uploads/. Se ejecuta en el servidor desde cualquier carpeta.
# Variables opcionales: COMPOSE_FILE, ENV_FILE, DESTINO, DIAS.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
DESTINO="${DESTINO:-backups}"
DIAS="${DIAS:-14}"

# Compose necesita el archivo para resolver las variables del compose de producción.
ARCHIVO_ENV=()
if [ -f "$ENV_FILE" ]; then
  ARCHIVO_ENV=(--env-file "$ENV_FILE")
fi

FECHA="$(date +%Y%m%d-%H%M%S)"
umask 077
mkdir -p "$DESTINO"

# Se escribe primero en un temporal: un volcado fallido nunca queda como respaldo válido.
BASE="$DESTINO/mysql-$FECHA.sql.gz"
trap 'rm -f "$BASE.tmp"' EXIT
# Credenciales y base salen del entorno del contenedor: nada sensible pasa por la línea de comandos.
docker compose "${ARCHIVO_ENV[@]}" -f "$COMPOSE_FILE" exec -T db sh -c \
  'MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-}" exec mysqldump -uroot --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  | gzip > "$BASE.tmp"
mv "$BASE.tmp" "$BASE"

if [ -d uploads ]; then
  tar -czf "$DESTINO/uploads-$FECHA.tar.gz" uploads
fi

find "$DESTINO" -type f \( -name 'mysql-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$DIAS" -delete

echo "Respaldo terminado: $BASE"
