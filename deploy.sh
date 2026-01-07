#!/bin/bash

# Script de despliegue automático para complex.ulpik.com
# Ejecutar en el servidor Ubuntu

set -e

echo "🚀 Iniciando despliegue de Banco de Preguntas..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/var/www/html/complex"
REPO_URL="https://github.com/cto-ulpik/test_complex.git"

# 1. Verificar Node.js
echo -e "${YELLOW}📦 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node --version) instalado${NC}"

# 2. Instalar PM2
echo -e "${YELLOW}📦 Instalando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 instalado${NC}"

# 3. Crear directorio si no existe
echo -e "${YELLOW}📁 Preparando directorio...${NC}"
sudo mkdir -p /var/www/html
cd /var/www/html

# 4. Clonar o actualizar repositorio
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}🔄 Actualizando repositorio...${NC}"
    cd "$PROJECT_DIR"
    git pull
else
    echo -e "${YELLOW}📥 Clonando repositorio...${NC}"
    sudo git clone "$REPO_URL" complex
    cd "$PROJECT_DIR"
fi
echo -e "${GREEN}✅ Repositorio listo${NC}"

# 5. Instalar dependencias del backend
echo -e "${YELLOW}📦 Instalando dependencias del backend...${NC}"
npm install
echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"

# 6. Instalar dependencias del frontend y construir
echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
cd frontend
npm install
echo -e "${YELLOW}🏗️  Construyendo frontend...${NC}"
npm run build
cd ..
echo -e "${GREEN}✅ Frontend construido${NC}"

# 7. Configurar .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️  Configurando .env...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edita .env y agrega tu OPENAI_API_KEY${NC}"
    echo -e "${YELLOW}   nano $PROJECT_DIR/.env${NC}"
fi

# 8. Importar datos si no existe la BD
if [ ! -f database/banco_preguntas.db ]; then
    echo -e "${YELLOW}📊 Importando datos...${NC}"
    if [ -f banco_preguntas.json ]; then
        npm run import
        echo -e "${GREEN}✅ Datos importados${NC}"
    else
        echo -e "${YELLOW}⚠️  banco_preguntas.json no encontrado. Importa manualmente después.${NC}"
    fi
fi

# 9. Configurar Nginx
echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"
NGINX_CONFIG="/etc/nginx/sites-available/complex.ulpik.com"

sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
server {
    listen 80;
    server_name complex.ulpik.com;

    # Frontend (React build)
    location / {
        root /var/www/html/complex/frontend/build;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Habilitar sitio
sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/

# Verificar configuración
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx configurado y recargado${NC}"
else
    echo -e "${YELLOW}⚠️  Error en configuración de Nginx${NC}"
fi

# 10. Iniciar/Reiniciar con PM2
echo -e "${YELLOW}🚀 Iniciando servidor con PM2...${NC}"
cd "$PROJECT_DIR"
pm2 delete banco-preguntas-api 2>/dev/null || true
pm2 start server.js --name "banco-preguntas-api" --env production
pm2 save
echo -e "${GREEN}✅ Servidor iniciado con PM2${NC}"

# 11. Configurar PM2 para iniciar al arrancar
pm2 startup | grep -v "PM2" | bash || true

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ DESPLIEGUE COMPLETADO                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Edita .env y agrega tu OPENAI_API_KEY:"
echo "      nano $PROJECT_DIR/.env"
echo ""
echo "   2. Si no importaste datos, ejecuta:"
echo "      cd $PROJECT_DIR"
echo "      npm run import"
echo ""
echo "   3. Verifica que todo funciona:"
echo "      pm2 logs banco-preguntas-api"
echo "      pm2 status"
echo ""
echo "   4. Accede a: http://complex.ulpik.com"
echo ""


