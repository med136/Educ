# Étape 1: Build
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm install

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code
COPY . .

# Build TypeScript
RUN npm run build
RUN npm prune --omit=dev

# Étape 2: Production
FROM node:18-bullseye-slim AS production

WORKDIR /app

# Installer les outils nécessaires
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nodejs

# Copier depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Créer le dossier de logs avec les bons droits pour l'utilisateur runtime
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Basculer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]

# Étape 3: Development
FROM node:18-bullseye-slim AS development

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (dev incluses)
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de développement
CMD ["npm", "run", "dev"]

# Stage final par défaut pour les plateformes qui ne précisent pas --target
FROM production AS release
