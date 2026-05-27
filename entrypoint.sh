#!/bin/sh
set -e

echo "==> [entrypoint] Iniciando aplicação v3.3.11..."

# 1. Montagem da DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  if [ -n "$DB_PASSWORD_FILE" ] && [ -f "$DB_PASSWORD_FILE" ]; then
    POSTGRES_PASSWORD=$(cat "$DB_PASSWORD_FILE")
  fi
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}:${POSTGRES_PORT}/${POSTGRES_DB}"
fi

echo "==> [entrypoint] Validando variáveis..."
if [ -z "$DATABASE_URL" ] || [ -z "$NEXTAUTH_SECRET" ]; then
  echo "[ERRO] Variáveis essenciais faltando!" >&2
  exit 1
fi

# 2. Migrações
echo "==> [entrypoint] Aplicando migrações..."
# Tentamos rodar o binário diretamente pelo caminho que o Dockerfile garantiu
if [ -f "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
else
    echo "[ERRO] Binário do prisma não encontrado em ./node_modules/.bin/prisma"
    exit 1
fi

# 3. Scripts extras
if [ -f "./scripts/ensure-database.mjs" ]; then
  node scripts/ensure-database.mjs
fi

export HOSTNAME="0.0.0.0"
echo "==> [entrypoint] Servidor pronto. Iniciando Next.js..."
exec node server.js
