# 🔧 Solución: Sistema redirige al instalador en producción

## 📋 Problema

Tu aplicación en producción redirige al instalador (`/install`) porque no encuentra los archivos que marcan el sistema como instalado:
- `server/.installed` - Marca que el sistema fue instalado
- `server/.selected-db.json` - Configuración de la base de datos

## ✅ Soluciones

### Opción 1: Script Automático Local (Recomendado)

Si estás ejecutando el servidor localmente:

```powershell
# En el directorio raíz del proyecto
node server/fix-production-install.js
```

Luego reinicia el servidor:
```powershell
pm2 restart adminflow
# O si usas npm:
npm run dev  # o npm start
```

---

### Opción 2: Script Remoto (Para servidores de producción)

Si tu servidor está en `crm.infratec.com.uy`:

**Windows (PowerShell):**
```powershell
.\deploy-fix-production.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-fix-production.sh
./deploy-fix-production.sh
```

El script:
1. Crea los archivos de configuración necesarios
2. Los sube al servidor remoto
3. Reinicia el servicio automáticamente

---

### Opción 3: Manual en el Servidor

Si prefieres hacerlo manualmente:

1. **Conéctate al servidor:**
   ```bash
   ssh root@crm.infratec.com.uy
   ```

2. **Ve al directorio del proyecto:**
   ```bash
   cd /root/adminflow/server
   ```

3. **Crea el archivo `.installed`:**
   ```bash
   cat > .installed << 'EOF'
   {
     "installedAt": "2025-12-15T00:00:00.000Z",
     "version": "1.0.0",
     "environment": "production"
   }
   EOF
   ```

4. **Crea el archivo `.selected-db.json`:**
   ```bash
   cat > .selected-db.json << 'EOF'
   {
     "engine": "mongodb",
     "mongoUri": "mongodb://crm.infratec.com.uy:29999",
     "mongoDb": "adminflow",
     "sqlitePath": "database/database.sqlite"
   }
   EOF
   ```

5. **Reinicia el servidor:**
   ```bash
   cd ..
   pm2 restart adminflow
   # O si no usas PM2:
   npm restart
   ```

---

## 🔍 Verificar que funcionó

### Opción A: Desde tu máquina local
```powershell
node check-installation-status.js
```

### Opción B: Verificar en el servidor
```bash
ssh root@crm.infratec.com.uy
cd /root/adminflow/server
ls -la .installed .selected-db.json
```

Deberías ver ambos archivos listados.

### Opción C: Probar la API
```powershell
# Verifica el status de instalación
curl http://crm.infratec.com.uy:5000/api/install/status
```

Debería devolver: `{"installed": true}`

---

## 🚨 Si sigue sin funcionar

1. **Verifica la conexión a MongoDB:**
   ```bash
   mongosh mongodb://crm.infratec.com.uy:29999/adminflow --eval "db.stats()"
   ```

2. **Revisa los logs del servidor:**
   ```bash
   pm2 logs adminflow
   # O si no usas PM2:
   tail -f /path/to/server/logs
   ```

3. **Verifica permisos de archivos:**
   ```bash
   chmod 644 /root/adminflow/server/.installed
   chmod 644 /root/adminflow/server/.selected-db.json
   ```

---

## 📦 Para futuros despliegues

Asegúrate de incluir estos archivos en tu proceso de despliegue:

**En tu `.gitignore`, NO ignores estos archivos en producción:**
```bash
# Estos archivos deben existir en producción
# server/.installed
# server/.selected-db.json
```

O mejor aún, créalos automáticamente en tu script de despliegue:
```bash
# En tu script de deploy
cd /path/to/adminflow/server
node fix-production-install.js
pm2 restart adminflow
```

---

## 🔐 Variables de entorno (Alternativa)

También puedes configurar variables de entorno en lugar de archivos:

```bash
# En tu servidor, crea/edita ~/.bashrc o /etc/environment
export DB_ENGINE=mongodb
export MONGO_URI=mongodb://crm.infratec.com.uy:29999
export MONGO_DB=adminflow
```

Pero **aún necesitarás el archivo `.installed`** para marcar el sistema como configurado.

---

## 📞 Soporte

Si continúas teniendo problemas:
1. Ejecuta `node check-installation-status.js`
2. Revisa los logs: `pm2 logs adminflow`
3. Verifica la conexión a MongoDB
4. Asegúrate de que el puerto 29999 esté accesible
