# Configuración de SSL para complex.ulpik.com

Guía para agregar certificado SSL (HTTPS) usando Let's Encrypt.

## 🔒 Opción 1: Script Automático (Recomendado)

```bash
cd /var/www/html/test_complex
curl -o setup-ssl.sh https://raw.githubusercontent.com/cto-ulpik/test_complex/main/setup-ssl.sh
chmod +x setup-ssl.sh
bash setup-ssl.sh
```

## 🔒 Opción 2: Configuración Manual

### 1. Instalar Certbot

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

Si `apt-get update` falla, usar snap:
```bash
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot
```

### 2. Verificar que el dominio apunta al servidor

```bash
# Ver IP del servidor
curl ifconfig.me

# Verificar DNS (desde tu máquina local)
nslookup complex.ulpik.com
```

El dominio debe apuntar a la IP del servidor (45.55.81.191).

### 3. Obtener certificado SSL

```bash
certbot --nginx -d complex.ulpik.com
```

Sigue las instrucciones:
- Ingresa tu email
- Acepta los términos
- Elige si redirigir HTTP a HTTPS (recomendado: Sí)

### 4. Verificar renovación automática

```bash
certbot renew --dry-run
```

## ✅ Verificación

Después de configurar SSL:

1. **Acceder a HTTPS:**
   ```
   https://complex.ulpik.com
   ```

2. **Verificar certificado:**
   ```bash
   certbot certificates
   ```

3. **Ver configuración de Nginx:**
   ```bash
   cat /etc/nginx/sites-available/complex.ulpik.com
   ```

## 🔄 Renovación Automática

Let's Encrypt renueva automáticamente los certificados. Para verificar:

```bash
# Probar renovación
certbot renew --dry-run

# Ver estado del certificado
certbot certificates
```

## 🛠️ Solución de Problemas

### Error: "Domain not pointing to this server"

- Verifica que el DNS esté configurado correctamente
- Espera a que se propague el DNS (puede tardar hasta 24 horas)
- Verifica con: `nslookup complex.ulpik.com`

### Error: "Port 80 is not open"

- Abre el puerto 80 en el firewall:
  ```bash
  ufw allow 80/tcp
  ufw allow 443/tcp
  ```

### Error: "Nginx not running"

```bash
systemctl start nginx
systemctl enable nginx
```

### Ver logs de Certbot

```bash
tail -f /var/log/letsencrypt/letsencrypt.log
```

## 📝 Notas

- Los certificados de Let's Encrypt duran 90 días
- Se renuevan automáticamente cada 60 días
- No requiere reiniciar Nginx después de la renovación
- Es completamente gratuito


