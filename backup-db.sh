#!/usr/bin/env bash

# ---------------------------------------------------------------------------
# backup-db.sh — Backup seguro do Postgres (IFCE)
# ---------------------------------------------------------------------------

# 1. Carregar variáveis de ambiente do .env, se existir
if [ -f .env ]; then
  set -o allexport
  # shellcheck source=/dev/null
  source .env
  set +o allexport
fi

# 2. Configurações (podem vir do .env ou ser definidas manualmente)
HOST=${DB_HOST:-}
USER=${DB_USER:-}
DB_NAME=${DB_NAME:-}
PORT=${DB_PORT:-}
SENHA=${DB_PASSWORD:-}

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$DB_NAME" ] || [ -z "$PORT" ] || [ -z "$SENHA" ]; then
  echo "❌ Variáveis de conexão ausentes. Verifique o arquivo .env ou exporte DB_HOST, DB_USER, DB_NAME, DB_PORT e DB_PASSWORD."
  exit 1
fi

# 3. Gerar nome do arquivo com data e hora
DATA_HORA=$(date +%Y%m%d-%H%M)
ARQUIVO_SAIDA="backup-inventario-${DATA_HORA}.sql"

echo "==> Iniciando backup do banco: $DB_NAME..."
echo "==> Servidor: $HOST"

# 4. Executar o pg_dump usando a variável de ambiente PGPASSWORD
# Isso evita erros de "percent-encoded" e símbolos especiais
export PGPASSWORD="$SENHA"
export PGSSLMODE=disable

if pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_NAME" \
   --no-owner \
   --no-privileges \
   -f "$ARQUIVO_SAIDA"; then
    echo ""
    echo "✅ Sucesso! Backup salvo em: $ARQUIVO_SAIDA"
    ls -lh "$ARQUIVO_SAIDA"
else
    echo ""
    echo "❌ Erro ao realizar o backup."
    exit 1
fi

# 5. Limpar a senha da memória
unset PGPASSWORD
