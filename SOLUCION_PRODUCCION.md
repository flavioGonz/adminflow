# 🚀 Solución: Instalador se activa en producción

## 📝 Resumen del Problema

Tu aplicación **local funciona perfectamente**:
- ✅ MongoDB conecta correctamente a `mongodb://crm.infratec.com.uy:29999/adminflow`
- ✅ La base de datos tiene 21 colecciones y 996 documentos
- ✅ Los archivos `.installed` y `.selected-db.json` existen

**Pero en producción**, el servidor remoto **redirige al instalador** porque le faltan estos archivos.

## 🎯 Solución Rápida

### Opción 1: Despliegue Automático (Recomendado)

Ejecuta este script que subirá los archivos necesarios al servidor remoto:

```powershell
# En Windows (PowerShell)
.\deploy-fix-production.ps1
```

```bash
# En Linux/Mac
chmod +x deploy-fix-production.sh
./deploy-fix-production.sh
```

El script:
1. Crea los archivos `.installed` y `.selected-db.json`
2. Los sube al servidor remoto via SCP
3. Reinicia el servicio PM2 automáticamente

---

### Opción 2: Manual en el Servidor Remoto

Si no tienes acceso SSH desde tu máquina local, conéctate directamente al servidor:

```bash
# 1. Conectarse al servidor
ssh root@crm.infratec.com.uy

# 2. Ir al directorio del proyecto
cd /root/adminflow/server  # Ajusta la ruta según tu instalación

# 3. Ejecutar el script de corrección
node fix-production-install.js

# 4. Reiniciar el servicio
pm2 restart adminflow
# O si no usas PM2:
# npm restart
```

---

### Opción 3: Crear Archivos Manualmente

Si prefieres crear los archivos a mano:

```bash
# En el servidor, directorio: /root/adminflow/server

# Crear .installed
cat > .installed << 'EOF'
{
  "installedAt": "2025-12-15T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
EOF

# Crear .selected-db.json
cat > .selected-db.json << 'EOF'
{
  "engine": "mongodb",
  "mongoUri": "mongodb://crm.infratec.com.uy:29999",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
EOF

# Verificar que se crearon
ls -la .installed .selected-db.json

# Reiniciar
pm2 restart adminflow
```

---

## ✅ Verificación

### 1. Verificar archivos en el servidor

```bash
ssh root@crm.infratec.com.uy
cd /root/adminflow/server
ls -la .installed .selected-db.json
cat .installed
cat .selected-db.json
```

### 2. Verificar la API

Desde tu máquina local o navegador:

```bash
curl http://crm.infratec.com.uy:5000/api/install/status
```

Debe devolver: `{"installed": true}`

### 3. Verificar en el navegador

Abre: `http://crm.infratec.com.uy:3000` (o tu puerto configurado)

**Debe cargar el dashboard directamente**, no el instalador.

---

## 🔍 Diagnóstico

Si necesitas diagnosticar el problema:

### Local (en tu máquina):
```powershell
node check-installation-status.js
```

### Remoto (en el servidor):
```bash
ssh root@crm.infratec.com.uy
cd /root/adminflow
node check-installation-status.js
```

---

## 📦 Para Futuros Despliegues

### Método 1: Incluir archivos en el repositorio

Agrega estos archivos a tu control de versiones para que siempre se desplieguen:

```bash
# En tu repositorio local
cd server

# Asegúrate de que .installed NO esté en .gitignore
git add .installed .selected-db.json
git commit -m "Agregar archivos de configuración de producción"
git push
```

Luego en el servidor:
```bash
git pull
pm2 restart adminflow
```

---

### Método 2: Script de Post-Deploy

Agrega a tu proceso de despliegue automático:

```bash
# En tu script deploy.sh o similar
cd /root/adminflow/server
node fix-production-install.js
pm2 restart adminflow
```

---

### Método 3: Variables de Entorno + Script

Crea un archivo `.env` en el servidor:

```bash
# /root/adminflow/server/.env
DB_ENGINE=mongodb
MONGO_URI=mongodb://crm.infratec.com.uy:29999
MONGO_DB=adminflow
NODE_ENV=production
```

Y modifica tu script de inicio para que ejecute `fix-production-install.js` si no existe `.installed`:

```json
// package.json
{
  "scripts": {
    "start": "node fix-production-install.js && node index.js",
    "dev": "nodemon index.js"
  }
}
```

---

## 🚨 Troubleshooting

### El instalador todavía aparece

1. Verifica que los archivos existen:
   ```bash
   ls -la /root/adminflow/server/.installed
   ```

2. Verifica permisos:
   ```bash
   chmod 644 /root/adminflow/server/.installed
   chmod 644 /root/adminflow/server/.selected-db.json
   ```

3. Verifica que PM2 esté usando el directorio correcto:
   ```bash
   pm2 describe adminflow
   ```

4. Reinicia PM2 completamente:
   ```bash
   pm2 delete adminflow
   pm2 start server/index.js --name adminflow
   pm2 save
   ```

### La conexión a MongoDB falla

1. Prueba la conexión desde el servidor:
   ```bash
   cd /root/adminflow/server
   node test-mongo-connection.js
   ```

2. Verifica que MongoDB esté corriendo:
   ```bash
   systemctl status mongod
   ```

3. Prueba con mongosh:
   ```bash
   mongosh mongodb://crm.infratec.com.uy:29999/adminflow
   ```

### Los archivos desaparecen después de deploy

Asegúrate de que tu script de deploy NO borre estos archivos:

```bash
# ❌ MAL - Esto borra todo
rm -rf /root/adminflow
git clone ...

# ✅ BIEN - Preserva configuración
cd /root/adminflow
git pull
npm install
pm2 restart adminflow
```

---

## 📞 Información del Sistema

Tu configuración actual:
- **MongoDB URI**: `mongodb://crm.infratec.com.uy:29999`
- **Base de Datos**: `adminflow`
- **Estado Local**: ✅ Funcionando (21 colecciones, 996 documentos)
- **Problema**: Solo en servidor remoto de producción

Los archivos necesarios están en el servidor local en:
- `C:\Users\Flavio\Documents\EXPRESS\adminflow\server\.installed`
- `C:\Users\Flavio\Documents\EXPRESS\adminflow\server\.selected-db.json`

---

## 🎯 Acción Inmediata

**Ejecuta ahora mismo:**

```powershell
# En tu máquina Windows
.\deploy-fix-production.ps1
```

Esto resolverá el problema en 30 segundos. ✨
