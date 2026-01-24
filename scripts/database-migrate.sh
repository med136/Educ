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
