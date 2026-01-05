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

Si ya tienes el sistema corriendo en `/home/adminflow` (sea Ubuntu, Alpine o cualquier Linux), sigue estos pasos:

### 1. Descargar Cambios
```bash
cd /home/adminflow
git pull origin main
```

### 2. Actualizar Dependencias (Backend)
```bash
cd server
npm install
# Si hubo cambios en la estructura de DB, reinicia el servicio
pm2 restart adminflow-api
```

### 3. Actualizar Frontend (Requerido para cambios visuales)
```bash
cd ../client
npm install
npm run build
# Reiniciar servicio web para servir la nueva build
pm2 restart adminflow-web
```

### Resumen Rápido (One-Liner)
Puedes copiar y pegar esto si ya estás en la carpeta raíz:

```bash
git pull origin main && \
cd server && npm install && \
cd ../client && npm install && npm run build && \
pm2 restart all
```
