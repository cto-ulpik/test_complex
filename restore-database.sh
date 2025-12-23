#!/bin/bash

# Script para restaurar la base de datos
# Ejecutar en el servidor: bash restore-database.sh

set -e

PROJECT_DIR="/var/www/html/test_complex"
cd "$PROJECT_DIR"

echo "🔍 Verificando base de datos..."

# 1. Verificar si existe la base de datos
if [ -f "database/banco_preguntas.db" ]; then
    echo "✅ Base de datos encontrada en: database/banco_preguntas.db"
    echo "📊 Verificando contenido..."
    
    # Contar registros
    MATERIAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM materias;" 2>/dev/null || echo "0")
    PREGUNTAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM preguntas;" 2>/dev/null || echo "0")
    RESPUESTAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM respuestas;" 2>/dev/null || echo "0")
    
    echo "   Materias: $MATERIAS"
    echo "   Preguntas: $PREGUNTAS"
    echo "   Respuestas: $RESPUESTAS"
    
    if [ "$MATERIAS" -eq "0" ] || [ "$PREGUNTAS" -eq "0" ]; then
        echo "⚠️  La base de datos está vacía o corrupta"
        echo "🔄 Reimportando datos..."
    else
        echo "✅ La base de datos tiene datos"
        exit 0
    fi
else
    echo "❌ Base de datos no encontrada"
    echo "🔄 Creando nueva base de datos..."
    mkdir -p database
fi

# 2. Verificar si existe banco_preguntas.json
if [ -f "banco_preguntas.json" ]; then
    echo "✅ Archivo JSON encontrado"
    echo "📊 Importando datos..."
    npm run import
    echo "✅ Datos importados correctamente"
else
    echo "❌ Archivo banco_preguntas.json no encontrado"
    echo ""
    echo "📝 OPCIONES:"
    echo "   1. Subir banco_preguntas.json al servidor"
    echo "   2. Generar desde TXT: python3 txt_to_json.py"
    echo "   3. Restaurar desde backup si existe"
    echo ""
    echo "Para subir el archivo:"
    echo "   scp banco_preguntas.json root@45.55.81.191:/var/www/html/test_complex/"
    exit 1
fi

# 3. Verificar importación
echo ""
echo "🔍 Verificando importación..."
MATERIAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM materias;" 2>/dev/null || echo "0")
PREGUNTAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM preguntas;" 2>/dev/null || echo "0")
RESPUESTAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM respuestas;" 2>/dev/null || echo "0")

echo "✅ Importación completada:"
echo "   Materias: $MATERIAS"
echo "   Preguntas: $PREGUNTAS"
echo "   Respuestas: $RESPUESTAS"

# 4. Reiniciar servidor
echo ""
echo "🔄 Reiniciando servidor..."
pm2 restart banco-preguntas-api

echo ""
echo "✅ Base de datos restaurada y servidor reiniciado"

