# 🚀 AdminFlow

<div align="center">

![AdminFlow Logo](client/public/logo.png)

**Sistema de Gestión Empresarial Completo**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-green?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.6-green?logo=mongodb)](https://www.mongodb.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)](https://www.sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

[Características](#-características-principales) •
[Instalación](#-instalación-rápida) •
[Documentación](#-documentación) •
[Arquitectura](#-arquitectura) •
[Changelog](#-changelog)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación Rápida](#-instalación-rápida)
- [Configuración](#-configuración)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Reference](#-api-reference)
- [Base de Datos](#-base-de-datos)
- [Desarrollo](#-desarrollo)
- [Deployment](#-deployment)
- [Changelog](#-changelog)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Descripción General

**AdminFlow** es una plataforma integral de gestión empresarial que combina un frontend moderno construido con **Next.js 16** (React 19) y un backend robusto en **Express.js**, con una arquitectura híbrida de base de datos que utiliza **SQLite** como fuente primaria y **MongoDB** para sincronización y análisis avanzado.

El sistema cubre todo el ciclo comercial de una empresa de servicios:
- 👥 Gestión de clientes y contactos
- 🎫 Sistema de tickets e incidencias
- 📄 Generación de presupuestos y cotizaciones
- 💰 Control de pagos y facturación
- 📝 Gestión de contratos y SLAs
- 🔐 Repositorio técnico de credenciales
- 📊 Dashboard con métricas en tiempo real
- 🔔 Sistema de notificaciones multi-canal
- 📅 Calendario integrado
- 🗺️ Mapa de clientes con geolocalización

---

## ✨ Características Principales

### 🎨 **Interfaz Moderna y Responsive**
- Diseño premium con Tailwind CSS 4
- Componentes reutilizables con Radix UI y Shadcn/ui
- Transiciones suaves y animaciones
- Dark mode ready
- Mobile-first design

### 🔐 **Seguridad Robusta**
- Autenticación con NextAuth.js
- JWT tokens con expiración
- Sesiones seguras con express-session
- Encriptación de contraseñas con bcrypt
- Protección CORS configurada

### 📊 **Dashboard Inteligente**
- KPIs en tiempo real
- Gráficos interactivos con Chart.js
- Exportación a Excel/PDF
- Mapa embebido con Leaflet
- Widgets personalizables

### 🔔 **Sistema de Notificaciones Automáticas**
- **Multi-canal**: Email (SMTP), Telegram, WhatsApp (Twilio), Slack
- **Eventos automáticos**: Tickets, presupuestos, pagos, contratos
- **Configuración granular**: Define qué canales usar para cada evento
- **Plantillas personalizables**: Variables dinámicas (`{{cliente}}`, `{{ticket}}`)
- **Historial completo**: Tracking de todas las notificaciones enviadas

### 🗄️ **Arquitectura Híbrida de Datos**
- **SQLite**: Base operativa principal (rápida, confiable)
- **MongoDB**: Sincronización, respaldo y análisis
- **Migración automática**: Scripts de sincronización bidireccional
- **Fallback inteligente**: Sistema resiliente ante fallos

### 📱 **Módulos Especializados**

#### 🎫 **Tickets Avanzados**
- Estados personalizables (Nuevo, En Progreso, Resuelto, Cerrado)
- Prioridades con colores
- Adjuntos y grabaciones de audio
- Editor rico de texto (WYSIWYG)
- Bloqueo automático de tickets resueltos
- Historial de cambios

#### 💼 **Presupuestos Profesionales**
- Generación de PDF con portada personalizable
- Catálogo de productos integrado
- Secciones editables (Resumen, Alcance, Términos)
- Compartir por email/WhatsApp
- Tracking de estados (Nuevo, Enviado, Aprobado, Rechazado)
- Soporte multi-moneda (UYU/USD)

#### 🔐 **Repositorio Técnico**
- **Módulo de Accesos**: Gestión de credenciales por cliente
- Tipos de equipos: Router, Switch, Servidor, Firewall, Cámara, etc.
- Almacenamiento de IPs, usuarios, contraseñas
- Serie/MAC tracking
- Iconografía automática según tipo
- Búsqueda y filtros avanzados
- Exportación segura

#### 📝 **Contratos Inteligentes**
- SLA tracking
- Tipos de contrato (Mensual, Anual, Por Proyecto)
- Recurrencia configurable
- Upload de contratos firmados
- Deberes y responsabilidades
- Alertas de vencimiento
- Generación automática de eventos en calendario

#### 💰 **Gestión de Pagos**
- IDs únicos tipo `PAY-XXXXXX`
- Métodos de pago múltiples
- Estados (Pendiente, Pagado, Facturar)
- Vinculación con tickets
- Sugerencias automáticas por cliente
- Exportación a Excel/PDF
- Notificaciones automáticas

#### 📅 **Calendario Integrado**
- FullCalendar con drag & drop
- Eventos automáticos desde tickets/pagos/contratos
- Eventos bloqueados (solo editables desde origen)
- Vista mensual/semanal/diaria
- Sincronización bidireccional

#### 🗺️ **Mapa de Clientes**
- Leaflet con marcadores interactivos
- Geocodificación con Nominatim
- Conteo de tickets abiertos por cliente
- Confirmación al mover ubicaciones
- Persistencia automática

---

## 🛠️ Tecnologías

### **Frontend**
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.0.1 | Framework React con SSR/SSG |
| React | 19.x | Librería UI |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling utility-first |
| Radix UI | Latest | Componentes accesibles |
| Shadcn/ui | Latest | Componentes pre-diseñados |
| NextAuth.js | Latest | Autenticación |
| Chart.js | Latest | Gráficos |
| Leaflet | Latest | Mapas |
| FullCalendar | 6.1.19 | Calendario |
| Sonner | Latest | Toast notifications |
| React Hook Form | Latest | Formularios |
| Zod | Latest | Validación de schemas |
| TanStack Table | Latest | Tablas avanzadas |
| XLSX | Latest | Exportación Excel |
| jsPDF | Latest | Generación PDF |

### **Backend**
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime |
| Express.js | 4.19.2 | Framework web |
| SQLite3 | 5.1.7 | Base de datos primaria |
| MongoDB | 5.6.0 | Base de datos secundaria |
| bcrypt | 5.1.1 | Encriptación |
| jsonwebtoken | 9.0.2 | JWT tokens |
| express-session | 1.18.0 | Sesiones |
| connect-sqlite3 | 0.9.13 | Store de sesiones |
| Multer | 1.4.5 | Upload de archivos |
| Nodemailer | 6.9.4 | Envío de emails |
| Axios | 1.5.0 | HTTP client |
| UUID | 13.0.0 | Generación de IDs |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 16 (App Router) + React 19 + TypeScript     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  Dashboard │  │  Clientes  │  │  Tickets   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │Presupuestos│  │   Pagos    │  │ Contratos  │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │Repositorio │  │    Mapa    │  │ Calendario │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕ HTTP/REST API                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js 4.19 + Node.js 18+                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │    Auth    │  │    CRUD    │  │Notifications│    │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   Upload   │  │    Sync    │  │   Config   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         DATABASE LAYER (MongoDB-First)               │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           MongoDB (Principal)               │    │   │
│  │  │  - Operativa completa                       │    │   │
│  │  │  - Esquemas validados (JSON Schema)         │    │   │
│  │  │  - Índices optimizados                      │    │   │
│  │  │  - Escalabilidad horizontal                 │    │   │
│  │  │  - Replicación nativa                       │    │   │
│  │  │  - Cloud-ready (Atlas compatible)           │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────┐                                │   │
│  │  │ SQLite (Legacy) │ (Opcional para compatibilidad) │   │
│  │  └─────────────────┘                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Flujo de Datos**
1. **Usuario** → Interactúa con la UI (Next.js)
2. **Frontend** → Hace request a `/api/*` (Express)
3. **Backend** → Procesa y escribe en **MongoDB**
4. **Validación** → MongoDB valida datos contra esquemas JSON Schema
5. **Índices** → Queries optimizadas con índices automáticos
6. **Notificaciones** → Se envían automáticamente por canales configurados
7. **Response** → Vuelve al frontend con los datos

---

## 🚀 Instalación Rápida

### **Prerrequisitos**
- Node.js 18+ ([Descargar](https://nodejs.org/))
- npm o yarn
- **MongoDB 5.6+** ([Descargar](https://www.mongodb.com/try/download/community) o usar [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Git

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/adminflow.git
cd adminflow
```

### **2. Instalar Dependencias**

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd ../client
npm install
```

### **3. Configurar Variables de Entorno**

#### Backend (`server/.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# JWT & Sessions
JWT_SECRET=tu_secret_key_super_seguro_aqui
SESSION_SECRET=otra_secret_key_para_sesiones

# Admin por defecto
DEFAULT_ADMIN_EMAIL=admin@adminflow.uy
DEFAULT_ADMIN_PASSWORD=admin

# MongoDB (REQUERIDO)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=adminflow

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_o_app_password

# Telegram (Opcional)
TELEGRAM_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id

# Twilio/WhatsApp (Opcional)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Slack (Opcional)
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

#### Frontend (`client/.env.local`)
```env
# NextAuth
NEXTAUTH_SECRET=tu_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# API Backend
EXPRESS_BASE_URL=http://localhost:5000
```

```

### **4. Configurar MongoDB**

AdminFlow usa MongoDB como base de datos principal y **se inicializa automáticamente** al arrancar el servidor por primera vez.

#### **Opción A: MongoDB Local**

```bash
# 1. Instalar MongoDB (si no lo tienes)
# Windows: https://www.mongodb.com/try/download/community
# Linux: sudo apt-get install -y mongodb-org
# macOS: brew install mongodb-community

# 2. Iniciar MongoDB
# Windows: El servicio se inicia automáticamente
# Linux/macOS: sudo systemctl start mongod

# 3. Verificar que MongoDB esté ejecutándose
mongosh  # Debería conectar sin errores
```

#### **Opción B: MongoDB Atlas (Cloud - Recomendado para producción)**

```bash
# 1. Crear cuenta gratuita en https://www.mongodb.com/cloud/atlas
# 2. Crear cluster (M0 gratis)
# 3. Configurar usuario y contraseña
# 4. Whitelist IP (0.0.0.0/0 para desarrollo)
# 5. Obtener connection string:
#    mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/adminflow
```

#### **Configurar Connection String**

Edita `server/.selected-db.json` (o se creará automáticamente):

```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://localhost:27017",  // O tu URI de Atlas
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
```

O usa variables de entorno en `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=adminflow
```

### **5. Iniciar la Aplicación**

**¡No necesitas ejecutar scripts de inicialización!** El servidor detecta automáticamente si MongoDB necesita ser inicializado y lo hace en el primer arranque.

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```

**Salida esperada en el primer arranque:**

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
  ✅ Colección creada: budgets
  ✅ Colección creada: contracts
  ✅ Colección creada: payments
  ✅ Colección creada: products
  ✅ Colección creada: client_accesses
  ✅ Colección creada: calendar_events
  ✅ Colección creada: notifications
  ✅ Colección creada: configurations
  ✅ Colección creada: audit_logs
  ✅ Usuario admin creado: admin@adminflow.uy

╔════════════════════════════════════════════════════════╗
║         ✅ AUTO-INICIALIZACIÓN EXITOSA                 ║
╚════════════════════════════════════════════════════════╝

📊 Colecciones creadas: 13
📋 Total de colecciones: 13

🎉 MongoDB está listo para usar!

💡 Credenciales por defecto:
   Email: admin@adminflow.uy
   Password: admin

🗄️  Motor de BD: mongodb

╔════════════════════════════════════════════════════════╗
║              🎉 SERVIDOR INICIADO                      ║
╚════════════════════════════════════════════════════════╝

🌐 Servidor corriendo en: http://localhost:5000
📊 MongoDB: ✅ Conectado
🔐 Credenciales por defecto: admin@adminflow.uy / admin
```

**En arranques posteriores** (MongoDB ya inicializado):

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
✅ MongoDB ya está inicializado

╔════════════════════════════════════════════════════════╗
║              ✅ MONGODB LISTO                          ║
╚════════════════════════════════════════════════════════╝

🗄️  Motor de BD: mongodb

╔════════════════════════════════════════════════════════╗
║              🎉 SERVIDOR INICIADO                      ║
╚════════════════════════════════════════════════════════╝

🌐 Servidor corriendo en: http://localhost:5000
📊 MongoDB: ✅ Conectado
🔐 Credenciales por defecto: admin@adminflow.uy / admin
```

El servidor estará en `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```
La aplicación estará en `http://localhost:3000`

### **6. Acceder al Sistema**
1. Abrir navegador en `http://localhost:3000`
2. Login con credenciales por defecto:
   - **Email**: `admin@adminflow.uy`
   - **Password**: `admin`

### **7. Verificar Instalación**

Una vez dentro del sistema:
1. Ve a `/database` para ver el estado de MongoDB
2. Verifica que aparezcan las 13+ colecciones
3. Crea un cliente de prueba
4. Crea un ticket de prueba

---

## 🔄 Migración de Datos (Opcional)

Si tienes datos existentes en SQLite que quieres migrar:

```bash
cd server
npm run migrate-to-mongo
```

Este script copiará todos los datos de SQLite a MongoDB preservando:
- ✅ Relaciones entre tablas
- ✅ IDs autoincrementales
- ✅ Fechas y timestamps
- ✅ Datos JSON (convertidos a objetos nativos)


### **5. Iniciar la Aplicación**

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```
El servidor estará en `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```
La aplicación estará en `http://localhost:3000`

### **6. Acceder al Sistema**
1. Abrir navegador en `http://localhost:3000`
2. Login con credenciales por defecto:
   - **Email**: `admin@adminflow.uy`
   - **Password**: `admin`

### **7. Verificar Instalación**

Una vez dentro del sistema:
1. Ve a `/database` para ver el estado de MongoDB
2. Verifica que aparezcan las 13+ colecciones
3. Crea un cliente de prueba
4. Crea un ticket de prueba

---

## 🔧 Troubleshooting de MongoDB

### **Error: "MongoServerError: Authentication failed"**

**Causa:** Usuario o contraseña incorrectos en la URI.

**Solución:**
```bash
# Verifica la URI en .selected-db.json
# Formato correcto:
mongodb://usuario:password@host:puerto/database
```

### **Error: "MongoNetworkError: connect ECONNREFUSED"**

**Causa:** MongoDB no está ejecutándose.

**Solución:**
```bash
# Linux/macOS
sudo systemctl status mongod
sudo systemctl start mongod

# Windows
# Verifica en Servicios que "MongoDB Server" esté ejecutándose
```

### **Error: "No se pudo leer .selected-db.json"**

**Causa:** Archivo de configuración no existe.

**Solución:**
```bash
# El script init-mongo lo crea automáticamente
# O créalo manualmente en server/.selected-db.json
```

### **Queries muy lentas**

**Causa:** Falta de índices o colección muy grande.

**Solución:**
```bash
# Verifica índices en MongoDB Compass o:
mongosh
use adminflow
db.tickets.getIndexes()  # Ver índices existentes
```

### **Base de datos vacía después de reiniciar**

**Causa:** MongoDB no está persistiendo datos.

**Solución:**
```bash
# Verifica la ruta de datos de MongoDB
# Linux/macOS: /var/lib/mongodb
# Windows: C:\Program Files\MongoDB\Server\5.6\data
```

---

## 📚 Scripts de Base de Datos Disponibles

```bash
# Inicializar MongoDB (crear estructura)
npm run init-mongo
npm run db:init  # Alias

# Migrar datos de SQLite a MongoDB
npm run migrate-to-mongo
npm run db:migrate  # Alias

# Verificar estado de la base de datos
# (Desde la UI: /database)
```

---

## 🗄️ Estructura de MongoDB

### **Colecciones Principales**

| Colección | Documentos Típicos | Índices |
|-----------|-------------------|---------|
| `users` | 10-100 | email (unique) |
| `clients` | 100-10,000 | email, name, contract |
| `tickets` | 1,000-100,000 | clientId, status, priority |
| `budgets` | 100-10,000 | clientId, status |
| `contracts` | 50-5,000 | clientId, status, dates |
| `payments` | 500-50,000 | clientId, ticketId, status |
| `products` | 50-1,000 | name, category |
| `client_accesses` | 200-20,000 | clientId, tipo_equipo |
| `calendar_events` | 500-50,000 | start, sourceType |
| `notifications` | 1,000-100,000 | event, createdAt |
| `configurations` | 10-50 | module (unique) |
| `audit_logs` | 10,000-1M | user, action, createdAt |

### **Ventajas de MongoDB**

- 🚀 **Escalabilidad** - Fácil de escalar horizontalmente con sharding
- 📊 **Consultas avanzadas** - Agregaciones potentes para reportes
- 🔄 **Replicación** - Alta disponibilidad nativa
- ☁️ **Cloud-ready** - Compatible con MongoDB Atlas
- 🔍 **Índices** - Búsquedas ultra-rápidas
- 📝 **Esquemas flexibles** - Adaptable a cambios
- ✅ **Validación** - JSON Schema automático

### **Documentación Completa**

Para más detalles sobre MongoDB, consulta:
- 📖 [`db.md`](./db.md) - Arquitectura de base de datos
- 📚 [`server/database/README_MONGODB.md`](./server/database/README_MONGODB.md) - Guía completa de MongoDB
- 🌐 [MongoDB Documentation](https://docs.mongodb.com/) - Documentación oficial

---

## ⚙️ Configuración

### **Base de Datos**

AdminFlow usa **MongoDB como base de datos principal**. La configuración se gestiona en `server/.selected-db.json`:

```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://localhost:27017",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
```

#### **Opciones de Conexión**

**MongoDB Local:**
```json
{
  "mongoUri": "mongodb://localhost:27017"
}
```

**MongoDB con Autenticación:**
```json
{
  "mongoUri": "mongodb://usuario:password@localhost:27017/adminflow?authSource=admin"
}
```

**MongoDB Atlas (Cloud):**
```json
{
  "mongoUri": "mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/adminflow?retryWrites=true&w=majority"
}
```

#### **Inicializar Base de Datos**
```bash
cd server
npm run init-mongo  # Crea colecciones, índices y datos iniciales
```

#### **Migrar desde SQLite (Opcional)**
Si tienes datos existentes en SQLite:
```bash
npm run migrate-to-mongo  # Migra todos los datos a MongoDB
```

#### **Verificar Estado**
Desde la UI: `/database` → Ver colecciones y estadísticas

### **Notificaciones**

Configurar canales desde la UI: `/system` → Canales

O editar directamente en MongoDB:
```javascript
db.configurations.updateOne(
  { module: "notifications" },
  { $set: { 
    "data.channels.email.enabled": true,
    "data.channels.email.apiKey": "smtp.gmail.com"
  }}
)
```

---

## 📦 Módulos del Sistema

### **1. Dashboard** (`/dashboard`)
- KPIs: Total clientes, tickets abiertos, ingresos del mes
- Gráficos de tendencia (Chart.js)
- Mapa con clientes geolocalizados
- Exportación de datos
- Widgets personalizables

### **2. Clientes** (`/clients`)
- Tabla con búsqueda tolerante
- Paginación y filtros
- Importación masiva (CSV/Excel)
- Exportación (Excel/PDF)
- Creación rápida de tickets
- Ficha detallada por cliente con:
  - Datos de contacto editables
  - Contrato vigente con badge
  - Últimos 2 pagos
  - Accesos y recursos
  - Mapa de ubicación

### **3. Tickets** (`/tickets`)
- Estados: Nuevo, En Progreso, Resuelto, Cerrado
- Prioridades: Baja, Media, Alta, Urgente
- Adjuntos y grabaciones de audio
- Editor rico de texto
- Bloqueo automático de resueltos
- Historial de cambios
- Vinculación con pagos
- Exportación

### **4. Presupuestos** (`/budgets`)
- Generación de PDF profesional
- Portada personalizable
- Catálogo de productos
- Secciones editables
- Compartir por email/WhatsApp
- Estados y tracking
- Multi-moneda (UYU/USD)
- Items expandibles

### **5. Pagos** (`/payments`)
- IDs únicos (`PAY-XXXXXX`)
- Estados configurables
- Métodos de pago
- Vinculación con tickets
- Sugerencias automáticas
- Exportación
- Notificaciones automáticas

### **6. Contratos** (`/contracts`)
- SLA tracking
- Tipos y recurrencia
- Upload de firmados
- Deberes y responsabilidades
- Alertas de vencimiento
- Eventos en calendario
- Importación masiva

### **7. Repositorio** (`/repository`)
- Grid de categorías
- Editor modal
- Carga de archivos
- Markdown support
- Filtros avanzados

### **8. Accesos** (`/clients/:id/repository/access`)
- Gestión de credenciales
- Tipos de equipos
- IPs, usuarios, contraseñas
- Serie/MAC
- Iconografía automática
- Búsqueda y filtros
- Exportación segura

### **9. Mapa** (`/map`)
- Leaflet interactivo
- Geocodificación
- Tickets por cliente
- Drag & drop de marcadores
- Persistencia automática

### **10. Calendario** (`/calendar`)
- FullCalendar
- Drag & drop
- Eventos automáticos
- Eventos bloqueados
- Vistas múltiples

### **11. Notificaciones** (`/notifications`)
- Configuración de eventos
- Canales multi-plataforma
- Plantillas personalizables
- Historial completo
- Pruebas de canal

### **12. Base de Datos** (`/database`)
- Cambio de motor
- Verificación de conexiones
- Sincronización
- Reset
- Migración
- Overview de tablas

### **13. Sistema** (`/system`)
- Gestión de usuarios
- Configuración de canales
- Plantillas de mensajes
- Historial de eventos
- Pruebas de canal
- Auditoría

---

## 📁 Estructura del Proyecto

```
adminflow/
├── client/                      # Frontend Next.js
│   ├── app/                     # App Router (Next.js 16)
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── clients/             # Gestión de clientes
│   │   │   └── [id]/            # Detalle de cliente
│   │   │       └── repository/
│   │   │           └── access/  # Módulo de accesos
│   │   ├── tickets/             # Sistema de tickets
│   │   ├── budgets/             # Presupuestos
│   │   ├── payments/            # Pagos
│   │   ├── contracts/           # Contratos
│   │   ├── products/            # Catálogo
│   │   ├── repository/          # Repositorio
│   │   ├── map/                 # Mapa
│   │   ├── calendar/            # Calendario
│   │   ├── notifications/       # Notificaciones
│   │   ├── database/            # Gestión BD
│   │   ├── system/              # Sistema
│   │   ├── login/               # Login
│   │   ├── api/                 # API Routes
│   │   │   └── auth/            # NextAuth
│   │   ├── layout.tsx           # Layout global
│   │   ├── page.tsx             # Redirect a login
│   │   └── providers.tsx        # SessionProvider
│   ├── components/              # Componentes React
│   │   ├── auth/                # Login form
│   │   ├── layout/              # Layout components
│   │   ├── clients/             # Componentes de clientes
│   │   ├── tickets/             # Componentes de tickets
│   │   ├── budgets/             # Componentes de presupuestos
│   │   ├── contracts/           # Componentes de contratos
│   │   ├── repository/          # Componentes de repositorio
│   │   ├── dashboard/           # Widgets dashboard
│   │   ├── database/            # Componentes BD
│   │   └── ui/                  # Componentes base (Shadcn)
│   ├── lib/                     # Utilidades y APIs
│   │   ├── api-*.ts             # Servicios API
│   │   ├── http.ts              # HTTP client
│   │   ├── config.ts            # Configuración
│   │   ├── utils.ts             # Helpers
│   │   └── leaflet-icon.ts      # Leaflet config
│   ├── types/                   # TypeScript types
│   ├── public/                  # Assets estáticos
│   ├── pages/                   # Error pages
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.ts
│
├── server/                      # Backend Express
│   ├── database/                # SQLite database
│   │   └── database.sqlite
│   ├── lib/                     # Servicios backend
│   │   ├── dbChoice.js          # Selector de BD
│   │   ├── dbConfigDefaults.js  # Defaults
│   │   ├── db-adapter.js        # Adapter
│   │   ├── mongoClient.js       # Cliente Mongo
│   │   ├── mongo-sync.js        # Sincronización
│   │   ├── sqliteSync.js        # Sync events
│   │   ├── configService.js     # Configuraciones
│   │   ├── userService.js       # Usuarios
│   │   └── notificationService.js # Notificaciones
│   ├── scripts/                 # Scripts CLI
│   │   └── migrate-sqlite-to-mongo.js
│   ├── uploads/                 # Archivos subidos
│   │   ├── contracts/
│   │   └── budgets/
│   ├── index.js                 # Servidor principal
│   ├── db.js                    # Inicialización BD
│   ├── package.json
│   └── .selected-db.json        # Config BD activa
│
├── Apis.md                      # Documentación API
├── db.md                        # Documentación BD
├── README.md                    # Este archivo
└── .gitignore
```

---

## 📚 API Reference

La documentación completa de la API está en [`Apis.md`](./Apis.md).

### **Base URL**
```
http://localhost:5000
```

### **Autenticación**
```http
POST /login
Content-Type: application/json

{
  "email": "admin@adminflow.uy",
  "password": "admin"
}

Response:
{
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Endpoints Principales**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/clients` | Listar clientes |
| `POST` | `/api/clients` | Crear cliente |
| `GET` | `/api/clients/:id` | Obtener cliente |
| `PUT` | `/api/clients/:id` | Actualizar cliente |
| `DELETE` | `/api/clients/:id` | Eliminar cliente |
| `GET` | `/api/clients/:id/access` | Listar accesos |
| `POST` | `/api/clients/:id/access` | Crear acceso |
| `GET` | `/api/tickets` | Listar tickets |
| `POST` | `/api/tickets` | Crear ticket |
| `GET` | `/api/budgets` | Listar presupuestos |
| `POST` | `/api/budgets` | Crear presupuesto |
| `GET` | `/api/payments` | Listar pagos |
| `POST` | `/api/payments` | Crear pago |
| `GET` | `/api/contracts` | Listar contratos |
| `POST` | `/api/contracts` | Crear contrato |
| `GET` | `/api/products` | Listar productos |
| `POST` | `/api/products` | Crear producto |
| `GET` | `/api/calendar-events` | Listar eventos |
| `POST` | `/api/calendar-events` | Crear evento |
| `POST` | `/api/notifications/send` | Enviar notificación |
| `GET` | `/api/notifications/history` | Historial |

Ver [`Apis.md`](./Apis.md) para detalles completos de cada endpoint.

---

## 🗄️ Base de Datos

La documentación completa de la base de datos está en [`db.md`](./db.md).

### **Arquitectura Híbrida**

**SQLite** (Primaria - Operativa)
- Ubicación: `server/database/database.sqlite`
- Función: Operaciones CRUD rápidas
- Tablas: 15 tablas principales

**MongoDB** (Secundaria - Sync)
- Ubicación: Configurada en `.selected-db.json`
- Función: Respaldo, analytics, escalabilidad
- Colecciones: Espejo de SQLite + colecciones nativas

### **Tablas Principales**

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `users` | Usuarios del sistema | `id`, `email`, `password` |
| `clients` | Clientes | `id`, `name`, `email`, `contract`, `latitude`, `longitude` |
| `tickets` | Incidencias | `id`, `client_id`, `title`, `status`, `priority`, `attachments` |
| `budgets` | Presupuestos | `id`, `client_id`, `title`, `amount`, `status`, `sections` |
| `payments` | Pagos | `id`, `invoice`, `amount`, `status`, `method` |
| `contracts` | Contratos | `id`, `client_id`, `title`, `sla`, `status`, `file_path` |
| `products` | Catálogo | `id`, `name`, `price_uyu`, `price_usd`, `category` |
| `repository` | Repositorio | `id`, `client_id`, `name`, `type`, `content` |
| `calendar_events` | Eventos | `id`, `title`, `start`, `end`, `source_type`, `locked` |
| `sync_events` | Cola de sync | `id`, `collection`, `payload` |
| `audit_logs` | Auditoría | `id`, `user`, `action`, `resource`, `details` |

### **Colecciones MongoDB Nativas**

| Colección | Descripción |
|-----------|-------------|
| `client_accesses` | Credenciales y accesos por cliente |
| `configurations` | Configuraciones modulares |
| `notifications` | Historial de notificaciones |

---

## 💻 Desarrollo

### **Scripts Disponibles**

#### Frontend
```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

#### Backend
```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
```

### **Estructura de Componentes**

Los componentes siguen la estructura de Shadcn/ui:

```tsx
// client/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        destructive: "bg-destructive text-destructive-foreground...",
        // ...
      },
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button, buttonVariants }
```

### **Agregar Nuevo Módulo**

1. **Crear ruta en frontend**:
```bash
mkdir -p client/app/mi-modulo
touch client/app/mi-modulo/page.tsx
```

2. **Crear servicio API**:
```bash
touch client/lib/api-mi-modulo.ts
```

3. **Crear endpoints en backend**:
```javascript
// server/index.js
app.get('/api/mi-modulo', (req, res) => {
  // Lógica
});
```

4. **Agregar al sidebar**:
```tsx
// client/components/layout/sidebar.tsx
const menuItems = [
  // ...
  {
    label: "Mi Módulo",
    href: "/mi-modulo",
    icon: <Icon className="h-4 w-4" />
  }
];
```

---

## 🚢 Deployment

### **Opción 1: Vercel (Frontend) + Railway (Backend)**

#### Frontend en Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel
```

#### Backend en Railway
1. Crear cuenta en [Railway](https://railway.app/)
2. Conectar repositorio
3. Configurar variables de entorno
4. Deploy automático

### **Opción 2: Docker**

```dockerfile
# Dockerfile para backend
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
EXPOSE 5000
CMD ["node", "index.js"]
```

```dockerfile
# Dockerfile para frontend
FROM node:18-alpine
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
    depends_on:
      - mongo
  
  frontend:
    build: ./client
    ports:
      - "3000:3000"
    environment:
      - EXPRESS_BASE_URL=http://backend:5000
    depends_on:
      - backend
  
  mongo:
    image: mongo:5.6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### **Opción 3: VPS (Ubuntu)**

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Clonar repo
git clone https://github.com/tu-usuario/adminflow.git
cd adminflow

# Backend
cd server
npm install
pm2 start index.js --name adminflow-backend

# Frontend
cd ../client
npm install
npm run build
pm2 start npm --name adminflow-frontend -- start

# Guardar configuración PM2
pm2 save
pm2 startup
```

---

## 📝 Changelog

### **2025-11-23: Corrección de Portadas en Presupuestos**
- **Fix**: Error al cargar portadas de PDF desde PC remota
- Implementado manejo inteligente de portadas (default vs custom)
- Fallback automático a portada por defecto si falla descarga
- Mejor manejo de errores con mensajes informativos

### **2025-11-22: Módulo de Accesos y Mejoras UI**
- **Nuevo**: Módulo completo de gestión de accesos (`/clients/:id/repository/access`)
- Tipos de equipos: Router, Switch, Servidor, Firewall, Cámara, etc.
- Iconografía automática según tipo
- Búsqueda y filtros integrados
- Exportación a Excel
- Botones con iconografía y colores en header
- Breadcrumb muestra alias del cliente en lugar de ID

### **2025-11-21: Presupuestos Expandibles**
- Tabla de presupuestos con filas expandibles
- Carga de items on-demand
- Badges de moneda con banderas
- Sincronización automática de cantidades y precios

### **2025-11-21: Sidebar con Menú de Ayuda**
- Dropdown de ayuda en sidebar
- Datos del usuario logueado
- Accesos a documentación y soporte
- Estado del sistema

### **2025-11-20: Contratos Mejorados**
- Reordenamiento de columnas (ID primero)
- Estados con emoji y color
- SLA y tipo como badges
- Moneda con banderas
- Campo "Deberes y Responsabilidades"
- Modal de upload ampliado

### **2025-11-18: Sistema de Notificaciones Automáticas**
- Notificaciones automáticas para eventos importantes
- Configuración basada en MongoDB
- Soporte multi-canal (Email, Telegram, WhatsApp, Slack)
- Plantillas personalizables
- Historial completo

### **2025-11-18: Rediseño del Módulo Sistema**
- UI moderna con diseño de tarjetas
- Integración completa con backend
- Persistencia real en MongoDB
- Gestión de usuarios
- Configuración de canales
- Plantillas de mensajes

---

## 🤝 Contribución

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### **Guías de Estilo**
- TypeScript para todo el código nuevo
- Componentes funcionales con hooks
- Tailwind CSS para estilos
- Comentarios en español
- Tests unitarios para lógica crítica

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Autores

- **Flavio González** - *Desarrollo Inicial* - [GitHub](https://github.com/flavioGonz)

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el framework increíble
- [Shadcn/ui](https://ui.shadcn.com/) por los componentes hermosos
- [Radix UI](https://www.radix-ui.com/) por los primitivos accesibles
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño
- [Vercel](https://vercel.com/) por el hosting
- La comunidad open source

---

## 📞 Soporte

¿Necesitas ayuda? Contáctanos:

- 📧 Email: admin@adminflow.uy
- 🐛 Issues: [GitHub Issues](https://github.com/flavioGonz/adminflow/issues)
- 📖 Docs: [Documentación](./Apis.md)

---

<div align="center">

**Hecho con ❤️ en Uruguay**

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

</div>
