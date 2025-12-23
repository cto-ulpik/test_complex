#!/bin/bash

# Script de continuación para cuando apt update falla
# Ejecutar después de que setup-server.sh falle en apt update

set -e

echo "🚀 Continuando configuración de Banco de Preguntas..."

PROJECT_DIR="/var/www/html/test_complex"
cd "$PROJECT_DIR"

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs || {
        echo "⚠️  Instalando Node.js manualmente..."
        NODE_VERSION="20.11.0"
        curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz
        tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
        rm /tmp/node.tar.xz
        export PATH="/usr/local/bin:$PATH"
    }
fi
echo "✅ Node.js $(node --version)"

# 2. Instalar PM2 si no está
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "✅ PM2 instalado"

# 3. Instalar dependencias backend
echo "📦 Instalando dependencias del backend..."
npm install --production

# 4. Instalar dependencias frontend y construir
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
echo "🏗️  Construyendo frontend..."
npm run build
cd ..

# 5. Configurar .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Edita .env y agrega OPENAI_API_KEY: nano $PROJECT_DIR/.env"
fi

# 6. Crear directorio database
mkdir -p database

# 7. Importar datos si existe JSON
if [ -f banco_preguntas.json ]; then
    echo "📊 Importando datos..."
    npm run import
fi

# 8. Configurar Nginx
echo "🌐 Configurando Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/complex.ulpik.com"

cat > /tmp/nginx-complex.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name complex.ulpik.com;

    location / {
        root /var/www/html/test_complex/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

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

mv /tmp/nginx-complex.conf "$NGINX_CONFIG"
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/

if nginx -t; then
    systemctl reload nginx
    echo "✅ Nginx configurado"
else
    echo "❌ Error en Nginx, revisa: nginx -t"
fi

# 9. Iniciar con PM2
echo "🚀 Iniciando servidor..."
pm2 delete banco-preguntas-api 2>/dev/null || true
pm2 start server.js --name "banco-preguntas-api" --env production
pm2 save

echo ""
echo "✅ Configuración completada!"
echo "📊 Procesos PM2:"
pm2 list
echo ""
echo "🌐 Accede a: http://complex.ulpik.com"

