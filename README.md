# EduShare – Plateforme de partage de documents éducatifs

> **Version** : 1.0.0  
> **Année** : 2026  
> **Stack** : React · Node.js · PostgreSQL · Prisma · Socket.io

## 📋 Description

EduShare est une plateforme web collaborative qui permet aux enseignants et aux élèves de :

- Créer et rejoindre des classes virtuelles via un code d’invitation.
- Déposer, partager et consulter des documents pédagogiques (PDF, présentations, images, vidéos…).
- Suivre les mises à jour via des notifications temps réel et par email.
- Centraliser les échanges autour des cours (messages de classe, commentaires sur documents).

## 🏗️ Architecture

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS.
- **Backend** : Node.js + Express + TypeScript + Prisma ORM.
- **Base de données** : PostgreSQL.
- **Authentification** : JWT (access + refresh tokens).
- **Stockage fichiers** : S3 / MinIO (ou stockage local selon `STORAGE_TYPE`).
- **Temps réel** : Socket.io (notifications, messages de classe).
- **Observabilité** : Winston pour les logs, métriques Prometheus optionnelles sur `/metrics`.

## 🚀 Démarrage rapide (développement)

### Prérequis

- Node.js 18+ et npm 9+.
- Docker et Docker Compose (recommandé pour Postgres / Redis / MinIO).

### Installation

```bash
# 1. Cloner le projet
git clone <url-du-projet>
cd educ

# 2. Installer les dépendances racine (scripts, etc.)
npm install

# 3. Initialiser l’environnement complet (DB + backend + frontend)
./scripts/init-project.sh

# 4. Copier et adapter la configuration
cp .env.example .env
# Éditer .env avec vos valeurs (JWT_SECRET, DATABASE_URL, SMTP_*, STORAGE_TYPE…)

# 5. Lancer l’environnement de développement
./scripts/start-dev.sh
```

Par défaut, cela démarre :

- Backend sur `http://localhost:3000` (`/api-docs` pour la documentation Swagger).
- Frontend sur `http://localhost:5173`.
- PostgreSQL, Redis et MinIO via Docker Compose.

## ⚙️ Variables d’environnement principales

Dans le fichier `.env` à la racine du projet :

- **Base de données**
	- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` (utilisés par Docker Compose).
	- `DATABASE_URL` (URL Prisma/PostgreSQL côté backend).
- **Sécurité**
	- `JWT_SECRET`, `JWT_REFRESH_SECRET` (obligatoires en production, vérifiés au démarrage).
	- `CORS_ORIGIN`, `FRONTEND_URL`.
- **Stockage fichiers**
	- `STORAGE_TYPE` : `local`, `s3` ou `minio`.
	- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, `STORAGE_ENDPOINT` (pour S3/MinIO).
- **Email / notifications**
	- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.
- **Métriques et logs**
	- `METRICS_ENABLED=true` pour exposer `/metrics`.
	- `LOG_LEVEL` (par défaut `info`).

## 📁 Structure du projet

```text
educ/
├── backend/           # API Node.js (Express, Prisma, Socket.io)
├── frontend/          # Application React (Vite, Tailwind)
├── database/          # Scripts d’init PostgreSQL
├── docs/              # Documentation technique et fonctionnelle
├── scripts/           # Scripts d’automatisation (init, build, start…)
├── logs/              # Logs applicatifs
├── docker-compose.yml # Stack Docker (Postgres, Redis, MinIO, backend, frontend…)
└── .env(.example)     # Configuration environnement
```

## 🔧 Commandes utiles

Depuis le dossier `educ` :

```bash
# Démarrage complet en développement
./scripts/start-dev.sh

# Construction pour la production + tests
./scripts/build-production.sh all --docker

# Lancer uniquement les tests
cd backend && npm test      # Backend (Jest)
cd ../frontend && npm test  # Frontend (Vitest)
```

### Backend

```bash
cd backend

npm run dev      # API en développement (port 3000)
npm run build    # Build TypeScript dans dist/
npm start        # Lancement en mode production (après build)
```

### Frontend

```bash
cd frontend

npm run dev      # Frontend en développement (Vite, port 5173)
npm run build    # Build production dans dist/
npm run preview  # Prévisualisation du build
```

## 👥 Parcours utilisateurs clés

- **Enseignant**
	- Créer un compte via `/register`, se connecter via `/login`.
	- Créer une classe (page “Classes”), partager le code avec les élèves.
	- Importer des documents dans une classe, les partager à des élèves spécifiques ou les rendre publics.
	- Suivre les retours via les commentaires, messages de classe et notifications.

- **Élève**
	- Créer un compte, rejoindre une classe via un code.
	- Accéder à la page “Documents” pour voir les ressources partagées.
	- Recevoir des notifications temps réel et par email lorsqu’un nouveau document est partagé.

## 📦 Déploiement (aperçu)

- Builder les images :

```bash
./scripts/build-production.sh all --docker
```

- Adapter `docker-compose.yml` ou créer un `docker-compose.prod.yml` pour utiliser :
	- `edushare-backend:latest` comme image backend.
	- `edushare-frontend:latest` comme image frontend.

- Démarrer la stack :

```bash
docker compose -f docker-compose.yml up -d
```

Pour un déploiement avancé (Traefik, HTTPS, CI/CD), se référer aux fichiers dans `docs/deployment/`.

## 📄 Licence

© 2026 Équipe Éducative. Tous droits réservés.
