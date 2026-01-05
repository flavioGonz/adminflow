# 🚀 Guía de Despliegue en Alpine Linux y Actualización

## 🐧 Instalación en Alpine Linux

Alpine es muy ligero pero requiere instalar algunas herramientas de compilación para paquetes como `sqlite3` o `bcrypt`.

### 1. Instalar Dependencias del Sistema
```bash
# Actualizar repositorios
apk update

# Instalar Node.js, Git y herramientas de compilación
apk add nodejs npm git python3 make g++ gcc
```

### 2. Clonar el Proyecto
```bash
cd /home
git clone https://github.com/flavioGonz/adminflow.git
cd adminflow
```

### 3. Instalar Dependencias de la App
```bash
# Backend
cd server
npm install
# Si falla sqlite3, intenta: npm install sqlite3 --build-from-source

# Frontend
cd ../client
npm install
```

### 4. Configurar Entorno
Crea los archivos `.env` (Server) y `.env.local` (Client) con tus datos (ver `INSTALL_GUIDE.md`).

### 5. Build y Ejecución
```bash
# Construir Frontend
cd ../client
npm run build

# Ejecutar con PM2 (recomendado instalar globalmente)
npm install -g pm2

cd ../server
pm2 start npm --name "adminflow-api" -- start

cd ../client
pm2 start npm --name "adminflow-web" -- start

pm2 save
pm2 startup
```

---

## 🔄 Cómo Actualizar tu Versión Existente

### Problemas Comunes y Soluciones

#### 1. Error de Git: "Local changes would be overwritten"
Si ves este error, significa que hay archivos modificados en el servidor que entran en conflicto con la actualización. Para **forzar** la actualización (borrando cambios locales no guardados):

```bash
git reset --hard origin/main
git pull origin main
```

#### 2. Error de NPM: "ERESOLVE could not resolve" (React 19)
Si usas React 19, algunas librerías antiguas pueden dar error. Usa la bandera `--legacy-peer-deps`.

#### 3. PM2: "No process found"
Si PM2 dice que no hay procesos, es porque no están corriendo o el entorno se reinició. Debes iniciarlos de cero.

### ✅ COMANDO DE ACTUALIZACIÓN (Recomendado)

Copia y pega este bloque completo en tu terminal (Linux/Alpine):

```bash
# 1. Forzar descarga de última versión
cd /home/adminflow
git fetch --all
git reset --hard origin/main

# 2. Reinstalar Backend (Ignorando versiones estrictas)
cd server
npm install --legacy-peer-deps

# 3. Reinstalar y Reconstruir Frontend
cd ../client
npm install --legacy-peer-deps
npm run build

# 4. Reiniciar Servicios (Forzando reinicio si PM2 perdió los procesos)
cd ..
npm install -g pm2
pm2 delete all || true
cd server && pm2 start npm --name "adminflow-api" -- start
cd ../client && pm2 start npm --name "adminflow-web" -- start
pm2 save
```
