#!/bin/bash

# Script de actualización automática en producción
# Ejecutar en el servidor: bash update-production.sh

set -e

PROJECT_DIR="/var/www/html/test_complex"
cd "$PROJECT_DIR"

echo "🔄 Actualizando proyecto en producción..."
echo ""

# 1. Backup de seguridad de la base de datos actual
echo "💾 Creando backup de seguridad..."
mkdir -p backups
if [ -f "database/banco_preguntas.db" ]; then
    BACKUP_FILE="backups/banco_preguntas_backup_$(date +%Y%m%d_%H%M%S).db"
    cp database/banco_preguntas.db "$BACKUP_FILE"
    gzip -f "$BACKUP_FILE"
    echo "✅ Backup creado: ${BACKUP_FILE}.gz"
else
    echo "⚠️  No se encontró base de datos para hacer backup"
fi

# 2. Detener servidor
echo ""
echo "🛑 Deteniendo servidor..."
pm2 stop banco-preguntas-api || echo "⚠️  Servidor no estaba corriendo"

# 3. Actualizar código desde GitHub
echo ""
echo "📥 Actualizando código desde GitHub..."
git stash 2>/dev/null || true
git pull origin main

# 4. Instalar dependencias
echo ""
echo "📦 Instalando dependencias del backend..."
npm install --production

echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
echo "🏗️  Construyendo frontend..."
npm run build
cd ..

# 5. Restaurar backup desde GitHub
echo ""
echo "📥 Descargando backup desde GitHub..."
curl -f -o backups/banco_preguntas_latest.db.gz https://raw.githubusercontent.com/cto-ulpik/test_complex/main/backups/banco_preguntas_latest.db.gz

if [ $? -eq 0 ]; then
    echo "✅ Backup descargado"
    echo "📦 Descomprimiendo backup..."
    gunzip -f backups/banco_preguntas_latest.db.gz
    
    echo "💾 Restaurando base de datos..."
    mkdir -p database
    cp backups/banco_preguntas_latest.db database/banco_preguntas.db
    chmod 644 database/banco_preguntas.db
    
    # Verificar contenido
    if command -v sqlite3 &> /dev/null; then
        echo ""
        echo "📊 Verificando base de datos restaurada:"
        sqlite3 database/banco_preguntas.db << 'SQL'
SELECT 
    (SELECT COUNT(*) FROM materias) as materias,
    (SELECT COUNT(*) FROM preguntas) as preguntas,
    (SELECT COUNT(*) FROM respuestas) as respuestas;
SQL
    fi
else
    echo "⚠️  No se pudo descargar el backup desde GitHub"
    echo "   La base de datos actual se mantendrá"
fi

# 6. Reiniciar servidor
echo ""
echo "🚀 Reiniciando servidor..."
pm2 restart banco-preguntas-api || pm2 start server.js --name "banco-preguntas-api" --env production
pm2 save

# 7. Verificar estado
echo ""
echo "📊 Estado del servidor:"
pm2 status

echo ""
echo "✅ Actualización completada!"
echo ""
echo "🔍 Verificaciones:"
echo "   1. Ver logs: pm2 logs banco-preguntas-api"
echo "   2. Probar API: curl http://localhost:5001/api/materias"
echo "   3. Acceder a: https://complex.ulpik.com"

