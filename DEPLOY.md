# Guía de Despliegue - complex.ulpik.com

Guía completa para desplegar el proyecto Banco de Preguntas en un servidor Ubuntu.

## 📋 Requisitos Previos

- Servidor Ubuntu 24.10
- Acceso root o sudo
- Dominio configurado: complex.ulpik.com
- Node.js y npm instalados

## 🚀 Pasos de Despliegue

### 1. Conectarse al servidor

```bash
ssh root@45.55.81.191
```

### 2. Instalar Node.js (si no está instalado)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 3. Instalar PM2 (gestor de procesos)

```bash
sudo npm install -g pm2
```

### 4. Clonar el repositorio

```bash
cd /var/www/html
git clone https://github.com/cto-ulpik/test_complex.git complex
cd complex
```

### 5. Instalar dependencias

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
npm run build
cd ..
```

### 6. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Agregar:
```
OPENAI_API_KEY=tu_api_key_aqui
NODE_ENV=production
PORT=5001
```

### 7. Importar datos a la base de datos

```bash
# Si tienes el archivo TXT en el servidor
python3 txt_to_json.py
npm run import
```

O subir `banco_preguntas.json` y ejecutar:
```bash
npm run import
```

### 8. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/complex.ulpik.com
```

Agregar configuración:

```nginx
server {
    listen 80;
    server_name complex.ulpik.com;

    # Redirigir a HTTPS (si tienes SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend (React build)
    location / {
        root /var/www/html/complex/frontend/build;
        try_files $uri $uri/ /index.html;
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
```

Habilitar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/complex.ulpik.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Iniciar el servidor con PM2

```bash
cd /var/www/html/complex
pm2 start server.js --name "banco-preguntas-api"
pm2 save
pm2 startup
```

### 10. Verificar que todo funciona

```bash
# Ver logs de PM2
pm2 logs banco-preguntas-api

# Ver estado
pm2 status

# Verificar Nginx
sudo systemctl status nginx
```

## 🔧 Comandos Útiles

### Reiniciar el servidor
```bash
pm2 restart banco-preguntas-api
```

### Ver logs
```bash
pm2 logs banco-preguntas-api
```

### Detener el servidor
```bash
pm2 stop banco-preguntas-api
```

### Actualizar el código
```bash
cd /var/www/html/complex
git pull
npm install
cd frontend
npm install
npm run build
cd ..
pm2 restart banco-preguntas-api
```

## 🔒 Configurar SSL (Opcional)

Si tienes certificado SSL:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d complex.ulpik.com
```

## 📝 Notas

- El frontend se sirve desde `/var/www/html/complex/frontend/build`
- El backend corre en `http://localhost:5001`
- PM2 mantiene el proceso corriendo automáticamente
- Los logs están disponibles con `pm2 logs`

