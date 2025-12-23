# Guía de Actualización en Producción

Instrucciones paso a paso para actualizar el proyecto en producción y restaurar el backup de la base de datos.

## 🔄 Actualizar Proyecto en Producción

### Paso 1: Conectarse al servidor

```bash
ssh root@45.55.81.191
```

### Paso 2: Ir al directorio del proyecto

```bash
cd /var/www/html/test_complex
```

### Paso 3: Hacer backup de la base de datos actual (por seguridad)

```bash
# Crear directorio de backups si no existe
mkdir -p backups

# Hacer backup de la base de datos actual
cp database/banco_preguntas.db backups/banco_preguntas_backup_$(date +%Y%m%d_%H%M%S).db

# Comprimir
gzip backups/banco_preguntas_backup_*.db
```

### Paso 4: Actualizar código desde GitHub

```bash
# Detener el servidor temporalmente
pm2 stop banco-preguntas-api

# Guardar cambios locales si hay alguno
git stash

# Actualizar desde GitHub
git pull origin main

# Si hay conflictos, resolverlos manualmente
```

### Paso 5: Instalar nuevas dependencias (si hay)

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
npm run build
cd ..
```

### Paso 6: Restaurar backup de la base de datos

```bash
# Opción A: Desde el backup en GitHub (recomendado)
curl -o backups/banco_preguntas_latest.db.gz https://raw.githubusercontent.com/cto-ulpik/test_complex/main/backups/banco_preguntas_latest.db.gz

# Descomprimir
gunzip backups/banco_preguntas_latest.db.gz

# Restaurar
cp backups/banco_preguntas_latest.db database/banco_preguntas.db

# Verificar permisos
chmod 644 database/banco_preguntas.db
```

### Paso 7: Verificar la base de datos

```bash
# Verificar que tiene datos
sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM materias;"
sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM preguntas;"
sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM respuestas;"

# Debería mostrar:
# 9 materias
# 781 preguntas (o más)
# 3107 respuestas (o más)
```

### Paso 8: Reiniciar el servidor

```bash
# Reiniciar con PM2
pm2 restart banco-preguntas-api

# Verificar que está corriendo
pm2 status

# Ver logs
pm2 logs banco-preguntas-api --lines 20
```

### Paso 9: Verificar que todo funciona

```bash
# Probar API localmente
curl http://localhost:5001/api/materias

# Verificar que Nginx está funcionando
systemctl status nginx

# Ver logs de Nginx si hay problemas
tail -f /var/log/nginx/error.log
```

### Paso 10: Probar en el navegador

Accede a: **https://complex.ulpik.com**

Verifica que:
- ✅ La página carga correctamente
- ✅ Las materias se muestran
- ✅ Las preguntas se cargan
- ✅ No hay errores en la consola del navegador

## 📋 Script de Actualización Automática

Puedes crear un script que haga todo automáticamente:

```bash
#!/bin/bash
# update-production.sh

set -e

cd /var/www/html/test_complex

echo "🔄 Actualizando proyecto en producción..."

# Backup de seguridad
mkdir -p backups
cp database/banco_preguntas.db backups/banco_preguntas_backup_$(date +%Y%m%d_%H%M%S).db
gzip backups/banco_preguntas_backup_*.db

# Detener servidor
pm2 stop banco-preguntas-api

# Actualizar código
git pull origin main

# Instalar dependencias
npm install
cd frontend && npm install && npm run build && cd ..

# Restaurar backup
curl -o backups/banco_preguntas_latest.db.gz https://raw.githubusercontent.com/cto-ulpik/test_complex/main/backups/banco_preguntas_latest.db.gz
gunzip -f backups/banco_preguntas_latest.db.gz
cp backups/banco_preguntas_latest.db database/banco_preguntas.db

# Reiniciar servidor
pm2 restart banco-preguntas-api

echo "✅ Actualización completada!"
pm2 status
```

## 🔧 Solución de Problemas

### Si el servidor no inicia

```bash
# Ver logs detallados
pm2 logs banco-preguntas-api --lines 50

# Verificar que el puerto 5001 está libre
ss -tulpn | grep 5001

# Verificar permisos de la base de datos
ls -la database/banco_preguntas.db
```

### Si la base de datos está vacía

```bash
# Verificar que el backup se descargó correctamente
ls -lh backups/banco_preguntas_latest.db

# Verificar contenido de la base de datos
sqlite3 database/banco_preguntas.db ".tables"
sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM materias;"

# Si está vacía, reimportar desde JSON
npm run import
```

### Si hay errores de permisos

```bash
# Ajustar permisos
chown -R root:root /var/www/html/test_complex
chmod 644 database/banco_preguntas.db
chmod 755 database/
```

## 📝 Checklist de Actualización

- [ ] Backup de la base de datos actual creado
- [ ] Código actualizado desde GitHub
- [ ] Dependencias instaladas
- [ ] Frontend reconstruido
- [ ] Backup restaurado desde GitHub
- [ ] Base de datos verificada (tiene datos)
- [ ] Servidor reiniciado
- [ ] API funcionando (curl localhost:5001/api/materias)
- [ ] Sitio web accesible (https://complex.ulpik.com)
- [ ] Sin errores en logs

## ⚠️ Notas Importantes

1. **Siempre hacer backup antes de actualizar**
2. **Verificar que el backup tiene datos antes de restaurar**
3. **Probar en el navegador después de actualizar**
4. **Mantener el servidor detenido durante la actualización para evitar inconsistencias**

