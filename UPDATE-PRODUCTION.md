# 📋 Guía de Actualización en Producción

## 🚀 Actualizar Proyecto desde GitHub

### Pasos para Actualizar

1. **Conectarse al servidor:**
   ```bash
   ssh root@45.55.81.191
   ```

2. **Ir al directorio del proyecto:**
   ```bash
   cd /var/www/html/test_complex
   ```

3. **Hacer backup de la base de datos (RECOMENDADO):**
   ```bash
   mkdir -p backups
   cp database/banco_preguntas.db backups/backup_antes_update_$(date +%Y%m%d_%H%M%S).db
   gzip backups/backup_antes_update_*.db
   ```

4. **Verificar estado de Git:**
   ```bash
   git status
   ```

5. **Actualizar código desde GitHub:**
   ```bash
   git fetch origin
   git pull origin main
   ```
   
   Si hay conflictos con archivos locales (como scripts), puedes usar:
   ```bash
   git stash  # Guardar cambios locales temporalmente
   git pull origin main
   git stash pop  # Aplicar cambios locales de nuevo (si es necesario)
   ```

6. **Instalar/actualizar dependencias del backend:**
   ```bash
   npm install
   ```

7. **Instalar/actualizar dependencias del frontend:**
   ```bash
   cd frontend
   npm install
   ```

8. **Reconstruir el frontend:**
   ```bash
   npm run build
   cd ..
   ```

9. **Reiniciar el servidor con PM2:**
   ```bash
   pm2 restart banco-preguntas-api
   ```

10. **Verificar que el servidor está corriendo:**
    ```bash
    pm2 status
    pm2 logs banco-preguntas-api --lines 20
    ```

11. **Verificar que los endpoints funcionan:**
    ```bash
    curl http://localhost:5001/api/estadisticas
    curl http://localhost:5001/api/materias
    ```

12. **Recargar Nginx (si es necesario):**
    ```bash
    nginx -t  # Verificar configuración
    systemctl reload nginx
    ```

### ⚠️ Si algo sale mal

**Restaurar desde backup:**
```bash
cd /var/www/html/test_complex
gunzip backups/backup_antes_update_*.db.gz
cp backups/backup_antes_update_*.db database/banco_preguntas.db
pm2 restart banco-preguntas-api
```

**Ver logs de errores:**
```bash
pm2 logs banco-preguntas-api --err
journalctl -u nginx -n 50
```

### 📝 Script Automático

También puedes usar el script `update-production.sh`:

```bash
cd /var/www/html/test_complex
./update-production.sh
```

---

## 🔄 Actualizar Solo la Base de Datos desde Backup

Si solo necesitas restaurar datos:

1. **Descargar backup desde GitHub:**
   ```bash
   cd /var/www/html/test_complex
   curl -o backups/banco_preguntas_latest.db.gz https://raw.githubusercontent.com/cto-ulpik/test_complex/main/backups/banco_preguntas_latest.db.gz
   ```

2. **Hacer backup de la BD actual:**
   ```bash
   cp database/banco_preguntas.db backups/backup_antes_restaurar_$(date +%Y%m%d_%H%M%S).db
   gzip backups/backup_antes_restaurar_*.db
   ```

3. **Detener servidor:**
   ```bash
   pm2 stop banco-preguntas-api
   ```

4. **Restaurar backup:**
   ```bash
   gunzip backups/banco_preguntas_latest.db.gz
   cp backups/banco_preguntas_latest.db database/banco_preguntas.db
   chmod 644 database/banco_preguntas.db
   ```

5. **Verificar:**
   ```bash
   sqlite3 database/banco_preguntas.db "SELECT COUNT(*) FROM preguntas;"
   ```

6. **Reiniciar servidor:**
   ```bash
   pm2 restart banco-preguntas-api
   ```

---

## ✅ Verificación Final

Después de actualizar, verifica:

1. **Frontend carga correctamente:**
   - Visita: `https://complex.ulpik.com`
   - Debe cargar sin errores

2. **API funciona:**
   - Abre consola del navegador (F12)
   - No debe haber errores 404 o 500

3. **Nuevas funcionalidades:**
   - Botón "📝 Modo Práctica" visible
   - Botón "📊 Estadísticas" visible
   - Funcionalidades CRUD funcionando

---

## 📞 Comandos Útiles

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs banco-preguntas-api

# Ver últimos 50 logs
pm2 logs banco-preguntas-api --lines 50

# Reiniciar servidor
pm2 restart banco-preguntas-api

# Verificar puerto
lsof -ti:5001

# Verificar Nginx
nginx -t
systemctl status nginx
```
