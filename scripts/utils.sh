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
