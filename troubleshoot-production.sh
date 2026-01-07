#!/bin/bash

# Script de diagnóstico para producción
# Ejecutar en el servidor: bash troubleshoot-production.sh

set -e

PROJECT_DIR="/var/www/html/test_complex"
cd "$PROJECT_DIR"

echo "🔍 Diagnóstico del servidor de producción..."
echo ""

# 1. Verificar que la base de datos existe
echo "1️⃣  Verificando base de datos..."
if [ -f "database/banco_preguntas.db" ]; then
    echo "✅ Base de datos encontrada: database/banco_preguntas.db"
    ls -lh database/banco_preguntas.db
else
    echo "❌ Base de datos NO encontrada"
    echo "   Ruta esperada: $PROJECT_DIR/database/banco_preguntas.db"
    exit 1
fi

# 2. Verificar contenido de la base de datos
echo ""
echo "2️⃣  Verificando contenido de la base de datos..."
if command -v sqlite3 &> /dev/null; then
    MATERIAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM materias;" 2>/dev/null || echo "0")
    PREGUNTAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM preguntas;" 2>/dev/null || echo "0")
    RESPUESTAS=$(sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM respuestas;" 2>/dev/null || echo "0")
    
    echo "   Materias: $MATERIAS"
    echo "   Preguntas: $PREGUNTAS"
    echo "   Respuestas: $RESPUESTAS"
    
    if [ "$MATERIAS" -eq "0" ] || [ "$PREGUNTAS" -eq "0" ]; then
        echo "⚠️  La base de datos está vacía o corrupta"
        echo "   Necesitas restaurar desde backup o reimportar"
    else
        echo "✅ Base de datos tiene datos"
    fi
    
    # Mostrar algunas materias
    echo ""
    echo "   Materias disponibles:"
    sqlite3 database/banco_preguntas.db "SELECT id, nombre FROM materias LIMIT 5;" 2>/dev/null || echo "   Error al leer materias"
else
    echo "⚠️  sqlite3 no está instalado, no se puede verificar contenido"
fi

# 3. Verificar que el servidor está corriendo
echo ""
echo "3️⃣  Verificando servidor PM2..."
pm2 status | grep banco-preguntas-api || echo "❌ Servidor no está corriendo"

# 4. Verificar logs del servidor
echo ""
echo "4️⃣  Últimos logs del servidor:"
pm2 logs banco-preguntas-api --lines 10 --nostream 2>/dev/null || echo "⚠️  No se pudieron obtener logs"

# 5. Probar API localmente
echo ""
echo "5️⃣  Probando API localmente..."
API_RESPONSE=$(curl -s http://localhost:5001/api/materias 2>/dev/null || echo "ERROR")
if [ "$API_RESPONSE" = "ERROR" ] || [ -z "$API_RESPONSE" ]; then
    echo "❌ API no responde en localhost:5001"
else
    MATERIAS_COUNT=$(echo "$API_RESPONSE" | grep -o '"id"' | wc -l || echo "0")
    echo "✅ API responde"
    echo "   Materias en respuesta: $MATERIAS_COUNT"
    if [ "$MATERIAS_COUNT" -eq "0" ]; then
        echo "⚠️  La API responde pero no devuelve materias"
    fi
fi

# 6. Verificar puerto
echo ""
echo "6️⃣  Verificando puerto 5001..."
ss -tulpn | grep 5001 || echo "⚠️  Puerto 5001 no está en uso"

# 7. Verificar configuración de Nginx
echo ""
echo "7️⃣  Verificando configuración de Nginx..."
if [ -f "/etc/nginx/sites-available/complex.ulpik.com" ]; then
    echo "✅ Configuración de Nginx encontrada"
    echo "   Verificando proxy_pass..."
    grep -A 2 "proxy_pass" /etc/nginx/sites-available/complex.ulpik.com || echo "⚠️  No se encontró proxy_pass"
else
    echo "❌ Configuración de Nginx no encontrada"
fi

# 8. Verificar permisos
echo ""
echo "8️⃣  Verificando permisos..."
ls -la database/banco_preguntas.db
ls -la server.js

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "📋 RESUMEN DEL DIAGNÓSTICO"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "Si la base de datos está vacía, ejecuta:"
echo "  bash restore-database.sh"
echo ""
echo "O restaura manualmente:"
echo "  curl -o backups/banco_preguntas_latest.db.gz https://raw.githubusercontent.com/cto-ulpik/test_complex/main/backups/banco_preguntas_latest.db.gz"
echo "  gunzip backups/banco_preguntas_latest.db.gz"
echo "  cp backups/banco_preguntas_latest.db database/banco_preguntas.db"
echo "  pm2 restart banco-preguntas-api"


