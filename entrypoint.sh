#!/bin/sh
set -e

echo "==> [entrypoint] Iniciando aplicação..."

# 1. Montagem da DATABASE_URL (Docker Secrets)
if [ -z "$DATABASE_URL" ]; then
  echo "==> [entrypoint] DATABASE_URL não definida. Construindo a partir de segredos..."

  if [ -n "$DB_PASSWORD_FILE" ] && [ -f "$DB_PASSWORD_FILE" ]; then
    POSTGRES_PASSWORD=$(cat "$DB_PASSWORD_FILE")
  fi

  if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "[ERRO] Senha do banco não encontrada." >&2
    exit 1
  fi

  DB_HOST="${POSTGRES_SERVER}"
  DB_PORT="${POSTGRES_PORT}"
  DB_NAME="${POSTGRES_DB}"
  DB_USER="${POSTGRES_USER}"

  export DATABASE_URL="postgresql://${DB_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# 2. Validação
if [ -z "$DATABASE_URL" ] || [ -z "$NEXTAUTH_SECRET" ] || [ -z "$NEXTAUTH_URL" ]; then
  echo "[ERRO] Variáveis de ambiente obrigatórias faltando!" >&2
  exit 1
fi

echo "==> [entrypoint] Variáveis de ambiente OK."

# 3. Migrações do Prisma
echo "==> [entrypoint] Aplicando migrações do Prisma..."
if [ -f "/app/node_modules/.bin/prisma" ]; then
  # Execução direta para garantir uso do motor .wasm local
  /app/node_modules/.bin/prisma migrate deploy
else
  echo "[ERRO] Binário do Prisma não encontrado!" >&2
  exit 1
fi

# 4. Script de garantia de tabelas
if [ -f "/app/scripts/ensure-database.mjs" ]; then
  echo "==> [entrypoint] Verificando estrutura adicional..."
  node /app/scripts/ensure-database.mjs
fi

export HOSTNAME="0.0.0.0"
echo "==> [entrypoint] Iniciando servidor Next.js..."
exec node server.js