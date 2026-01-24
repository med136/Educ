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
