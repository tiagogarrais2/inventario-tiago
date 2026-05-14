#!/bin/sh
set -e

echo "==> [entrypoint] Iniciando aplicação..."

# Constrói DATABASE_URL a partir de Docker Secrets (padrão IFCE/compose.prd.yaml)
# se a variável não estiver definida diretamente.
if [ -z "$DATABASE_URL" ]; then
  echo "==> [entrypoint] DATABASE_URL não definida. Construindo a partir de variáveis POSTGRES_*..."

  # Lê a senha do Docker Secret (arquivo) se DB_PASSWORD_FILE estiver definido
  if [ -n "$DB_PASSWORD_FILE" ] && [ -f "$DB_PASSWORD_FILE" ]; then
    POSTGRES_PASSWORD=$(cat "$DB_PASSWORD_FILE")
  fi

  if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "[ERRO] Senha do banco não encontrada. Defina DATABASE_URL, POSTGRES_PASSWORD ou DB_PASSWORD_FILE." >&2
    exit 1
  fi

  DB_HOST="${POSTGRES_SERVER}"
  DB_PORT="${POSTGRES_PORT}"
  DB_NAME="${POSTGRES_DB}"
  DB_USER="${POSTGRES_USER}"

  export DATABASE_URL="postgresql://${DB_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  echo "==> [entrypoint] DATABASE_URL construída para host: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Validação de variáveis obrigatórias — falha com mensagem clara em vez de exit 0 silencioso
echo "==> [entrypoint] Validando variáveis de ambiente obrigatórias..."

if [ -z "$DATABASE_URL" ]; then
  echo "[ERRO] DATABASE_URL não está definida." >&2
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "[ERRO] NEXTAUTH_SECRET não está definida. O NextAuth.js não consegue inicializar sem ela." >&2
  exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
  echo "[ERRO] NEXTAUTH_URL não está definida." >&2
  exit 1
fi

echo "==> [entrypoint] Variáveis de ambiente OK."

# Garante estrutura completa do banco (cria tabela correcoes_item se necessário)
if [ -f "./scripts/ensure-database.mjs" ]; then
  echo "==> [entrypoint] Verificando estrutura do banco de dados..."
  node scripts/ensure-database.mjs
fi

# HOSTNAME=0.0.0.0 é obrigatório para o servidor standalone do Next.js
# escutar em todas as interfaces dentro do container.
# Sem isso, o processo pode encerrar silenciosamente com exit 0.
export HOSTNAME="0.0.0.0"

echo "==> [entrypoint] Iniciando servidor Next.js na porta ${PORT:-3000}..."
exec node server.js
