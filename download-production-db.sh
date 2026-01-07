#!/bin/bash

# Script para descargar la base de datos de producción y restaurarla en local
# Ejecutar: bash download-production-db.sh

set -e

SERVER="root@45.55.81.191"
PROD_DB_PATH="/var/www/html/test_complex/database/banco_preguntas.db"
LOCAL_DB_PATH="database/banco_preguntas.db"
LOCAL_BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     📥 DESCARGANDO BASE DE DATOS DE PRODUCCIÓN                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Crear directorio de backups si no existe
mkdir -p "$LOCAL_BACKUP_DIR"
mkdir -p "database"

# 2. Hacer backup de la base de datos local si existe
if [ -f "$LOCAL_DB_PATH" ]; then
    echo "💾 Haciendo backup de la base de datos local..."
    LOCAL_BACKUP="${LOCAL_BACKUP_DIR}/banco_preguntas_local_${TIMESTAMP}.db"
    cp "$LOCAL_DB_PATH" "$LOCAL_BACKUP"
    gzip -f "$LOCAL_BACKUP"
    echo "✅ Backup local guardado: ${LOCAL_BACKUP}.gz"
    echo ""
fi

# 3. Descargar base de datos de producción
echo "📥 Descargando base de datos de producción..."
echo "   Servidor: $SERVER"
echo "   Ruta: $PROD_DB_PATH"
echo ""

# Verificar conexión al servidor
if ! ssh -o ConnectTimeout=5 "$SERVER" "test -f $PROD_DB_PATH" 2>/dev/null; then
    echo "❌ Error: No se puede conectar al servidor o la base de datos no existe"
    echo ""
    echo "🔍 Verificando conexión..."
    ssh "$SERVER" "ls -lh $PROD_DB_PATH" || exit 1
fi

# Descargar la base de datos
scp "$SERVER:$PROD_DB_PATH" "$LOCAL_DB_PATH.tmp"

if [ ! -f "$LOCAL_DB_PATH.tmp" ]; then
    echo "❌ Error: No se pudo descargar la base de datos"
    exit 1
fi

# 4. Verificar que el archivo descargado es válido
echo ""
echo "🔍 Verificando base de datos descargada..."

if command -v sqlite3 &> /dev/null; then
    # Verificar que es una base de datos SQLite válida
    if ! sqlite3 "$LOCAL_DB_PATH.tmp" "SELECT 1;" &>/dev/null; then
        echo "❌ Error: El archivo descargado no es una base de datos SQLite válida"
        rm -f "$LOCAL_DB_PATH.tmp"
        exit 1
    fi
    
    # Obtener estadísticas
    echo ""
    echo "📊 Estadísticas de la base de datos de producción:"
    sqlite3 "$LOCAL_DB_PATH.tmp" << 'SQL'
SELECT 
    (SELECT COUNT(*) FROM materias) as materias,
    (SELECT COUNT(*) FROM preguntas) as preguntas,
    (SELECT COUNT(*) FROM respuestas) as respuestas,
    (SELECT COUNT(DISTINCT p.id) 
     FROM preguntas p 
     JOIN respuestas r ON p.id = r.pregunta_id 
     WHERE r.es_correcta = 1 OR r.es_correcta = '1' OR r.es_correcta = true) as preguntas_con_respuesta;
SQL
    echo ""
else
    echo "⚠️  sqlite3 no está instalado, no se puede verificar la base de datos"
    echo "   Instalar con: brew install sqlite3 (macOS) o apt install sqlite3 (Linux)"
fi

# 5. Reemplazar la base de datos local
echo "🔄 Reemplazando base de datos local..."
mv "$LOCAL_DB_PATH.tmp" "$LOCAL_DB_PATH"

# 6. Verificar tamaño del archivo
SIZE=$(du -h "$LOCAL_DB_PATH" | cut -f1)
echo "✅ Base de datos descargada: $LOCAL_DB_PATH ($SIZE)"
echo ""

# 7. Verificar la base de datos local final
if command -v sqlite3 &> /dev/null; then
    echo "📊 Verificando base de datos local:"
    sqlite3 "$LOCAL_DB_PATH" << 'SQL'
SELECT 
    (SELECT COUNT(*) FROM materias) as materias,
    (SELECT COUNT(*) FROM preguntas) as preguntas,
    (SELECT COUNT(*) FROM respuestas) as respuestas,
    (SELECT COUNT(DISTINCT p.id) 
     FROM preguntas p 
     JOIN respuestas r ON p.id = r.pregunta_id 
     WHERE r.es_correcta = 1 OR r.es_correcta = '1' OR r.es_correcta = true) as preguntas_con_respuesta;
SQL
    echo ""
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ✅ BASE DE DATOS DE PRODUCCIÓN DESCARGADA                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "   1. Reiniciar el servidor local si está corriendo"
echo "   2. Verificar que la aplicación funciona correctamente"
echo ""
echo "💡 Para restaurar el backup local anterior:"
echo "   gunzip ${LOCAL_BACKUP_DIR}/banco_preguntas_local_${TIMESTAMP}.db.gz"
echo "   cp ${LOCAL_BACKUP_DIR}/banco_preguntas_local_${TIMESTAMP}.db database/banco_preguntas.db"

