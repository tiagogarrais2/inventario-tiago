# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Estágio 2: Build do sistema
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Define os alvos do binário para o Alpine Linux (musl) usado no IFCE
ENV PRISMA_CLI_BINARY_TARGETS=native,linux-musl-openssl-3.0.x
RUN npx prisma generate
RUN npm run build

# Estágio 3: Execução (Imagem Final)
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 1. Copia o standalone primeiro
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 2. Injeta as dependências do Prisma no node_modules do standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# 3. Copia migrations e scripts auxiliares
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ensure-database.mjs ./scripts/ensure-database.mjs

# 4. Arquivos estáticos e entrypoint
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Garante permissão de execução para o binário do Prisma
RUN chmod +x ./node_modules/.bin/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["./entrypoint.sh"]