# 📦 Archivos para Subir al Servidor Remoto

## 🚨 Archivos CRÍTICOS (Sin estos NO funcionará)

Estos archivos **DEBEN** estar en el servidor remoto en el directorio `server/`:

### 1. server/.installed
```json
{"installedAt":"2025-11-25T03:42:27.745Z","version":"1.0.0"}
```

### 2. server/.selected-db.json
```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://crm.infratec.com.uy:29999",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
```

---

## 📋 Métodos de Despliegue

### Opción A: Subir solo los archivos de configuración (RÁPIDO)

Si tu código ya está en el servidor y solo necesitas los archivos de configuración:

```powershell
# Desde tu máquina Windows, en el directorio del proyecto
scp server/.installed root@crm.infratec.com.uy:/root/adminflow/server/
scp server/.selected-db.json root@crm.infratec.com.uy:/root/adminflow/server/
```

Luego reinicia:
```bash
ssh root@crm.infratec.com.uy "cd /root/adminflow && pm2 restart adminflow"
```

---

### Opción B: Script Automático (RECOMENDADO)

Usa el script que ya creé:

```powershell
.\deploy-fix-production.ps1
```

Este script automáticamente:
- ✅ Crea los archivos con la configuración correcta
- ✅ Los sube al servidor via SCP
- ✅ Reinicia el servicio PM2

---

### Opción C: Despliegue Completo de la Aplicación

Si necesitas subir toda la aplicación actualizada:

#### Estructura a desplegar:

```
adminflow/
├── server/
│   ├── .installed                    ⭐ CRÍTICO
│   ├── .selected-db.json            ⭐ CRÍTICO
│   ├── index.js                     ✅ Código principal
│   ├── db.js                        ✅ Configuración DB
│   ├── package.json                 ✅ Dependencias
│   ├── app/                         ✅ Módulos de aplicación
│   ├── lib/                         ✅ Librerías
│   ├── routes/                      ✅ Rutas API
│   ├── middleware/                  ✅ Middleware
│   ├── schemas/                     ✅ Esquemas
│   ├── scripts/                     ✅ Scripts auxiliares
│   └── uploads/                     📁 Crear vacío (para archivos)
│
└── client/
    ├── .next/                       🔨 Construir en servidor
    ├── app/                         ✅ Código Next.js
    ├── components/                  ✅ Componentes
    ├── lib/                         ✅ Utilidades
    ├── public/                      ✅ Assets públicos
    ├── package.json                 ✅ Dependencias
    └── next.config.ts               ✅ Configuración

⭐ = CRÍTICO para evitar el instalador
✅ = Necesario para la aplicación
🔨 = Generar en el servidor
📁 = Crear directorio vacío
❌ = NO subir
```

#### Archivos que NO debes subir:

```
❌ node_modules/          (se instalan con npm install)
❌ .next/                 (se genera con npm run build)
❌ database/*.sqlite      (si usas MongoDB)
❌ uploads/*              (archivos de usuarios)
❌ .env                   (configurar en el servidor)
❌ error.log              (logs locales)
❌ *.log                  (logs)
```

---

## 🚀 Proceso de Despliegue Completo

### 1. Preparar archivos localmente

```powershell
# En tu máquina Windows
cd C:\Users\Flavio\Documents\EXPRESS\adminflow

# Verificar que los archivos críticos existan
dir server\.installed
dir server\.selected-db.json
```

### 2. Subir al servidor

**Usando rsync (recomendado si tienes WSL o Git Bash):**

```bash
# Subir servidor
rsync -avz --exclude 'node_modules' --exclude '*.log' \
  server/ root@crm.infratec.com.uy:/root/adminflow/server/

# Subir cliente
rsync -avz --exclude 'node_modules' --exclude '.next' \
  client/ root@crm.infratec.com.uy:/root/adminflow/client/
```

**Usando SCP (alternativa):**

```powershell
# Comprimir localmente
Compress-Archive -Path server\* -DestinationPath server.zip -Force
Compress-Archive -Path client\* -DestinationPath client.zip -Force

# Subir
scp server.zip root@crm.infratec.com.uy:/root/adminflow/
scp client.zip root@crm.infratec.com.uy:/root/adminflow/

# En el servidor, descomprimir
ssh root@crm.infratec.com.uy
cd /root/adminflow
unzip -o server.zip -d server/
unzip -o client.zip -d client/
```

**Usando Git (más limpio):**

```bash
# En el servidor
ssh root@crm.infratec.com.uy
cd /root/adminflow
git pull origin main  # o tu rama principal

# Luego agregar los archivos críticos manualmente
```

### 3. Instalar dependencias en el servidor

```bash
ssh root@crm.infratec.com.uy

# Instalar dependencias del servidor
cd /root/adminflow/server
npm install --production

# Instalar dependencias del cliente
cd /root/adminflow/client
npm install
npm run build  # Construir Next.js para producción
```

### 4. Verificar archivos críticos

```bash
# En el servidor
cd /root/adminflow/server
ls -la .installed .selected-db.json
cat .installed
cat .selected-db.json
```

Si no existen, créalos:

```bash
# Opción 1: Usar el script
node fix-production-install.js

# Opción 2: Crearlos manualmente
echo '{"installedAt":"2025-12-15T00:00:00.000Z","version":"1.0.0"}' > .installed
echo '{"engine":"mongodb","mongoUri":"mongodb://crm.infratec.com.uy:29999","mongoDb":"adminflow","sqlitePath":"database/database.sqlite"}' > .selected-db.json
```

### 5. Configurar variables de entorno (opcional)

```bash
# Crear/editar .env en el servidor
cd /root/adminflow/server
nano .env
```

Contenido recomendado:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=tu_secret_jwt_seguro
DB_ENGINE=mongodb
MONGO_URI=mongodb://crm.infratec.com.uy:29999
MONGO_DB=adminflow
```

### 6. Iniciar/Reiniciar servicios

```bash
# Con PM2
pm2 restart adminflow
pm2 save

# O iniciar desde cero
pm2 delete adminflow
cd /root/adminflow
pm2 start server/index.js --name adminflow-server
pm2 start "npm --prefix client start" --name adminflow-client
pm2 save
pm2 startup  # Para que arranque automáticamente
```

---

## ✅ Checklist de Verificación

Después del despliegue, verifica:

- [ ] Los archivos `.installed` y `.selected-db.json` existen en `server/`
- [ ] Las dependencias están instaladas (`node_modules/` existe)
- [ ] El cliente está construido (`.next/` existe en `client/`)
- [ ] Los servicios PM2 están corriendo: `pm2 list`
- [ ] La API responde: `curl http://localhost:5000/api/install/status`
- [ ] El cliente responde: `curl http://localhost:3000`
- [ ] No redirige al instalador cuando abres en el navegador
- [ ] MongoDB conecta correctamente

---

## 🔧 Comando Rápido (Todo en Uno)

```bash
# Ejecutar en el servidor después de subir archivos
cd /root/adminflow && \
node server/fix-production-install.js && \
cd server && npm install --production && \
cd ../client && npm install && npm run build && \
cd .. && \
pm2 restart all
```

---

## 📝 Resumen: Archivos Mínimos Necesarios

Si ya tienes el código en el servidor y solo falta la configuración:

**Solo necesitas subir 2 archivos:**
1. `server/.installed`
2. `server/.selected-db.json`

**Comando rápido:**
```powershell
scp server/.installed server/.selected-db.json root@crm.infratec.com.uy:/root/adminflow/server/
ssh root@crm.infratec.com.uy "pm2 restart adminflow"
```

¡Listo! 🎉
