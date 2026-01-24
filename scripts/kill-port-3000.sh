#!/bin/bash
# Script pour tuer le processus qui utilise le port 3000 sur Windows (Git Bash/MINGW64)
# Usage : ./scripts/kill-port-3000.sh

PORT=3000

# Trouver le PID du processus qui utilise le port
PID=$(netstat -ano | grep LISTEN | grep :$PORT | awk '{print $NF}' | head -n 1)

if [ -z "$PID" ]; then
  echo "Aucun processus n'utilise le port $PORT."
  exit 0
fi

# Vérifier si le PID existe réellement
if ! ps -p $PID > /dev/null; then
  echo "Le PID $PID n'existe plus. Aucun processus à tuer."
  exit 0
fi

# Tuer le processus
kill -9 $PID && echo "Processus $PID sur le port $PORT tué avec succès."
