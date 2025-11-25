# 🎨 Instalador Web de AdminFlow

## Descripción

AdminFlow incluye un **instalador web interactivo** que guía paso a paso la configuración inicial del sistema. El instalador solo está disponible en la primera ejecución y se accede desde `/install`.

---

## 🚀 Características

### **Paso 1: Información de la Empresa**
- Nombre de la empresa *
- Dirección
- Teléfono
- Email *

### **Paso 2: Base de Datos**
- Seleccion entre MongoDB o SQLite (listos) y PostgreSQL/MySQL (planificados en el instalador)
- Elegir crear base nueva o apuntar a una existente/respaldada
- Configuracion y prueba de conexion por motor
- Inicializacion automatica de esquemas (Mongo/SQLite); PostgreSQL/MySQL requeriran migraciones cuando se habiliten

### **Paso 3: Notificaciones**
- Configuración de canales (opcional):
  - Email (SMTP)
  - Telegram
  - WhatsApp (Twilio)
  - Slack

### **Paso 4: Finalización**
- Resumen de configuración
- Mensaje de bienvenida
- Credenciales por defecto
- Redirección automática al login

---

## 📋 Flujo de Instalación

### **Primera Vez:**

```bash
# 1. Clonar repositorio
git clone https://github.com/flavioGonz/adminflow.git
cd adminflow

# 2. Instalar dependencias
cd server && npm install
cd ../client && npm install

# 3. Iniciar servidor
cd server && npm run dev

# 4. Iniciar cliente (otra terminal)
cd client && npm run dev

# 5. Abrir navegador
http://localhost:3000/install
```

El sistema detectará automáticamente que no está instalado y mostrará el wizard.

---

## 🎨 Diseño

El instalador incluye:

- ✨ **Animaciones suaves** con Framer Motion
- 🎯 **Indicador de progreso** visual
- 🎨 **Gradientes y colores** modernos
- 📱 **Diseño responsive** (móvil y desktop)
- ✅ **Validación en tiempo real**
- 🔄 **Prueba de conexión** con spinner animado
- 🎉 **Pantalla de éxito** con confetti visual

---

## 🔒 Seguridad

- El instalador solo está accesible si el archivo `.installed` NO existe
- Una vez completada la instalación, se crea el archivo `.installed`
- Todas las rutas de API están protegidas hasta completar la instalación
- Las rutas de instalación (`/api/install/*`) siempre están accesibles

---

## 🛠️ Archivos Creados

### **Cliente:**
- `client/app/install/page.tsx` - Página del instalador

### **Servidor:**
- `server/routes/install.js` - Rutas de API del instalador
- `server/middleware/checkInstallation.js` - Middleware de protección
- `server/.installed` - Archivo de bloqueo (se crea al finalizar)

---

## 🔄 Reinstalación

Si necesitas reinstalar el sistema:

```bash
# En el servidor
cd server
rm .installed
rm .selected-db.json

# Reiniciar servidor
npm run dev
```

Luego ve a `http://localhost:3000/install` y completa el wizard nuevamente.

---

## Seleccion de base de datos (wizard / API)

Paso 2 permite elegir el motor y si usas base nueva, existente o un respaldo.
- MongoDB: crea colecciones y admin automaticamente; para un respaldo usa `mongorestore --uri="<uri>" --db=<nombre> <ruta_dump>`.
- SQLite: crea el archivo si no existe; para usar datos previos apunta `sqlitePath` al `.sqlite` o copia el respaldo al mismo nombre.
- PostgreSQL y MySQL: se agregaran al selector al habilitar sus conectores. Debes crear la BD/usuario antes, restaurar con `pg_restore`/`psql` o `mysql < backup.sql` y pasar la URL en el payload.

## 📊 API Endpoints

### **GET /api/install/status**
Verifica si el sistema está instalado.

**Response:**
```json
{
  "installed": false
}
```

### **POST /api/install/test-db**
Prueba la conexión a la base de datos.

**Request:**
```json
{
  "type": "mongodb | sqlite | postgres | mysql",
  "mongoUri": "mongodb://localhost:27017",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite",
  "postgresUrl": "postgres://user:pass@host:5432/adminflow",
  "mysqlUrl": "mysql://user:pass@host:3306/adminflow"
}
```
MongoDB y SQLite ya estan soportados; PostgreSQL/MySQL se habilitaran cuando se incluyan sus conectores.

**Response:**
```json
{
  "success": true,
  "message": "Conexión exitosa"
}
```

### **POST /api/install/complete**
Completa la instalación.

**Request:**
```json
{
  "company": {
    "name": "Mi Empresa",
    "address": "Av. Principal 123",
    "phone": "+598 99 123 456",
    "email": "contacto@miempresa.com"
  },
  "database": {
    "type": "mongodb | sqlite | postgres | mysql",
    "mongoUri": "mongodb://localhost:27017",
    "mongoDb": "adminflow",
    "sqlitePath": "database/database.sqlite",
    "postgresUrl": "postgres://user:pass@host:5432/adminflow",
    "mysqlUrl": "mysql://user:pass@host:3306/adminflow"
  },
  "notifications": [
    {
      "id": "email",
      "name": "Email",
      "enabled": true,
      "config": {
        "host": "smtp.gmail.com",
        "port": "587",
        "user": "user@gmail.com",
        "pass": "password"
      }
    }
  ]
}
```
MongoDB/SQLite se crean y prueban desde el wizard hoy; PostgreSQL/MySQL requeriran sus conectores y migraciones para quedar operativos.

**Response:**
```json
{
  "success": true,
  "message": "Instalación completada exitosamente"
}
```

---

## 🎯 Credenciales por Defecto

Después de la instalación, usa estas credenciales para el primer login:

```
Email: admin@adminflow.uy
Password: admin
```

**⚠️ IMPORTANTE:** Cambia estas credenciales inmediatamente después del primer login.

---

## 💡 Tips

1. **MongoDB Local:** Asegúrate de que MongoDB esté ejecutándose antes de iniciar la instalación
2. **MongoDB Atlas:** Usa el connection string completo incluyendo usuario y contraseña
3. **Notificaciones:** Puedes configurarlas más tarde desde el panel de administración
4. **Prueba de Conexión:** Siempre prueba la conexión antes de continuar
5. **Backup:** Si reinstal as, haz backup de `.selected-db.json` si quieres mantener la configuración

---

## 🐛 Troubleshooting

### **Error: "Sistema ya instalado"**
- Elimina el archivo `server/.installed`
- Reinicia el servidor

### **Error: "No se puede conectar a MongoDB"**
- Verifica que MongoDB esté ejecutándose
- Verifica la URI de conexión
- Verifica las credenciales

### **Error: "Página en blanco"**
- Verifica que el cliente esté ejecutándose en puerto 3000
- Verifica que el servidor esté ejecutándose en puerto 5000
- Revisa la consola del navegador para errores

---

## 📚 Dependencias Nuevas

### **Cliente:**
- `framer-motion@^11.0.0` - Animaciones suaves

### **Servidor:**
- Ninguna dependencia nueva (usa las existentes)

---

**¡El instalador está listo para usar!** 🎉

Simplemente inicia la aplicación por primera vez y ve a `/install` para comenzar.
