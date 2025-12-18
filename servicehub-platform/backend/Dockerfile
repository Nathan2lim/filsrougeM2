# ============================================
# DOCKERFILE PRODUCTION - SERVICEHUB
# Multi-stage build optimisé avec versioning
# ============================================

# Arguments de build
ARG NODE_VERSION=20
ARG VERSION=1.0.0
ARG BUILD_DATE=unknown

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:${NODE_VERSION}-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev incluses pour le build)
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Copier les dépendances du stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

# Générer le client Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Supprimer les dépendances de dev
RUN npm prune --production

# ============================================
# Stage 3: Production
# ============================================
FROM node:${NODE_VERSION}-alpine AS production

# Arguments disponibles dans ce stage
ARG VERSION
ARG BUILD_DATE

# Labels OCI
LABEL org.opencontainers.image.title="ServiceHub Backend"
LABEL org.opencontainers.image.description="ServiceHub Platform - Backend NestJS API"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.vendor="ServiceHub Team"
LABEL org.opencontainers.image.source="https://github.com/Nathan2lim/filsrougeM2"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV APP_VERSION=${VERSION}

# Installer dumb-init pour une meilleure gestion des signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copier les fichiers de production
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Changer d'utilisateur
USER nestjs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Point d'entrée avec dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Commande par défaut
CMD ["node", "dist/main.js"]
