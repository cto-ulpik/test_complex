#!/bin/bash

# Script para configurar SSL con Let's Encrypt
# Ejecutar en el servidor: bash setup-ssl.sh

set -e

DOMAIN="complex.ulpik.com"
EMAIL="admin@ulpik.com"  # Cambiar por tu email

echo "🔒 Configurando SSL para $DOMAIN..."

# 1. Instalar Certbot
echo "📦 Instalando Certbot..."
apt-get update -y 2>/dev/null || echo "⚠️  Advertencia: No se pudo actualizar repositorios"
apt-get install -y certbot python3-certbot-nginx 2>/dev/null || {
    echo "⚠️  Intentando instalación alternativa..."
    # Método alternativo si apt falla
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
}

# 2. Verificar que Nginx está corriendo
if ! systemctl is-active --quiet nginx; then
    echo "🚀 Iniciando Nginx..."
    systemctl start nginx
fi

# 3. Verificar que el dominio apunta al servidor
echo "🔍 Verificando DNS..."
IP=$(curl -s ifconfig.me || curl -s icanhazip.com)
echo "IP del servidor: $IP"
echo "⚠️  Asegúrate de que $DOMAIN apunta a esta IP"

# 4. Obtener certificado SSL
echo "📜 Obteniendo certificado SSL..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" || {
    echo "❌ Error obteniendo certificado"
    echo "   Verifica que:"
    echo "   1. El dominio apunta a este servidor"
    echo "   2. El puerto 80 está abierto"
    echo "   3. Nginx está corriendo"
    exit 1
}

# 5. Configurar renovación automática
echo "⚙️  Configurando renovación automática..."
certbot renew --dry-run

echo ""
echo "✅ SSL configurado correctamente!"
echo "🌐 Accede a: https://$DOMAIN"
echo ""
echo "📝 El certificado se renovará automáticamente cada 90 días"


