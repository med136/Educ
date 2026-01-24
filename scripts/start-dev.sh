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

    # Attendre que le backend soit prêt (avec plusieurs tentatives)
    BACKEND_URL="http://localhost:3000/health"
    MAX_RETRIES=10
    RETRY_DELAY=2

    print_step "Vérification de l'état du backend"

    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s "$BACKEND_URL" > /dev/null; then
            print_success "Backend démarré sur http://localhost:3000"
            BACKEND_READY=true
            break
        else
            echo "Backend non prêt, nouvelle tentative dans ${RETRY_DELAY}s... (${i}/${MAX_RETRIES})"
            sleep $RETRY_DELAY
        fi
    done

    if [ "$BACKEND_READY" != "true" ]; then
        print_error "Échec du démarrage du backend (healthcheck indisponible)"
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
