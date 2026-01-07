#!/bin/bash

# Script para generar backup de la base de datos
# Ejecutar: bash backup-database.sh

set -e

DB_PATH="database/banco_preguntas.db"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/banco_preguntas_${TIMESTAMP}.db"

echo "💾 Generando backup de la base de datos..."

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Verificar que existe la base de datos
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Error: Base de datos no encontrada en $DB_PATH"
    exit 1
fi

# Generar backup
echo "📦 Copiando base de datos..."
cp "$DB_PATH" "$BACKUP_FILE"

# Comprimir backup
echo "🗜️  Comprimiendo backup..."
gzip -f "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Verificar tamaño
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup creado: $BACKUP_FILE ($SIZE)"

# Obtener estadísticas de la base de datos
if command -v sqlite3 &> /dev/null; then
    echo ""
    echo "📊 Estadísticas de la base de datos:"
    sqlite3 "$DB_PATH" << 'SQL'
SELECT 
    (SELECT COUNT(*) FROM materias) as materias,
    (SELECT COUNT(*) FROM preguntas) as preguntas,
    (SELECT COUNT(*) FROM respuestas) as respuestas;
SQL
fi

# Crear backup más reciente (latest)
LATEST_BACKUP="${BACKUP_DIR}/banco_preguntas_latest.db.gz"
cp "${BACKUP_FILE}" "$LATEST_BACKUP"
echo "✅ Backup más reciente guardado como: banco_preguntas_latest.db.gz"

echo ""
echo "📝 Para subir a GitHub:"
echo "   git add backups/"
echo "   git commit -m 'backup: Agregar backup de base de datos'"
echo "   git push"


