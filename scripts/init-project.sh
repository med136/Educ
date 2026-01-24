#!/bin/bash

# ============================================
# INIT-PROJECT.SH
# Script d'initialisation professionnel
# Plateforme de Partage de Documents Éducatifs
# ============================================

set -e  # Sortir en cas d'erreur

# ============================================
# CONFIGURATION
# ============================================

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables du projet
PROJECT_NAME="EduShare"
PROJECT_VERSION="1.0.0"
AUTHOR="Équipe Éducative"
CURRENT_YEAR=$(date +%Y)

# Répertoires
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$BASE_DIR/scripts"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"
DOCS_DIR="$BASE_DIR/docs"
LOGS_DIR="$BASE_DIR/logs"

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

# Charger les utilitaires s'ils existent déjà (première exécution : ils n'existent pas encore)
if [ -f "$SCRIPTS_DIR/utils.sh" ]; then
  source "$SCRIPTS_DIR/utils.sh"
else
  echo -e "${YELLOW}⚠ utils.sh non trouvé, poursuite de l'initialisation${NC}"
fi

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║   🚀 Initialisation : $PROJECT_NAME v$PROJECT_VERSION    ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${MAGENTA}▶ $1${NC}"
    echo "══════════════════════════════════════════════════"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_step "Vérification des prérequis"
    
    local missing_tools=()
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js (v18+)")
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        print_info "Node.js: v$NODE_VERSION"
    fi
    
    # Vérifier npm/yarn
    if command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
        print_info "Gestionnaire de paquets: Yarn"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        print_info "Gestionnaire de paquets: npm"
    else
        missing_tools+=("npm ou yarn")
    fi
    
    # Vérifier Docker (optionnel)
    if command -v docker &> /dev/null; then
        print_info "Docker: Disponible"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker: Non installé (optionnel)"
        DOCKER_AVAILABLE=false
    fi
    
    # Vérifier Git
    if command -v git &> /dev/null; then
        print_info "Git: Disponible"
    else
        missing_tools+=("Git")
    fi
    
    # Vérifier PostgreSQL (optionnel)
    if command -v psql &> /dev/null; then
        print_info "PostgreSQL: Disponible"
        PSQL_AVAILABLE=true
    else
        print_warning "PostgreSQL: Non installé (optionnel)"
        PSQL_AVAILABLE=false
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Outils manquants:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo -e "\nVeuillez installer les outils manquants avant de continuer."
        exit 1
    fi
    
    print_success "Tous les prérequis sont satisfaits"
}

create_project_structure() {
    print_step "Création de la structure du projet"
    
    local dirs=(
        "$BACKEND_DIR/src/controllers"
        "$BACKEND_DIR/src/models"
        "$BACKEND_DIR/src/routes"
        "$BACKEND_DIR/src/middleware"
        "$BACKEND_DIR/src/services"
        "$BACKEND_DIR/src/utils"
        "$BACKEND_DIR/tests"
        "$BACKEND_DIR/prisma"
        
        "$FRONTEND_DIR/src/components/common"
        "$FRONTEND_DIR/src/components/documents"
        "$FRONTEND_DIR/src/components/layout"
        "$FRONTEND_DIR/src/pages/Dashboard"
        "$FRONTEND_DIR/src/pages/Classroom"
        "$FRONTEND_DIR/src/pages/Profile"
        "$FRONTEND_DIR/src/hooks"
        "$FRONTEND_DIR/src/services"
        "$FRONTEND_DIR/src/store"
        "$FRONTEND_DIR/src/types"
        "$FRONTEND_DIR/src/utils"
        "$FRONTEND_DIR/public"
        
        "$DOCS_DIR/api"
        "$DOCS_DIR/database"
        "$DOCS_DIR/deployment"
        
        "$LOGS_DIR"
        "$SCRIPTS_DIR"
        ".github/workflows"
        ".docker"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        print_info "Créé: $dir"
    done
    
    print_success "Structure de projet créée"
}

generate_readme() {
    print_step "Génération de la documentation"
    
    cat > "$BASE_DIR/README.md" << EOF
# $PROJECT_NAME - Plateforme de Partage de Documents Éducatifs

> **Version**: $PROJECT_VERSION  
> **Année**: $CURRENT_YEAR  
> **Auteur**: $AUTHOR

## 📋 Description

Plateforme web collaborative permettant le partage sécurisé de documents entre enseignants et élèves, avec gestion complète de projets éducatifs.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL + Prisma ORM
- **Authentification**: JWT + Refresh Tokens
- **Stockage**: AWS S3 (ou MinIO pour le développement)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Installation

\`\`\`bash
# 1. Cloner le projet
git clone <url-du-projet>
cd edu-share

# 2. Installation complète
./scripts/init-project.sh

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 4. Démarrer en mode développement
./scripts/start-dev.sh
\`\`\`

## 📁 Structure du Projet

\`\`\`
$PROJECT_NAME/
├── frontend/           # Application React
├── backend/            # API Node.js
├── docs/               # Documentation
├── scripts/            # Scripts d'automatisation
├── .github/            # CI/CD workflows
└── .docker/            # Configuration Docker
\`\`\`

## 🔧 Commandes Utiles

\`\`\`bash
# Développement
npm run dev           # Démarrer frontend + backend
npm run dev:frontend  # Démarrer seulement le frontend
npm run dev:backend   # Démarrer seulement le backend

# Tests
npm test              # Lancer tous les tests
npm run test:frontend # Tests frontend
npm run test:backend  # Tests backend

# Construction
npm run build         # Build production
npm run deploy        # Déploiement
\`\`\`

## 📄 Licence

© $CURRENT_YEAR $AUTHOR. Tous droits réservés.
EOF
    
    print_success "README.md généré"
}

generate_env_files() {
    print_step "Création des fichiers d'environnement"
    
    # Fichier .env.example
    cat > "$BASE_DIR/.env.example" << 'EOF'
# ============================================
# CONFIGURATION ENVIRONNEMENT - $PROJECT_NAME
# ============================================

# APPLICATION
NODE_ENV=development
APP_NAME=EduShare
APP_VERSION=1.0.0
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
API_PREFIX=/api/v1

# BASE DE DONNÉES
DATABASE_URL=postgresql://user:password@localhost:5432/edushare
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edushare
DB_USER=edushare_user
DB_PASSWORD=change_me_secure_password

# JWT
JWT_SECRET=change_me_to_a_very_secure_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=change_me_to_a_very_secure_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# STOCKAGE FICHIERS
STORAGE_TYPE=local # local, s3, minio
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-3
AWS_BUCKET_NAME=edushare-documents
MAX_FILE_SIZE=10485760 # 10MB

# EMAIL (pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@edushare.com

# SÉCURITÉ
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# LOGGING
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF
    
    # Fichier .gitignore
    cat > "$BASE_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js
yarn.lock
package-lock.json

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Build outputs
dist/
build/
.out/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite
prisma/migrations/
!prisma/migrations/.gitkeep

# Docker
docker-compose.override.yml

# Temporary
tmp/
temp/
EOF
    
    cp "$BASE_DIR/.env.example" "$BASE_DIR/.env"
    print_warning "Fichier .env créé - PENSEZ À MODIFIER LES SECRETS !"
    print_success "Fichiers d'environnement générés"
}

setup_frontend() {
    print_step "Configuration du Frontend React + TypeScript"
    
    cd "$FRONTEND_DIR"
    
    # Initialiser package.json
    cat > package.json << EOF
{
  "name": "$PROJECT_NAME-frontend",
  "version": "$PROJECT_VERSION",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,scss}\"",
    "type-check": "tsc --noEmit",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "@tanstack/react-query": "^5.12.2",
    "axios": "^1.6.2",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "react-dropzone": "^14.2.3",
    "react-pdf": "^7.7.0",
    "socket.io-client": "^4.7.2",
    "zustand": "^4.4.7",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^10.16.16"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/ui": "^1.1.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "storybook": "^7.6.6",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vitest": "^1.1.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
    
    # Vite config
    cat > vite.config.ts << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react'],
          utils: ['date-fns', 'clsx', 'axios'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
EOF
    
    # TypeScript config
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@store/*": ["./src/store/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
    
    cat > tsconfig.node.json << EOF
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
    
    # ESLint config
    cat > .eslintrc.cjs << EOF
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
EOF
    
    # Tailwind config
    cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
EOF
    
    # Fichier CSS principal
    cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --primary: #2563eb;
    --secondary: #7c3aed;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
  }

  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }

  /* Scrollbar personnalisée */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg font-medium 
           hover:bg-primary-700 focus:outline-none focus:ring-2 
           focus:ring-primary-500 focus:ring-offset-2 
           transition-colors duration-200;
  }

  .btn-secondary {
    @apply bg-white text-gray-700 px-4 py-2 rounded-lg font-medium 
           border border-gray-300 hover:bg-gray-50 focus:outline-none 
           focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
           transition-colors duration-200;
  }

  .card {
    @apply bg-white rounded-xl shadow-md p-6 border border-gray-200;
  }

  .input-field {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg 
           focus:outline-none focus:ring-2 focus:ring-primary-500 
           focus:border-transparent transition-all duration-200;
  }

  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  .badge-success {
    @apply bg-green-100 text-green-800;
  }

  .badge-warning {
    @apply bg-yellow-100 text-yellow-800;
  }

  .badge-danger {
    @apply bg-red-100 text-red-800;
  }

  .badge-info {
    @apply bg-blue-100 text-blue-800;
  }
}

@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }

  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }

  .text-balance {
    text-wrap: balance;
  }
}
EOF
    
    # Fichier main.tsx
    cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { store } from './store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
EOF
    
    # Fichier App.tsx
    cat > src/App.tsx << 'EOF'
import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'

// Lazy loading des pages
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))
const Login = React.lazy(() => import('./pages/Auth/Login'))
const Register = React.lazy(() => import('./pages/Auth/Register'))
const Classroom = React.lazy(() => import('./pages/Classroom/Classroom'))
const Documents = React.lazy(() => import('./pages/Documents/Documents'))
const Profile = React.lazy(() => import('./pages/Profile/Profile'))
const Admin = React.lazy(() => import('./pages/Admin/Admin'))

const ProtectedRoute = ({ children, roles }: { 
  children: React.ReactNode
  roles?: string[]
}) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Routes protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="classroom/:id" element={<Classroom />} />
          <Route path="documents" element={<Documents />} />
          <Route path="profile" element={<Profile />} />
          <Route 
            path="admin/*" 
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
EOF
    
    # Installer les dépendances
    print_info "Installation des dépendances frontend..."
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install --silent
    else
        npm install --silent
    fi
    
    print_success "Frontend React + TypeScript configuré"
    cd "$BASE_DIR"
}

setup_backend() {
    print_step "Configuration du Backend Node.js + TypeScript"
    
    cd "$BACKEND_DIR"
    
    # package.json backend
    cat > package.json << EOF
{
  "name": "$PROJECT_NAME-backend",
  "version": "$PROJECT_VERSION",
  "description": "API REST pour la plateforme éducative",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "aws-sdk": "^2.1524.0",
    "socket.io": "^4.7.2",
    "nodemailer": "^6.9.8",
    "pdf-parse": "^1.1.1",
    "uuid": "^9.0.1",
    "zod": "^3.22.4",
    "@prisma/client": "^5.7.0",
    "swagger-ui-express": "^5.0.0",
    "yamljs": "^0.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/bcrypt": "^5.0.1",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.5",
    "@types/nodemailer": "^6.4.14",
    "@types/supertest": "^6.0.2",
    "@types/swagger-ui-express": "^4.1.6",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "prettier": "^3.1.1",
    "prisma": "^5.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF
    
    # tsconfig.json backend
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@controllers/*": ["src/controllers/*"],
      "@models/*": ["src/models/*"],
      "@routes/*": ["src/routes/*"],
      "@middleware/*": ["src/middleware/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
    
    # Fichier principal backend
    cat > src/index.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDatabase } from './utils/database'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/logger'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import documentRoutes from './routes/document.routes'
import classroomRoutes from './routes/classroom.routes'
import adminRoutes from './routes/admin.routes'
import { setupSwagger } from './utils/swagger'
import { setupSocket } from './services/socket.service'
import logger from './utils/logger'

// Charger les variables d'environnement
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

// Configuration
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware de base
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS config
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
})
app.use('/api/', limiter)

// Logging
app.use(requestLogger)

// Routes de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Setup Swagger
setupSwagger(app)

// Routes API
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/documents', documentRoutes)
app.use('/api/v1/classrooms', classroomRoutes)
app.use('/api/v1/admin', adminRoutes)

// Setup Socket.io
setupSocket(io)

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
  })
})

// Error handler (doit être le dernier middleware)
app.use(errorHandler)

// Démarrer le serveur
const startServer = async () => {
  try {
    // Connecter à la base de données
    await connectDatabase()
    
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`)
      logger.info(`📚 Documentation API: http://localhost:${PORT}/api-docs`)
      logger.info(`🌍 Environnement: ${NODE_ENV}`)
      logger.info(`🎯 Frontend: ${process.env.FRONTEND_URL}`)
    })
  } catch (error) {
    logger.error('Échec du démarrage du serveur:', error)
    process.exit(1)
  }
}

// Gestion des signaux d'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt du serveur...')
  httpServer.close(() => {
    logger.info('Serveur arrêté')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt du serveur...')
  httpServer.close(() => {
    logger.info('Serveur arrêté')
    process.exit(0)
  })
})

// Démarrer l'application
if (require.main === module) {
  startServer()
}

export { app, io }
EOF
    
    # Fichier Prisma schema
    cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  TEACHER
  ADMIN
  PARENT
}

enum DocumentType {
  PDF
  DOCX
  PPTX
  IMAGE
  VIDEO
  OTHER
}

enum PermissionLevel {
  VIEW
  COMMENT
  EDIT
  OWNER
}

model User {
  id                String        @id @default(uuid())
  email             String        @unique
  username          String?       @unique
  password          String
  firstName         String
  lastName          String
  role              UserRole
  avatar            String?
  isVerified        Boolean       @default(false)
  isActive          Boolean       @default(true)
  
  // Relations
  ownedDocuments    Document[]    @relation("DocumentOwner")
  sharedDocuments   DocumentShare[]
  classrooms        Classroom[]
  createdClasses    Classroom[]   @relation("ClassroomCreator")
  messages          Message[]
  notifications     Notification[]
  
  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  lastLogin         DateTime?
  
  // Indexes
  @@index([email])
  @@index([role])
  @@fulltext([firstName, lastName, email])
}

model Document {
  id                String        @id @default(uuid())
  title             String
  description       String?
  fileName          String
  fileType          DocumentType
  fileSize          Int           // en octets
  fileUrl           String        @unique
  thumbnailUrl      String?
  
  // Relations
  ownerId           String
  owner             User          @relation("DocumentOwner", fields: [ownerId], references: [id])
  classroomId       String?
  classroom         Classroom?    @relation(fields: [classroomId], references: [id])
  shares            DocumentShare[]
  comments          Comment[]
  versions          DocumentVersion[]
  
  // Métadonnées
  tags              String[]
  isPublic          Boolean       @default(false)
  downloadCount     Int           @default(0)
  viewCount         Int           @default(0)
  
  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  deletedAt         DateTime?
  
  // Indexes
  @@index([ownerId])
  @@index([classroomId])
  @@index([fileType])
  @@index([createdAt])
  @@fulltext([title, description])
}

model DocumentShare {
  id                String        @id @default(uuid())
  
  // Relations
  documentId        String
  document          Document      @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Permissions
  permission        PermissionLevel
  
  // Timestamps
  sharedAt          DateTime      @default(now())
  expiresAt         DateTime?
  
  @@unique([documentId, userId])
  @@index([userId])
  @@index([permission])
}

model DocumentVersion {
  id                String        @id @default(uuid())
  
  // Relations
  documentId        String
  document          Document      @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  // Version info
  versionNumber     Int
  fileName          String
  fileUrl           String
  fileSize          Int
  changes           String?
  
  // Timestamps
  createdAt         DateTime      @default(now())
  
  @@unique([documentId, versionNumber])
}

model Classroom {
  id                String        @id @default(uuid())
  name              String
  description       String?
  code              String        @unique
  subject           String
  gradeLevel        String
  
  // Relations
  creatorId         String
  creator           User          @relation("ClassroomCreator", fields: [creatorId], references: [id])
  students          User[]
  documents         Document[]
  
  // Configuration
  isActive          Boolean       @default(true)
  maxStudents       Int           @default(50)
  
  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Indexes
  @@index([creatorId])
  @@index([code])
  @@fulltext([name, description, subject])
}

model Comment {
  id                String        @id @default(uuid())
  content           String
  
  // Relations
  documentId        String
  document          Document      @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId            String
  user              User          @relation(fields: [userId], references: [id])
  parentId          String?
  parent            Comment?      @relation("CommentReplies", fields: [parentId], references: [id])
  replies           Comment[]     @relation("CommentReplies")
  
  // Metadata
  isEdited          Boolean       @default(false)
  
  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([documentId])
  @@index([userId])
}

model Message {
  id                String        @id @default(uuid())
  content           String
  isEdited          Boolean       @default(false)
  
  // Relations
  userId            String
  user              User          @relation(fields: [userId], references: [id])
  classroomId       String
  classroom         Classroom     @relation(fields: [classroomId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([classroomId])
  @@index([createdAt])
}

model Notification {
  id                String        @id @default(uuid())
  title             String
  message           String
  type              String        // "document", "comment", "system", etc.
  isRead            Boolean       @default(false)
  data              Json?         // Données supplémentaires
  
  // Relations
  userId            String
  user              User          @relation(fields: [userId], references: [id])
  
  // Timestamps
  createdAt         DateTime      @default(now())
  readAt            DateTime?
  
  @@index([userId, isRead])
  @@index([createdAt])
}

// Table de session (pour scaling futur)
model Session {
  id                String        @id @default(uuid())
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  token             String        @unique
  userAgent         String?
  ipAddress         String?
  expiresAt         DateTime
  
  createdAt         DateTime      @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}
EOF
    
    # Installer les dépendances backend
    print_info "Installation des dépendances backend..."
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install --silent
    else
        npm install --silent
    fi
    
    print_success "Backend Node.js + TypeScript configuré"
    cd "$BASE_DIR"
}

setup_docker() {
    print_step "Configuration Docker"
    
    # docker-compose.yml
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  # Base de données PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: edushare-db
    environment:
      POSTGRES_DB: \${DB_NAME:-edushare}
      POSTGRES_USER: \${DB_USER:-edushare_user}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-change_me}
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - edushare-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-edushare_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Adminer pour gestion DB (optionnel)
  adminer:
    image: adminer
    container_name: edushare-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    networks:
      - edushare-network
    depends_on:
      - postgres
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: edushare-backend
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://\${DB_USER:-edushare_user}:\${DB_PASSWORD:-change_me}@postgres:5432/\${DB_NAME:-edushare}
      JWT_SECRET: \${JWT_SECRET:-dev_secret}
      FRONTEND_URL: \${FRONTEND_URL:-http://localhost:5173}
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./logs:/app/logs
    networks:
      - edushare-network
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    command: npm run dev

  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: edushare-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - edushare-network
    depends_on:
      - backend
    restart: unless-stopped
    stdin_open: true
    tty: true

  # MinIO pour stockage local (alternative à S3)
  minio:
    image: minio/minio:latest
    container_name: edushare-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    networks:
      - edushare-network
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped

  # Redis pour cache et sessions
  redis:
    image: redis:7-alpine
    container_name: edushare-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - edushare-network
    command: redis-server --appendonly yes
    restart: unless-stopped

  # Traefik pour reverse proxy (optionnel pour production)
  traefik:
    image: traefik:v3.0
    container_name: edushare-traefik
    ports:
      - "80:80"
      - "443:443"
      - "8081:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.toml:/etc/traefik/traefik.toml
      - ./traefik/:/etc/traefik/
      - ./ssl/:/ssl/
    networks:
      - edushare-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local
  redis_data:
    driver: local

networks:
  edushare-network:
    driver: bridge
    name: edushare-network
EOF
    
    # Dockerfile backend
    cat > backend/Dockerfile << 'EOF'
# Étape 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code
COPY . .

# Build TypeScript
RUN npm run build

# Étape 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Installer les outils nécessaires
RUN apk add --no-cache curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Basculer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]

# Étape 3: Development
FROM node:18-alpine AS development

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
EOF
    
    # Dockerfile frontend
    cat > frontend/Dockerfile << 'EOF'
# Étape 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code
COPY . .

# Build
RUN npm run build

# Étape 2: Production avec Nginx
FROM nginx:alpine AS production

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]

# Étape 3: Development
FROM node:18-alpine AS development

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 5173

# Commande de développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF
    
    # Configuration Nginx
    cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    print_success "Configuration Docker complète"
}

setup_ci_cd() {
    print_step "Configuration CI/CD GitHub Actions"
    
    # Workflow principal
    cat > .github/workflows/main.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Tests et validation
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: edushare_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies (Frontend)
      run: |
        cd frontend
        npm ci
      working-directory: frontend
    
    - name: Install dependencies (Backend)
      run: |
        cd backend
        npm ci
      working-directory: backend
    
    - name: Lint Frontend
      run: |
        cd frontend
        npm run lint
      working-directory: frontend
    
    - name: Lint Backend
      run: |
        cd backend
        npm run lint
      working-directory: backend
    
    - name: Type Check Frontend
      run: |
        cd frontend
        npm run type-check
      working-directory: frontend
    
    - name: Type Check Backend
      run: |
        cd backend
        npm run type-check
      working-directory: backend
    
    - name: Run Frontend Tests
      run: |
        cd frontend
        npm run test -- --coverage --passWithNoTests
      working-directory: frontend
    
    - name: Run Backend Tests
      run: |
        cd backend
        npm run test
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/edushare_test
        JWT_SECRET: test_secret
      working-directory: backend
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./frontend/coverage/coverage-final.json,./backend/coverage/coverage-final.json
        flags: frontend,backend

  # Build et push Docker images
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'release'
    
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata for Docker
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha,prefix={{branch}}-
    
    - name: Build and push Backend image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}-backend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push Frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ${{ steps.meta.outputs.tags }}-frontend
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  # Déploiement (exemple pour AWS ECS)
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.event_name == 'release'
    
    steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2
    
    - name: Deploy to ECS
      uses: aws-actions/amazon-ecs-deploy-task-definition@v2
      with:
        task-definition: ./aws/task-definition.json
        service: edushare-service
        cluster: edushare-cluster
        wait-for-service-stability: true
EOF
    
    # Workflow de sécurité
    cat > .github/workflows/security.yml << 'EOF'
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0' # Toutes les semaines
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run npm audit
      run: |
        cd frontend && npm audit --audit-level=high
        cd ../backend && npm audit --audit-level=high
    
    - name: Check for secrets in code
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Snyk Security Scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --all-projects --severity-threshold=high
EOF
    
    print_success "CI/CD configuré"
}

setup_scripts_utilitaires() {
    print_step "Création des scripts utilitaires"
    
    # Script de démarrage développement
    cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash

# ============================================
# START-DEV.SH
# Démarrage de l'environnement de développement
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║                                                      ║"
    echo "║   🚀 Démarrage Environnement de Développement        ║"
    echo "║                                                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
    echo "══════════════════════════════════════════════"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_env() {
    if [ ! -f .env ]; then
        print_error "Fichier .env non trouvé"
        echo "Copiez .env.example vers .env et configurez les variables"
        exit 1
    fi
}

start_docker() {
    print_step "Démarrage des services Docker"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    docker-compose up -d postgres redis minio
    sleep 5
    
    # Vérifier que les services sont en ligne
    if docker-compose ps | grep -q "Up"; then
        print_success "Services Docker démarrés"
    else
        print_error "Échec du démarrage des services Docker"
        docker-compose logs
        exit 1
    fi
}

start_backend() {
    print_step "Démarrage du Backend"
    
    cd backend
    
    # Vérifier les dépendances
    if [ ! -d "node_modules" ]; then
        echo "Installation des dépendances backend..."
        npm install
    fi
    
    # Générer le client Prisma
    npx prisma generate
    
    # Appliquer les migrations
    npx prisma migrate dev --name init
    
    # Lancer le backend en mode développement
    npm run dev &
    
    BACKEND_PID=$!
    cd ..
    
    sleep 3
    
    # Vérifier que le backend répond
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend démarré sur http://localhost:3000"
    else
        print_error "Échec du démarrage du backend"
        exit 1
    fi
}

start_frontend() {
    print_step "Démarrage du Frontend"
    
    cd frontend
    
    # Vérifier les dépendances
    if [ ! -d "node_modules" ]; then
        echo "Installation des dépendances frontend..."
        npm install
    fi
    
    # Lancer le frontend en mode développement
    npm run dev &
    
    FRONTEND_PID=$!
    cd ..
    
    sleep 5
    
    # Vérifier que le frontend répond
    if curl -s http://localhost:5173 > /dev/null; then
        print_success "Frontend démarré sur http://localhost:5173"
    else
        print_error "Échec du démarrage du frontend"
        exit 1
    fi
}

cleanup() {
    echo -e "\n${YELLOW}Arrêt des services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    docker-compose down
    
    echo -e "${GREEN}Services arrêtés${NC}"
    exit 0
}

# Gestion des signaux d'arrêt
trap cleanup INT TERM

main() {
    print_header
    
    check_env
    
    # Options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --docker-only)
                start_docker
                exit 0
                ;;
            --backend-only)
                start_backend
                exit 0
                ;;
            --frontend-only)
                start_frontend
                exit 0
                ;;
            --no-docker)
                NO_DOCKER=true
                ;;
            *)
                echo "Option inconnue: $1"
                exit 1
                ;;
        esac
        shift
    done
    
    # Démarrer tous les services
    if [ "$NO_DOCKER" != "true" ]; then
        start_docker
    fi
    
    start_backend
    start_frontend
    
    print_step "Environnement prêt 🎉"
    echo ""
    echo -e "${GREEN}🔗 Frontend:    http://localhost:5173${NC}"
    echo -e "${GREEN}🔗 Backend API: http://localhost:3000${NC}"
    echo -e "${GREEN}📚 API Docs:    http://localhost:3000/api-docs${NC}"
    echo -e "${GREEN}🗄️  Base de données: localhost:5432${NC}"
    echo -e "${GREEN}📦 MinIO (stockage): http://localhost:9001${NC}"
    echo -e "${GREEN}📊 Adminer (DB GUI): http://localhost:8080${NC}"
    echo ""
    echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter tous les services${NC}"
    echo ""
    
    # Attendre indéfiniment
    wait
}

main "$@"
EOF
    
    chmod +x scripts/start-dev.sh
    
    # Script de migration de base de données
    cat > scripts/database-migrate.sh << 'EOF'
#!/bin/bash

# ============================================
# DATABASE-MIGRATE.SH
# Gestion des migrations de base de données
# ============================================

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_env() {
    if [ -z "$DATABASE_URL" ] && [ ! -f .env ]; then
        print_error "Variables d'environnement non définies"
        exit 1
    fi
    
    source .env 2>/dev/null || true
}

run_migration() {
    print_step "Exécution des migrations"
    
    cd backend
    
    # Générer le client Prisma
    npx prisma generate
    
    # Appliquer les migrations
    npx prisma migrate dev
    
    cd ..
    
    print_success "Migrations appliquées avec succès"
}

seed_database() {
    print_step "Peuplement de la base de données"
    
    cd backend
    
    if [ -f "prisma/seed.ts" ]; then
        npx ts-node prisma/seed.ts
        print_success "Base de données peuplée"
    else
        print_error "Fichier de seed non trouvé"
    fi
    
    cd ..
}

reset_database() {
    print_step "Réinitialisation de la base de données"
    
    read -p "Êtes-vous sûr ? Cette action supprimera toutes les données. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Annulé"
        exit 0
    fi
    
    cd backend
    
    # Reset et réappliquer les migrations
    npx prisma migrate reset --force
    
    cd ..
    
    print_success "Base de données réinitialisée"
}

create_migration() {
    if [ -z "$1" ]; then
        print_error "Nom de migration requis"
        echo "Usage: $0 create <nom-de-la-migration>"
        exit 1
    fi
    
    print_step "Création de la migration: $1"
    
    cd backend
    npx prisma migrate dev --name "$1"
    cd ..
    
    print_success "Migration créée: $1"
}

show_status() {
    print_step "État de la base de données"
    
    cd backend
    npx prisma migrate status
    cd ..
}

main() {
    check_env
    
    case "$1" in
        "run")
            run_migration
            ;;
        "seed")
            seed_database
            ;;
        "reset")
            reset_database
            ;;
        "create")
            create_migration "$2"
            ;;
        "status")
            show_status
            ;;
        *)
            echo "Usage: $0 {run|seed|reset|create|status}"
            echo ""
            echo "Commandes:"
            echo "  run          Exécuter les migrations"
            echo "  seed         Peupler la base de données"
            echo "  reset        Réinitialiser la base de données"
            echo "  create <nom> Créer une nouvelle migration"
            echo "  status       Afficher l'état des migrations"
            exit 1
            ;;
    esac
}

main "$@"
EOF
    
    chmod +x scripts/database-migrate.sh
    
    # Script de build production
    cat > scripts/build-production.sh << 'EOF'
#!/bin/bash

# ============================================
# BUILD-PRODUCTION.SH
# Construction des artefacts de production
# ============================================

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║                                                      ║"
    echo "║   🏗️  Construction pour Production                   ║"
    echo "║                                                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
    echo "══════════════════════════════════════════════"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_dependencies() {
    print_step "Vérification des dépendances"
    
    local missing=()
    
    for cmd in node npm docker docker-compose; do
        if ! command -v $cmd &> /dev/null; then
            missing+=($cmd)
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Dépendances manquantes: ${missing[*]}"
        exit 1
    fi
    
    print_success "Toutes les dépendances sont satisfaites"
}

build_backend() {
    print_step "Construction du Backend"
    
    cd backend
    
    # Nettoyer l'ancien build
    rm -rf dist node_modules
    
    # Installer les dépendances de production
    npm ci --only=production
    
    # Générer le client Prisma
    npx prisma generate
    
    # Build TypeScript
    npm run build
    
    # Vérifier le build
    if [ -f "dist/index.js" ]; then
        print_success "Backend construit avec succès"
        echo "Taille: $(du -sh dist | cut -f1)"
    else
        print_error "Échec de la construction du backend"
        exit 1
    fi
    
    cd ..
}

build_frontend() {
    print_step "Construction du Frontend"
    
    cd frontend
    
    # Nettoyer l'ancien build
    rm -rf dist node_modules
    
    # Installer les dépendances
    npm ci
    
    # Build pour production
    npm run build
    
    # Vérifier le build
    if [ -f "dist/index.html" ]; then
        print_success "Frontend construit avec succès"
        echo "Taille: $(du -sh dist | cut -f1)"
        
        # Analyser la taille du bundle
        echo -e "\n📊 Analyse du bundle:"
        find dist -name "*.js" -exec du -h {} \; | sort -hr | head -5
    else
        print_error "Échec de la construction du frontend"
        exit 1
    fi
    
    cd ..
}

build_docker() {
    print_step "Construction des images Docker"
    
    # Build backend
    docker build -t edushare-backend:latest ./backend --target production
    
    # Build frontend
    docker build -t edushare-frontend:latest ./frontend --target production
    
    # Vérifier les images
    if docker images | grep -q "edushare-backend"; then
        print_success "Images Docker construites"
        echo ""
        docker images | grep edushare
    else
        print_error "Échec de la construction des images Docker"
        exit 1
    fi
}

run_tests() {
    print_step "Exécution des tests"
    
    # Tests backend
    cd backend
    npm test -- --passWithNoTests
    cd ..
    
    # Tests frontend
    cd frontend
    npm test -- --passWithNoTests
    cd ..
    
    print_success "Tous les tests passent"
}

create_archive() {
    print_step "Création de l'archive de déploiement"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    ARCHIVE_NAME="edushare_deploy_$TIMESTAMP.tar.gz"
    
    # Créer un dossier temporaire
    mkdir -p deploy_temp
    
    # Copier les artefacts
    cp -r backend/dist deploy_temp/backend
    cp -r frontend/dist deploy_temp/frontend
    cp -r backend/package.json deploy_temp/backend/
    cp -r backend/prisma deploy_temp/backend/
    cp docker-compose.prod.yml deploy_temp/
    cp .env.example deploy_temp/
    
    # Créer un script de déploiement
    cat > deploy_temp/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "🔧 Déploiement de EduShare"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Charger les variables d'environnement
if [ -f .env ]; then
    source .env
else
    echo "⚠️  Fichier .env non trouvé, utilisation des valeurs par défaut"
fi

# Arrêter les conteneurs existants
docker-compose down || true

# Démarrer les services
docker-compose up -d

echo "✅ Déploiement terminé"
echo "🌍 Frontend: http://localhost"
echo "🔗 Backend: http://localhost:3000"
DEPLOY_SCRIPT
    
    chmod +x deploy_temp/deploy.sh
    
    # Créer l'archive
    tar -czf $ARCHIVE_NAME -C deploy_temp .
    
    # Nettoyer
    rm -rf deploy_temp
    
    print_success "Archive créée: $ARCHIVE_NAME"
    echo "Taille: $(du -h $ARCHIVE_NAME | cut -f1)"
}

main() {
    print_header
    
    case "$1" in
        "backend")
            build_backend
            ;;
        "frontend")
            build_frontend
            ;;
        "docker")
            build_docker
            ;;
        "all"|"")
            check_dependencies
            run_tests
            build_backend
            build_frontend
            
            if [ "$2" = "--docker" ]; then
                build_docker
            fi
            
            if [ "$2" = "--archive" ]; then
                create_archive
            fi
            ;;
        *)
            echo "Usage: $0 {backend|frontend|docker|all [--docker|--archive]}"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}✅ Construction terminée avec succès${NC}"
}

main "$@"
EOF
    
    chmod +x scripts/build-production.sh
    
    # Fichier utils.sh avec fonctions communes
    cat > scripts/utils.sh << 'EOF'
#!/bin/bash

# ============================================
# UTILS.SH
# Fonctions utilitaires pour les scripts
# ============================================

# Vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Afficher un spinner pendant l'exécution d'une commande
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    
    tput civis # Cacher le curseur
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
    tput cnorm # Réafficher le curseur
}

# Exécuter une commande avec un spinner
run_with_spinner() {
    echo -n "$1... "
    shift
    ("$@") > /dev/null 2>&1 &
    local pid=$!
    spinner $pid
    wait $pid
    local result=$?
    if [ $result -eq 0 ]; then
        echo "✓"
    else
        echo "✗"
        return $result
    fi
}

# Valider une adresse email
validate_email() {
    local email=$1
    local regex="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    
    if [[ $email =~ $regex ]]; then
        return 0
    else
        return 1
    fi
}

# Générer un mot de passe aléatoire
generate_password() {
    local length=${1:-16}
    tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c $length
}

# Vérifier la force d'un mot de passe
check_password_strength() {
    local password=$1
    local score=0
    
    [ ${#password} -ge 8 ] && ((score++))
    [[ $password =~ [A-Z] ]] && ((score++))
    [[ $password =~ [a-z] ]] && ((score++))
    [[ $password =~ [0-9] ]] && ((score++))
    [[ $password =~ [!@#$%^&*()_+-=] ]] && ((score++))
    
    case $score in
        5) echo "Très fort" ;;
        4) echo "Fort" ;;
        3) echo "Moyen" ;;
        *) echo "Faible" ;;
    esac
}

# Formater une taille en octets lisible
format_size() {
    local bytes=$1
    local units=("o" "Ko" "Mo" "Go" "To")
    local unit=0
    
    while (( bytes > 1024 )) && (( unit < 4 )); do
        bytes=$(( bytes / 1024 ))
        (( unit++ ))
    done
    
    echo "${bytes} ${units[$unit]}"
}

# Obtenir l'IP publique
get_public_ip() {
    curl -s ifconfig.me
}

# Obtenir l'IP locale
get_local_ip() {
    if command_exists ip; then
        ip addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1
    elif command_exists ifconfig; then
        ifconfig | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1
    else
        echo "127.0.0.1"
    fi
}

# Vérifier si un port est utilisé
is_port_used() {
    local port=$1
    if command_exists netstat; then
        netstat -tuln | grep -q ":$port "
    elif command_exists ss; then
        ss -tuln | grep -q ":$port "
    else
        lsof -i :$port > /dev/null 2>&1
    fi
}

# Attendre qu'un service soit disponible
wait_for_service() {
    local host=$1
    local port=$2
    local timeout=${3:-30}
    local start_time=$(date +%s)
    
    echo -n "En attente de $host:$port..."
    
    while ! nc -z $host $port 2>/dev/null; do
        local current_time=$(date +%s)
        local elapsed=$(( current_time - start_time ))
        
        if [ $elapsed -ge $timeout ]; then
            echo " timeout!"
            return 1
        fi
        
        echo -n "."
        sleep 1
    done
    
    echo " disponible!"
    return 0
}

# Logger avec timestamp
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO) echo -e "[$timestamp] ℹ $message" ;;
        SUCCESS) echo -e "[$timestamp] ✓ $message" ;;
        WARNING) echo -e "[$timestamp] ⚠ $message" ;;
        ERROR) echo -e "[$timestamp] ✗ $message" >&2 ;;
        *) echo -e "[$timestamp] $message" ;;
    esac
}

# Créer un backup
create_backup() {
    local backup_dir="${1:-./backups}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/backup_$timestamp.tar.gz"
    
    mkdir -p "$backup_dir"
    
    tar -czf "$backup_file" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=build \
        .
    
    echo "$backup_file"
}

# Restaurer un backup
restore_backup() {
    local backup_file=$1
    local restore_dir=${2:-.}
    
    if [ ! -f "$backup_file" ]; then
        log ERROR "Fichier de backup non trouvé: $backup_file"
        return 1
    fi
    
    tar -xzf "$backup_file" -C "$restore_dir"
    log SUCCESS "Backup restauré depuis: $backup_file"
}
EOF
    
    chmod +x scripts/utils.sh
    
    print_success "Scripts utilitaires créés"
}

main() {
    print_header
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ -f "init-project.sh" ]; then
        print_error "Veuillez exécuter ce script depuis le répertoire racine du projet"
        exit 1
    fi
    
    # 1. Vérifier les prérequis
    check_prerequisites
    
    # 2. Créer la structure
    create_project_structure
    
    # 3. Générer la documentation
    generate_readme
    
    # 4. Créer les fichiers d'environnement
    generate_env_files
    
    # 5. Configurer le frontend
    setup_frontend
    
    # 6. Configurer le backend
    setup_backend
    
    # 7. Configurer Docker
    setup_docker
    
    # 8. Configurer CI/CD
    setup_ci_cd
    
    # 9. Créer les scripts utilitaires
    setup_scripts_utilitaires
    
    # Finalisation
    print_step "🎉 Initialisation terminée avec succès !"
    echo ""
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN}🚀 $PROJECT_NAME v$PROJECT_VERSION${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${YELLOW}Prochaine étapes:${NC}"
    echo "1. Éditer le fichier .env avec vos configurations"
    echo "2. Lancer la base de données: docker-compose up -d postgres"
    echo "3. Exécuter les migrations: ./scripts/database-migrate.sh run"
    echo "4. Démarrer le projet: ./scripts/start-dev.sh"
    echo ""
    echo -e "${YELLOW}Commandes utiles:${NC}"
    echo "  ./scripts/start-dev.sh       # Démarrer le développement"
    echo "  ./scripts/build-production.sh # Build pour production"
    echo "  ./scripts/database-migrate.sh # Gérer la base de données"
    echo ""
    echo -e "${GREEN}Bon développement ! 👨‍💻👩‍💻${NC}"
    echo ""
}

# Exécuter le script principal
main "$@"