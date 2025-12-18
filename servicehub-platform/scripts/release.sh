#!/bin/bash
# ============================================
# Script de Release - ServiceHub
# Gestion du versioning sémantique
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
CURRENT_VERSION=$(node -p "require('$BACKEND_DIR/package.json').version")

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header() {
    echo ""
    echo "============================================"
    echo "  ServiceHub Platform - Release Manager"
    echo "  Version actuelle: $CURRENT_VERSION"
    echo "============================================"
    echo ""
}

# Vérifier que le repo est propre
check_git_status() {
    log_info "Vérification de l'état du repository..."
    cd "$PROJECT_ROOT"

    if [[ -n $(git status --porcelain) ]]; then
        log_error "Le repository contient des modifications non committées"
        log_warning "Veuillez committer ou stasher vos modifications avant de créer une release"
        exit 1
    fi

    # Vérifier qu'on est sur main
    BRANCH=$(git branch --show-current)
    if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
        log_warning "Vous n'êtes pas sur la branche principale ($BRANCH)"
        read -p "Continuer quand même ? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_success "Repository propre"
}

# Calculer la nouvelle version
calculate_version() {
    local bump_type=$1
    local current=$CURRENT_VERSION

    IFS='.' read -ra VERSION_PARTS <<< "$current"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}

    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac

    echo "$major.$minor.$patch"
}

# Mettre à jour la version
update_version() {
    local new_version=$1
    log_info "Mise à jour de la version: $CURRENT_VERSION -> $new_version"

    cd "$BACKEND_DIR"
    npm version "$new_version" --no-git-tag-version

    log_success "Version mise à jour"
}

# Exécuter les validations
run_validations() {
    log_info "Exécution des validations..."

    cd "$BACKEND_DIR"

    # Lint
    log_info "  - Lint..."
    npm run lint:check || {
        log_error "Le lint a échoué"
        exit 1
    }

    # Tests
    log_info "  - Tests..."
    npm run test || {
        log_error "Les tests ont échoué"
        exit 1
    }

    # Build
    log_info "  - Build..."
    npm run build || {
        log_error "Le build a échoué"
        exit 1
    }

    log_success "Validations passées"
}

# Créer le commit et le tag
create_release_commit() {
    local new_version=$1
    log_info "Création du commit de release..."

    cd "$PROJECT_ROOT"

    git add .
    git commit -m "chore(release): v$new_version

Release version $new_version

Changes:
- Version bump from $CURRENT_VERSION to $new_version

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

    # Créer le tag
    git tag -a "v$new_version" -m "Release v$new_version"

    log_success "Commit et tag créés"
}

# Générer le changelog
generate_changelog() {
    local new_version=$1
    local changelog_file="$PROJECT_ROOT/CHANGELOG.md"

    log_info "Génération du changelog..."

    # Récupérer les commits depuis le dernier tag
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    local commits=""

    if [[ -n "$last_tag" ]]; then
        commits=$(git log "$last_tag"..HEAD --pretty=format:"- %s" --no-merges)
    else
        commits=$(git log --pretty=format:"- %s" --no-merges -20)
    fi

    # Créer ou mettre à jour le changelog
    local date=$(date +%Y-%m-%d)
    local new_entry="
## [$new_version] - $date

$commits
"

    if [[ -f "$changelog_file" ]]; then
        # Insérer après le titre
        sed -i.bak "3i\\
$new_entry
" "$changelog_file"
        rm -f "$changelog_file.bak"
    else
        echo "# Changelog

$new_entry
" > "$changelog_file"
    fi

    log_success "Changelog mis à jour"
}

# Push la release
push_release() {
    local new_version=$1
    log_info "Push de la release..."

    read -p "Pousser la release vers origin ? (y/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        git push origin "v$new_version"
        log_success "Release poussée"
    else
        log_warning "Release non poussée. Utilisez:"
        echo "  git push origin main"
        echo "  git push origin v$new_version"
    fi
}

# Afficher l'aide
show_help() {
    echo "Usage: $0 [OPTIONS] <patch|minor|major>"
    echo ""
    echo "Versioning sémantique:"
    echo "  patch   Correctifs (1.0.0 -> 1.0.1)"
    echo "  minor   Nouvelles fonctionnalités (1.0.0 -> 1.1.0)"
    echo "  major   Changements majeurs (1.0.0 -> 2.0.0)"
    echo ""
    echo "Options:"
    echo "  --dry-run       Simuler sans effectuer de modifications"
    echo "  --skip-tests    Ignorer les tests"
    echo "  --no-push       Ne pas pousser automatiquement"
    echo "  -h, --help      Afficher l'aide"
    echo ""
    echo "Exemples:"
    echo "  $0 patch          # 1.0.0 -> 1.0.1"
    echo "  $0 minor          # 1.0.0 -> 1.1.0"
    echo "  $0 major          # 1.0.0 -> 2.0.0"
    echo "  $0 --dry-run minor"
    echo ""
}

# Parse arguments
DRY_RUN="false"
SKIP_TESTS="false"
NO_PUSH="false"
BUMP_TYPE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        --no-push)
            NO_PUSH="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        patch|minor|major)
            BUMP_TYPE="$1"
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Vérifier le type de bump
if [[ -z "$BUMP_TYPE" ]]; then
    log_error "Type de version requis (patch, minor, ou major)"
    show_help
    exit 1
fi

# Exécution
print_header

NEW_VERSION=$(calculate_version "$BUMP_TYPE")
log_info "Nouvelle version: $NEW_VERSION"

if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "Mode dry-run - aucune modification ne sera effectuée"
    echo ""
    echo "Actions qui seraient effectuées:"
    echo "  1. Vérification du repository"
    echo "  2. Validation (lint, tests, build)"
    echo "  3. Mise à jour de la version: $CURRENT_VERSION -> $NEW_VERSION"
    echo "  4. Génération du changelog"
    echo "  5. Commit: chore(release): v$NEW_VERSION"
    echo "  6. Tag: v$NEW_VERSION"
    echo "  7. Push vers origin"
    exit 0
fi

check_git_status

if [[ "$SKIP_TESTS" != "true" ]]; then
    run_validations
fi

update_version "$NEW_VERSION"
generate_changelog "$NEW_VERSION"
create_release_commit "$NEW_VERSION"

if [[ "$NO_PUSH" != "true" ]]; then
    push_release "$NEW_VERSION"
fi

echo ""
log_success "Release v$NEW_VERSION créée avec succès!"
