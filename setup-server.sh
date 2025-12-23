#!/bin/bash

# Script completo de configuración para complex.ulpik.com
# Ejecutar en el servidor: bash setup-server.sh

set -e

echo "🚀 Configurando Banco de Preguntas en complex.ulpik.com..."

# Variables
PROJECT_DIR="/var/www/html/complex"
REPO_URL="https://github.com/cto-ulpik/test_complex.git"

# 1. Actualizar sistema
echo "📦 Actualizando sistema..."
apt update -y

# 2. Instalar Node.js si no está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version) instalado"

# 3. Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi
echo "✅ PM2 instalado"

# 4. Instalar Python3 y pip si no están
if ! command -v python3 &> /dev/null; then
    echo "📦 Instalando Python3..."
    apt-get install -y python3 python3-pip
fi
echo "✅ Python3 instalado"

# 5. Crear directorio del proyecto
echo "📁 Preparando directorio..."
mkdir -p /var/www/html
cd /var/www/html

# 6. Clonar o actualizar repositorio
if [ -d "$PROJECT_DIR" ]; then
    echo "🔄 Actualizando repositorio existente..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "📥 Clonando repositorio..."
    git clone "$REPO_URL" complex
    cd "$PROJECT_DIR"
fi
echo "✅ Repositorio listo"

# 7. Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
npm install --production
echo "✅ Dependencias del backend instaladas"

# 8. Instalar dependencias del frontend y construir
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
echo "🏗️  Construyendo frontend para producción..."
npm run build
cd ..
echo "✅ Frontend construido"

# 9. Configurar .env
if [ ! -f .env ]; then
    echo "⚙️  Creando archivo .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANTE: Edita .env y agrega tu OPENAI_API_KEY"
    echo "   nano $PROJECT_DIR/.env"
    echo ""
else
    echo "✅ Archivo .env ya existe"
fi

# 10. Crear directorio de base de datos
mkdir -p database

# 11. Importar datos si existe banco_preguntas.json
if [ -f banco_preguntas.json ]; then
    echo "📊 Importando datos a la base de datos..."
    npm run import
    echo "✅ Datos importados"
else
    echo "⚠️  banco_preguntas.json no encontrado"
    echo "   Sube el archivo y ejecuta: npm run import"
fi

# 12. Configurar Nginx (sin afectar otros proyectos)
echo "🌐 Configurando Nginx para complex.ulpik.com..."

# Instalar Nginx si no está instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando Nginx..."
    apt-get install -y nginx
fi

# Crear configuración de Nginx SOLO para complex.ulpik.com
# Esto no afectará otros proyectos existentes
NGINX_CONFIG="/etc/nginx/sites-available/complex.ulpik.com"
cat > /tmp/nginx-complex.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name complex.ulpik.com;

    # Frontend (React build)
    location / {
        root /var/www/html/complex/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Solo crear/actualizar la configuración de complex.ulpik.com
# No tocar otras configuraciones existentes
mv /tmp/nginx-complex.conf "$NGINX_CONFIG"

# Habilitar sitio (solo si no está ya habilitado)
if [ ! -L /etc/nginx/sites-enabled/complex.ulpik.com ]; then
    ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
fi

# Verificar y recargar Nginx (esto no afecta otros proyectos)
if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx configurado para complex.ulpik.com"
    echo "✅ Otros proyectos siguen funcionando normalmente"
else
    echo "❌ Error en configuración de Nginx"
    echo "   Revisa: nginx -t"
    exit 1
fi

# 13. Detener proceso anterior si existe
echo "🛑 Deteniendo proceso anterior si existe..."
pm2 delete banco-preguntas-api 2>/dev/null || true

# 14. Iniciar servidor con PM2
echo "🚀 Iniciando servidor con PM2..."
cd "$PROJECT_DIR"
pm2 start server.js --name "banco-preguntas-api" --env production
pm2 save

# 15. Configurar PM2 para iniciar al arrancar
echo "⚙️  Configurando PM2 para iniciar al arrancar..."
pm2 startup | grep -v "PM2" | bash || true

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ✅ CONFIGURACIÓN COMPLETADA                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Estado del servidor:"
pm2 status
echo ""
echo "📋 Próximos pasos:"
echo "   1. Edita .env y agrega tu OPENAI_API_KEY:"
echo "      nano $PROJECT_DIR/.env"
echo ""
echo "   2. Si necesitas importar datos:"
echo "      cd $PROJECT_DIR"
echo "      npm run import"
echo ""
echo "   3. Ver logs del servidor:"
echo "      pm2 logs banco-preguntas-api"
echo ""
echo "   4. Accede a: http://complex.ulpik.com"
echo ""
echo "✅ ¡Proyecto configurado y funcionando!"

