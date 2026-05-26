#!/bin/sh
set -e

echo "==> [entrypoint] Iniciando aplicação..."

# Constrói DATABASE_URL a partir de Docker Secrets
if [ -z "$DATABASE_URL" ]; then
  echo "==> [entrypoint] DATABASE_URL não definida. Construindo a partir de variáveis POSTGRES_*..."

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
  echo "==> [entrypoint] DATABASE_URL construída para host: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Validação de variáveis obrigatórias
echo "==> [entrypoint] Validando variáveis de ambiente obrigatórias..."

if [ -z "$DATABASE_URL" ]; then echo "[ERRO] DATABASE_URL não definida." >&2; exit 1; fi
if [ -z "$NEXTAUTH_SECRET" ]; then echo "[ERRO] NEXTAUTH_SECRET não definida." >&2; exit 1; fi
if [ -z "$NEXTAUTH_URL" ]; then echo "[ERRO] NEXTAUTH_URL não definida." >&2; exit 1; fi

echo "==> [entrypoint] Variáveis de ambiente OK."

# --- ALTERAÇÃO AQUI ---
echo "==> [entrypoint] Aplicando migrações do Prisma..."
# Usamos o caminho direto para o binário que copiamos no Dockerfile
# Isso evita que o npx tente baixar o prisma e falhe por falta de internet ou arquivos .wasm
./node_modules/.bin/prisma migrate deploy
# ----------------------

# Garante estrutura completa do banco
if [ -f "./scripts/ensure-database.mjs" ]; then
  echo "==> [entrypoint] Verificando estrutura do banco de dados..."
  node scripts/ensure-database.mjs
fi

export HOSTNAME="0.0.0.0"

echo "==> [entrypoint] Iniciando servidor Next.js na porta ${PORT:-3000}..."
exec node server.js