# Estágio 1: Deps
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Estágio 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# O binaryTargets deve estar no seu schema.prisma como conversamos
RUN npx prisma generate
RUN npm run build

# Estágio 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# A mágica do standalone:
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# CORREÇÃO CRÍTICA: Injetando o Prisma onde o Standalone e o Entrypoint esperam
# Copiamos para a raiz e para dentro do node_modules gerado pelo standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Migrations e Scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts/ensure-database.mjs ./scripts/ensure-database.mjs

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN chmod +x ./node_modules/.bin/prisma

# Garantia de permissão para o usuário nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["./entrypoint.sh"]