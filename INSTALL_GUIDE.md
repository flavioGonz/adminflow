# 📦 Guía de Instalación de AdminFlow en Nuevo PC

Esta guía te ayudará a instalar AdminFlow en un nuevo equipo desde cero.

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

### **1. Node.js 18 o superior**
```bash
# Verificar versión
node --version

# Si no está instalado, descarga desde:
# https://nodejs.org/
```

### **2. Git**
```bash
# Verificar instalación
git --version

# Si no está instalado, descarga desde:
# https://git-scm.com/
```

### **3. MongoDB 5.6 o superior**

**Opción A: MongoDB Local (Windows)**
1. Descargar desde: https://www.mongodb.com/try/download/community
2. Instalar con las opciones por defecto
3. El servicio se iniciará automáticamente

**Opción B: MongoDB Atlas (Cloud)**
1. Crear cuenta gratuita en: https://www.mongodb.com/cloud/atlas
2. Crear un cluster gratuito
3. Obtener la cadena de conexión

**Verificar MongoDB:**
```bash
# Windows (verificar servicio)
sc query MongoDB

# Conectar con mongosh
mongosh
```

---

## 🚀 Instalación Paso a Paso

### **Paso 1: Clonar el Repositorio**

```bash
# Clonar desde GitHub
git clone https://github.com/tu-usuario/adminflow.git

# Entrar al directorio
cd adminflow
```

### **Paso 2: Instalar Dependencias del Servidor**

```bash
# Ir al directorio del servidor
cd server

# Instalar dependencias
npm install

# Volver al directorio raíz
cd ..
```

### **Paso 3: Instalar Dependencias del Cliente**

```bash
# Ir al directorio del cliente
cd client

# Instalar dependencias
npm install

# Volver al directorio raíz
cd ..
```

### **Paso 4: Configurar Variables de Entorno**

#### **Servidor (`server/.env`)**

Crear el archivo `server/.env` con el siguiente contenido:

```env
# Puerto del servidor
PORT=5000
NODE_ENV=development

# Seguridad
JWT_SECRET=tu_clave_secreta_super_segura_aqui_cambiar
SESSION_SECRET=otra_clave_secreta_para_sesiones_cambiar

# Credenciales de administrador por defecto
DEFAULT_ADMIN_EMAIL=admin@adminflow.uy
DEFAULT_ADMIN_PASSWORD=admin

# MongoDB (REQUERIDO)
# Opción 1: MongoDB Local
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=adminflow

# Opción 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/adminflow?retryWrites=true&w=majority
# MONGODB_DB=adminflow

# Email SMTP (Opcional - para notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion

# Telegram (Opcional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Twilio/WhatsApp (Opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Slack (Opcional)
SLACK_WEBHOOK=
```

#### **Cliente (`client/.env.local`)**

Crear el archivo `client/.env.local` con:

```env
# NextAuth
NEXTAUTH_SECRET=tu_nextauth_secret_key_cambiar
NEXTAUTH_URL=http://localhost:3000

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### **Paso 5: Configurar Base de Datos**

El servidor creará automáticamente la configuración de base de datos en el primer arranque. Si quieres configurarla manualmente, crea el archivo `server/.selected-db.json`:

```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://localhost:27017",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
```

### **Paso 6: Iniciar el Servidor**

```bash
# Abrir una terminal en el directorio server
cd server

# Iniciar en modo desarrollo
npm run dev
```

**Salida esperada:**
```
🚀 Iniciando AdminFlow Server...

╔════════════════════════════════════════════════════════╗
║         AdminFlow - Verificación de MongoDB           ║
╚════════════════════════════════════════════════════════╝

📡 MongoDB URI: mongodb://localhost:27017
🗄️  Base de datos: adminflow

🔍 Probando conexión a MongoDB...
✅ Conexión exitosa

🔍 Verificando estado de la base de datos...
⚠️  MongoDB no está inicializado
🚀 Iniciando auto-inicialización...

📋 Inicializando colecciones...
  ✅ Colección creada: users
  ✅ Colección creada: clients
  ✅ Colección creada: tickets
  ... (más colecciones)
  ✅ Usuario admin creado: admin@adminflow.uy

╔════════════════════════════════════════════════════════╗
║         ✅ AUTO-INICIALIZACIÓN EXITOSA                 ║
╚════════════════════════════════════════════════════════╝

🌐 Servidor corriendo en: http://localhost:5000
📊 MongoDB: ✅ Conectado
```

### **Paso 7: Iniciar el Cliente**

```bash
# Abrir OTRA terminal en el directorio client
cd client

# Iniciar en modo desarrollo
npm run dev
```

**Salida esperada:**
```
  ▲ Next.js 16.0.1
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

### **Paso 8: Acceder a la Aplicación**

1. Abrir navegador en: `http://localhost:3000`
2. Iniciar sesión con las credenciales por defecto:
   - **Email**: `admin@adminflow.uy`
   - **Password**: `admin`

3. **⚠️ IMPORTANTE**: Cambiar la contraseña inmediatamente después del primer login.

---

## ✅ Verificación de la Instalación

### **1. Verificar MongoDB**
```bash
# Conectar a MongoDB
mongosh

# Usar la base de datos
use adminflow

# Listar colecciones
show collections

# Debería mostrar:
# - users
# - clients
# - tickets
# - budgets
# - contracts
# - payments
# - products
# - client_accesses
# - calendar_events
# - notifications
# - configurations
# - audit_logs
```

### **2. Verificar el Dashboard**
- Navegar a `http://localhost:3000/dashboard`
- Deberías ver las tarjetas de estadísticas
- El mapa debería cargar correctamente

### **3. Verificar la Base de Datos**
- Navegar a `http://localhost:3000/database`
- Deberías ver:
  - Estado de conexión: "Conectado" (verde)
  - Lista de 12+ colecciones
  - Sección de respaldos

### **4. Crear un Cliente de Prueba**
1. Ir a `/clients`
2. Hacer clic en "Nuevo Cliente"
3. Llenar el formulario
4. Guardar
5. Verificar que aparezca en la lista

---

## 🔧 Troubleshooting

### **Error: "Cannot connect to MongoDB"**

**Solución 1: Verificar que MongoDB esté ejecutándose**
```bash
# Windows
sc query MongoDB

# Si no está ejecutándose:
net start MongoDB
```

**Solución 2: Verificar la URI**
- Revisar `server/.env` y `server/.selected-db.json`
- Asegurarse de que la URI sea correcta
- Para MongoDB local: `mongodb://localhost:27017`

### **Error: "Port 3000 is already in use"**

**Solución:**
```bash
# Windows - Encontrar el proceso
netstat -ano | findstr :3000

# Matar el proceso (reemplazar PID con el número encontrado)
taskkill /PID <PID> /F

# O cambiar el puerto en client/package.json:
# "dev": "next dev -p 3001"
```

### **Error: "Port 5000 is already in use"**

**Solución:**
```bash
# Windows - Encontrar el proceso
netstat -ano | findstr :5000

# Matar el proceso
taskkill /PID <PID> /F

# O cambiar el puerto en server/.env:
# PORT=5001
```

### **Error: "Module not found"**

**Solución:**
```bash
# Reinstalar dependencias del servidor
cd server
rm -rf node_modules package-lock.json
npm install

# Reinstalar dependencias del cliente
cd ../client
rm -rf node_modules package-lock.json
npm install
```

### **Error: "Authentication failed" en MongoDB**

**Solución:**
Si tu MongoDB requiere autenticación, actualiza la URI:
```env
MONGODB_URI=mongodb://usuario:password@localhost:27017/adminflow?authSource=admin
```

---

## 📦 Instalación en Producción

### **Opción 1: Servidor Dedicado (VPS)**

1. **Preparar el servidor**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MongoDB
# Seguir: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2
```

2. **Clonar y configurar**
```bash
git clone https://github.com/tu-usuario/adminflow.git
cd adminflow

# Instalar dependencias
cd server && npm install --production
cd ../client && npm install --production
```

3. **Configurar variables de entorno**
```bash
# Editar server/.env con valores de producción
nano server/.env

# Editar client/.env.local
nano client/.env.local
```

4. **Build del cliente**
```bash
cd client
npm run build
```

5. **Iniciar con PM2**
```bash
# Servidor
cd server
pm2 start npm --name "adminflow-server" -- start

# Cliente
cd ../client
pm2 start npm --name "adminflow-client" -- start

# Guardar configuración
pm2 save
pm2 startup
```

### **Opción 2: Docker (Recomendado)**

Próximamente se incluirá un `docker-compose.yml` para facilitar el deployment.

---

## 🔐 Seguridad en Producción

### **1. Cambiar Credenciales por Defecto**
- Cambiar contraseña del admin inmediatamente
- Actualizar `JWT_SECRET` y `SESSION_SECRET` con valores únicos

### **2. Configurar HTTPS**
- Usar un proxy inverso (Nginx/Apache)
- Obtener certificado SSL (Let's Encrypt)

### **3. Firewall**
```bash
# Permitir solo puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### **4. MongoDB**
- Habilitar autenticación
- Crear usuario específico para la aplicación
- Restringir acceso por IP

---

## 📚 Recursos Adicionales

- **Documentación Completa**: [README.md](./README.md)
- **API Reference**: [Apis.md](./Apis.md)
- **Base de Datos**: [db.md](./db.md)
- **Página de Database**: [DATABASE_PAGE.md](./DATABASE_PAGE.md)
- **Instalador Web**: [INSTALLER.md](./INSTALLER.md)

---

## 🆘 Soporte

Si encuentras problemas durante la instalación:

1. Revisa los logs del servidor y cliente
2. Verifica que todos los prerrequisitos estén instalados
3. Consulta la sección de Troubleshooting
4. Revisa los issues en GitHub
5. Crea un nuevo issue con detalles del error

---

**¡Listo!** AdminFlow debería estar funcionando correctamente en tu nuevo PC. 🎉
