# Configuración Multi-Proyecto

Esta guía explica cómo configurar el proyecto `test_complex` sin afectar otros proyectos existentes en el servidor.

## 📋 Proyectos en el Servidor

Basado en `/var/www/html`, los proyectos existentes son:
- `brands-manager-monorepo/`
- `monitoreoMarcario/`
- `complex/` (nuevo - test_complex)

## 🔧 Configuración de Puertos

Cada proyecto debe usar un puerto diferente para evitar conflictos:

| Proyecto | Puerto | Dominio |
|----------|--------|---------|
| brands-manager-monorepo | 3000 (o según su config) | (según su config) |
| monitoreoMarcario | 3001 (o según su config) | (según su config) |
| complex (test_complex) | 5001 | complex.ulpik.com |

## 🚀 Configuración de Nginx

### Configuración para complex.ulpik.com

El script `setup-server.sh` crea una configuración **independiente** en:
```
/etc/nginx/sites-available/complex.ulpik.com
```

Esta configuración:
- ✅ Solo afecta a `complex.ulpik.com`
- ✅ No modifica otras configuraciones existentes
- ✅ No interfiere con otros proyectos

### Verificar Configuraciones Existentes

```bash
# Ver todos los sitios configurados
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Verificar que todos funcionan
nginx -t
systemctl status nginx
```

## 📝 Estructura de Configuración Nginx

Cada proyecto tiene su propia configuración:

```
/etc/nginx/sites-available/
├── brands-manager-monorepo.conf  (existente)
├── monitoreoMarcario.conf        (existente)
└── complex.ulpik.com             (nuevo)
```

## 🔍 Verificar que Todos los Proyectos Funcionan

### 1. Ver procesos PM2
```bash
pm2 list
```

Deberías ver:
- Proceso de brands-manager-monorepo (si usa PM2)
- Proceso de monitoreoMarcario (si usa PM2)
- banco-preguntas-api (puerto 5001)

### 2. Verificar puertos en uso
```bash
netstat -tulpn | grep LISTEN
# o
ss -tulpn | grep LISTEN
```

### 3. Verificar Nginx
```bash
nginx -t
systemctl status nginx
```

### 4. Probar cada proyecto
- brands-manager-monorepo: (su dominio/puerto)
- monitoreoMarcario: (su dominio/puerto)
- complex: http://complex.ulpik.com

## 🛠️ Solución de Problemas

### Si un proyecto deja de funcionar

1. **Verificar que el proceso está corriendo:**
   ```bash
   pm2 list
   # o
   ps aux | grep node
   ```

2. **Verificar el puerto:**
   ```bash
   netstat -tulpn | grep :PUERTO
   ```

3. **Verificar configuración Nginx:**
   ```bash
   cat /etc/nginx/sites-available/NOMBRE_PROYECTO
   nginx -t
   ```

4. **Reiniciar Nginx:**
   ```bash
   systemctl restart nginx
   ```

### Si hay conflicto de puertos

Si dos proyectos intentan usar el mismo puerto:

1. Editar el archivo de configuración del proyecto
2. Cambiar el puerto en:
   - El código del servidor (server.js, app.js, etc.)
   - La configuración de Nginx (proxy_pass)
   - Variables de entorno (.env)

3. Reiniciar el proceso:
   ```bash
   pm2 restart NOMBRE_PROCESO
   ```

## 📊 Monitoreo de Proyectos

### Ver logs de todos los proyectos PM2
```bash
pm2 logs
```

### Ver logs de un proyecto específico
```bash
pm2 logs banco-preguntas-api
```

### Ver estado de todos
```bash
pm2 status
```

## ✅ Checklist de Verificación

Después de instalar `complex`, verifica:

- [ ] `pm2 list` muestra todos los procesos
- [ ] `nginx -t` no muestra errores
- [ ] Todos los dominios responden correctamente
- [ ] No hay conflictos de puertos
- [ ] Los logs no muestran errores

## 🔄 Actualizar un Proyecto Específico

Para actualizar solo `complex` sin afectar otros:

```bash
cd /var/www/html/complex
git pull
npm install
cd frontend && npm run build && cd ..
pm2 restart banco-preguntas-api
```

Los otros proyectos no se verán afectados.

