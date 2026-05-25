# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Estágio 2: Build do sistema
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Estágio 3: Execução (Imagem Final)
FROM node:20-alpine AS runner
WORKDIR /app

# Exigência do IFCE: Instalar curl para healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production

# Criar usuário para não rodar como root (segurança)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia a pasta prisma (essencial para as migrations e o schema existirem no container)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copia o binário do Prisma e o node_modules básico para o CLI funcionar
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# --------------------

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ensure-database.mjs ./scripts/ensure-database.mjs

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["./entrypoint.sh"]