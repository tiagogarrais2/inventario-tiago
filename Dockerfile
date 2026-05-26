# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./

# AJUSTE AQUI: Adicionado --ignore-scripts para evitar que o prisma generate rode sem o schema
RUN npm ci --ignore-scripts

# Estágio 2: Build do sistema
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Aqui sim o prisma generate funciona, pois o arquivo ./prisma/schema.prisma foi copiado acima
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

# 1. Copia o standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 2. Injeta as dependências do Prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# 3. Copia migrations e scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ensure-database.mjs ./scripts/ensure-database.mjs

# 4. Arquivos estáticos e entrypoint
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN chmod +x ./node_modules/.bin/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["./entrypoint.sh"]