#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🚀 ACTUALIZACIÓN DE PRODUCCIÓN                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "❌ Error: No se encontró server.js"
    echo "   Asegúrate de estar en el directorio del proyecto:"
    echo "   cd /var/www/html/test_complex"
    exit 1
fi

# Paso 1: Backup de la base de datos
echo "📦 Paso 1: Creando backup de la base de datos..."
mkdir -p backups
if [ -f "database/banco_preguntas.db" ]; then
    BACKUP_FILE="backups/backup_antes_update_$(date +%Y%m%d_%H%M%S).db"
    cp database/banco_preguntas.db "$BACKUP_FILE"
    gzip "$BACKUP_FILE"
    echo "✅ Backup creado: ${BACKUP_FILE}.gz"
else
    echo "⚠️  No se encontró la base de datos para hacer backup"
fi
echo ""

# Paso 2: Actualizar código desde GitHub
echo "📥 Paso 2: Actualizando código desde GitHub..."
git fetch origin
if [ $? -ne 0 ]; then
    echo "❌ Error al hacer fetch de GitHub"
    exit 1
fi

# Verificar si hay cambios locales
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios locales. Guardando temporalmente..."
    git stash
    STASHED=true
else
    STASHED=false
fi

git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Error al hacer pull de GitHub"
    if [ "$STASHED" = true ]; then
        git stash pop
    fi
    exit 1
fi

if [ "$STASHED" = true ]; then
    echo "📝 Aplicando cambios locales guardados..."
    git stash pop
fi
echo "✅ Código actualizado"
echo ""

# Paso 3: Instalar dependencias del backend
echo "📦 Paso 3: Instalando dependencias del backend..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias del backend"
    exit 1
fi
echo "✅ Dependencias del backend instaladas"
echo ""

# Paso 4: Instalar dependencias del frontend
echo "📦 Paso 4: Instalando dependencias del frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias del frontend"
    exit 1
fi
echo "✅ Dependencias del frontend instaladas"
echo ""

# Paso 5: Reconstruir frontend
echo "🔨 Paso 5: Reconstruyendo frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error al construir el frontend"
    exit 1
fi
echo "✅ Frontend reconstruido"
cd ..
echo ""

# Paso 6: Reiniciar servidor
echo "🔄 Paso 6: Reiniciando servidor..."
pm2 restart banco-preguntas-api
if [ $? -ne 0 ]; then
    echo "❌ Error al reiniciar el servidor"
    exit 1
fi
echo "✅ Servidor reiniciado"
echo ""

# Paso 7: Verificar estado
echo "🔍 Paso 7: Verificando estado del servidor..."
sleep 2
pm2 status
echo ""

# Verificar endpoints
echo "🔍 Verificando endpoints..."
sleep 1
if curl -s http://localhost:5001/api/materias > /dev/null; then
    echo "✅ Endpoint /api/materias funciona"
else
    echo "❌ Error: Endpoint /api/materias no responde"
fi

if curl -s http://localhost:5001/api/estadisticas > /dev/null; then
    echo "✅ Endpoint /api/estadisticas funciona"
else
    echo "❌ Error: Endpoint /api/estadisticas no responde"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ✅ ACTUALIZACIÓN COMPLETADA                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica el sitio: https://complex.ulpik.com"
echo "   2. Revisa los logs: pm2 logs banco-preguntas-api"
echo "   3. Si hay problemas, restaura desde el backup creado"
echo ""
