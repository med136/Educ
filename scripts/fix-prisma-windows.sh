#!/bin/bash
# Script pour corriger l'erreur EPERM de Prisma sur Windows
# Usage : ./scripts/fix-prisma-windows.sh

set -e

PRISMA_DIR="backend/node_modules/.prisma"
BACKEND_DIR="backend"

if [ -d "$PRISMA_DIR" ]; then
  echo "Suppression du dossier .prisma verrouillé..."
  rm -rf "$PRISMA_DIR"
else
  echo "Le dossier .prisma n'existe pas, rien à supprimer."
fi

cd "$BACKEND_DIR"
echo "Réinstallation des dépendances npm dans $BACKEND_DIR..."
npm install

echo "Réinstallation terminée. Vous pouvez relancer le backend."
