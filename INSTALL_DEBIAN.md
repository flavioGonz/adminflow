# 🐧 Guía de Instalación para Debian 13 (Cloud/VPS)

Esta guía detalla paso a paso cómo desplegar **AdminFlow** en un servidor **Debian 13** limpio ("virgen").

## 1. Preparación del Sistema

Conéctate por SSH a tu servidor y ejecuta los siguientes comandos como `root` (o usa `sudo` si tienes un usuario con privilegios).

### Actualizar el sistema
```bash
apt update && apt upgrade -y
```

### Instalar herramientas esenciales
```bash
apt install -y curl git build-essential unzip
```

---

## 2. Instalación de Node.js (v20 LTS)

AdminFlow requiere una versión moderna de Node.js.

```bash
# Descargar e instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalación
node -v  # Debería mostrar v20.x.x
npm -v
```

---

## 3. Instalación de MongoDB

Instalaremos MongoDB Community Edition.

> **Nota:** Si Debian 13 no tiene repositorio oficial aún, usaremos el de Debian 12 (Bookworm) que suele ser compatible, o los binarios directos.

```bash
# Importar la llave pública
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Crear el archivo de lista para Debian 12 (compatible)
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar
apt update
apt install -y mongodb-org

# Iniciar y habilitar el servicio
systemctl start mongod
systemctl enable mongod

# Verificar estado
systemctl status mongod
```

---

## 4. Instalación de Process Manager (PM2)

PM2 mantendrá la aplicación corriendo en segundo plano y la reiniciará si falla.

```bash
npm install -g pm2
```

---

## 5. Despliegue de la Aplicación

### Clonar el repositorio
```bash
cd /var/www  # O la carpeta donde prefieras instalar
# Si no tienes permisos en /var/www:
# mkdir -p /var/www && chown -R $USER:$USER /var/www

git clone https://github.com/flavioGonz/adminflow.git
cd adminflow
```

### configurar Backend (Server)
```bash
cd server
npm install

# Configurar variables de entorno
cp .env.example .env  # Si existe, si no crea uno nuevo
```

**Crear/Editar `.env`:**
```bash
nano .env
```
Pegar el siguiente contenido (ajusta los secretos):
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=CAMBIAR_ESTO_POR_ALGO_SEGURO
SESSION_SECRET=CAMBIAR_ESTO_TAMBIEN
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=adminflow
```

### Configurar Frontend (Client)
```bash
cd ../client
npm install

# Configurar variables de entorno
nano .env.local
```
Contenido de `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://TU_IP_DEL_SERVIDOR:5000/api
# Si usas dominio: https://api.tudominio.com/api
```

> **Importante:** Al ser producción, asegúrate de que `NEXT_PUBLIC_API_URL` apunte a la IP pública o dominio del servidor, no a `localhost` (porque el navegador del cliente no está en el servidor).

### Construir el Cliente
```bash
npm run build
```

---

## 6. Ejecución con PM2

### Iniciar Backend
```bash
cd ../server
pm2 start npm --name "adminflow-server" -- start
```

### Iniciar Frontend
```bash
cd ../client
pm2 start npm --name "adminflow-client" -- start -- -H 0.0.0.0 -p 3000
```
> Nota: El flag `-H 0.0.0.0` es vital para que sea accesible desde fuera.

### Guardar configuración de arranque
Para que inicien automáticamente si se reinicia el servidor:
```bash
pm2 save
pm2 startup
# Ejecuta el comando que te muestre pm2 startup
```

---

## 7. Verificación

1. Abre tu navegador en `http://TU_IP_DEL_SERVIDOR:3000`.
2. Deberías ver la pantalla de login.
3. Login por defecto:
   - **User:** `admin@adminflow.uy`
   - **Pass:** `admin`

## Extras: Firewall

Si no puedes acceder, verifica que los puertos estén abiertos.

```bash
apt install ufw
ufw allow 22/tcp
ufw allow 3000/tcp
ufw allow 5000/tcp
ufw enable
```
