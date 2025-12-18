#!/bin/bash
# ============================================
# Script de Build Multi-Modules - ServiceHub
# ============================================

set -e  # Exit on error

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
BUILD_DIR="$PROJECT_ROOT/build"
VERSION=$(node -p "require('$BACKEND_DIR/package.json').version")

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "============================================"
    echo "  ServiceHub Platform - Build v$VERSION"
    echo "============================================"
    echo ""
}

# Nettoyage
clean() {
    log_info "Nettoyage des builds précédents..."
    rm -rf "$BACKEND_DIR/dist"
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    log_success "Nettoyage terminé"
}

# Installation des dépendances
install_deps() {
    log_info "Installation des dépendances..."
    cd "$BACKEND_DIR"
    npm ci
    log_success "Dépendances installées"
}

# Génération Prisma
generate_prisma() {
    log_info "Génération du client Prisma..."
    cd "$BACKEND_DIR"
    npx prisma generate
    log_success "Client Prisma généré"
}

# Lint
lint() {
    log_info "Vérification du code (lint)..."
    cd "$BACKEND_DIR"
    npm run lint:check || {
        log_error "Erreurs de lint détectées"
        exit 1
    }
    log_success "Code valide"
}

# Tests
run_tests() {
    log_info "Exécution des tests..."
    cd "$BACKEND_DIR"
    npm run test || {
        log_warning "Certains tests ont échoué"
        if [ "$SKIP_TESTS" != "true" ]; then
            exit 1
        fi
    }
    log_success "Tests passés"
}

# Build TypeScript
build_typescript() {
    log_info "Compilation TypeScript..."
    cd "$BACKEND_DIR"
    npm run build
    log_success "Compilation terminée"
}

# Packaging
package() {
    log_info "Packaging de l'application..."

    # Créer le répertoire de build
    mkdir -p "$BUILD_DIR/servicehub-$VERSION"

    # Copier les fichiers nécessaires
    cp -r "$BACKEND_DIR/dist" "$BUILD_DIR/servicehub-$VERSION/"
    cp -r "$BACKEND_DIR/prisma" "$BUILD_DIR/servicehub-$VERSION/"
    cp "$BACKEND_DIR/package.json" "$BUILD_DIR/servicehub-$VERSION/"
    cp "$BACKEND_DIR/package-lock.json" "$BUILD_DIR/servicehub-$VERSION/"

    # Installer uniquement les dépendances de production
    cd "$BUILD_DIR/servicehub-$VERSION"
    npm ci --only=production

    # Créer l'archive
    cd "$BUILD_DIR"
    tar -czvf "servicehub-$VERSION.tar.gz" "servicehub-$VERSION"

    log_success "Package créé: $BUILD_DIR/servicehub-$VERSION.tar.gz"
}

# Build Docker
build_docker() {
    log_info "Build de l'image Docker..."
    cd "$BACKEND_DIR"

    docker build \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        -t "servicehub-backend:$VERSION" \
        -t "servicehub-backend:latest" \
        .

    log_success "Image Docker créée: servicehub-backend:$VERSION"
}

# Afficher l'aide
show_help() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all         Build complet (défaut)"
    echo "  clean       Nettoyer les builds"
    echo "  install     Installer les dépendances"
    echo "  lint        Vérifier le code"
    echo "  test        Exécuter les tests"
    echo "  build       Compiler TypeScript"
    echo "  package     Créer le package de distribution"
    echo "  docker      Construire l'image Docker"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Ignorer les erreurs de tests"
    echo "  --skip-lint     Ignorer le lint"
    echo "  -h, --help      Afficher l'aide"
    echo ""
}

# Parse arguments
SKIP_TESTS="false"
SKIP_LINT="false"
COMMAND="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        --skip-lint)
            SKIP_LINT="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            COMMAND="$1"
            shift
            ;;
    esac
done

# Exécution
print_header

case $COMMAND in
    clean)
        clean
        ;;
    install)
        install_deps
        ;;
    lint)
        lint
        ;;
    test)
        run_tests
        ;;
    build)
        build_typescript
        ;;
    package)
        clean
        install_deps
        generate_prisma
        build_typescript
        package
        ;;
    docker)
        build_docker
        ;;
    all)
        clean
        install_deps
        generate_prisma
        [ "$SKIP_LINT" != "true" ] && lint
        [ "$SKIP_TESTS" != "true" ] && run_tests
        build_typescript
        log_success "Build complet terminé!"
        ;;
    *)
        log_error "Commande inconnue: $COMMAND"
        show_help
        exit 1
        ;;
esac

echo ""
log_success "Terminé!"
