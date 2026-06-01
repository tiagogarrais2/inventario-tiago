#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh — build, commit, tag, push git e push docker
# Uso: npm run deploy "mensagem resumo das alterações"
# ---------------------------------------------------------------------------

REGISTRY="gitlab.ifce.edu.br:5050/projetos/sistema-informatizado-de-inventario-patrimonial"

# 1. Valida argumento
MENSAGEM="${1:-}"
if [[ -z "$MENSAGEM" ]]; then
  echo "Erro: informe a mensagem de commit."
  echo "Uso: npm run deploy \"mensagem resumo das alterações\""
  exit 1
fi

# 2. Build
echo ""
echo "==> [1/6] npm run build"
npm run build

# 3. Descobre próxima versão patch
ULTIMA_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
VERSAO_LIMPA="${ULTIMA_TAG#v}"   # remove o "v" inicial
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSAO_LIMPA"
NOVO_PATCH=$(( PATCH + 1 ))
NOVA_VERSAO="${MAJOR}.${MINOR}.${NOVO_PATCH}"
NOVA_TAG="v${NOVA_VERSAO}"

# 4. Exibe resumo e pede confirmação
echo ""
echo "-------------------------------------------------------"
echo "  Mensagem : $MENSAGEM"
echo "  Tag atual : $ULTIMA_TAG  →  nova tag: $NOVA_TAG"
echo "  Imagem   : $REGISTRY:$NOVA_VERSAO"
echo "-------------------------------------------------------"
echo ""
read -rp "Confirma e faz push? [s/N] " RESP
if [[ "$RESP" != "s" && "$RESP" != "S" ]]; then
  echo "Cancelado."
  exit 0
fi

# 5. Git commit
echo ""
echo "==> [2/6] git pull --rebase && git add -A && git commit"
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git stash --include-untracked
  STASHED=1
fi
git pull --rebase origin main
if [ "$STASHED" -eq 1 ]; then
  git stash pop
fi
git add -A
if git diff --cached --quiet; then
  echo "Nada para commitar, prosseguindo..."
else
  git commit -m "$MENSAGEM"
fi

# 6. Git tag
echo ""
echo "==> [3/6] git tag $NOVA_TAG"
git tag -a "$NOVA_TAG" -m "$MENSAGEM"

# 7. Git push
echo ""
echo "==> [4/6] git push && git push --tags"
git push
git push --tags

# 8. Docker build
echo ""
echo "==> [5/6] docker build -t $REGISTRY:$NOVA_VERSAO"
docker build -t "$REGISTRY:$NOVA_VERSAO" .

# 9. Docker push
echo ""
echo "==> [6/6] docker push $REGISTRY:$NOVA_VERSAO"
docker push "$REGISTRY:$NOVA_VERSAO"

echo ""
echo "Deploy concluído! Versão $NOVA_TAG publicada."
