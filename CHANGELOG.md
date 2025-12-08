# 📝 Changelog de AdminFlow

Registro de cambios y mejoras implementadas en el sistema.

---

## [2.1.0] - 2025-12-01

### 🗄️ **Gestión Avanzada de Base de Datos**

#### ✨ Nuevas Características
- **Página de Database Rediseñada** (`/database`):
  - Panel de información en tiempo real con estado de conexión
  - Medición de latencia de conexión
  - Estadísticas generales (colecciones, documentos, tamaño total)
  
- **Visor de Documentos**:
  - Modal interactivo para explorar documentos de cualquier colección
  - Dos modos de vista: Tabla y JSON
  - Paginación (10 documentos por página)
  - Panel lateral con detalles completos del documento seleccionado
  - Copiar JSON al portapapeles
  - Renderizado inteligente de tipos de datos (objetos, arrays, booleanos, null)

- **Sistema de Respaldos Mejorado**:
  - Respaldo selectivo: solo respalda la base de datos de la aplicación
  - Modal de importación paso a paso con 4 etapas
  - Análisis previo del contenido del respaldo
  - Gráfico comparativo (Recharts) entre datos actuales y respaldo
  - Confirmación explícita con checkbox antes de restaurar
  - Descarga de respaldos como `.tar.gz`
  - Eliminación de respaldos con confirmación

- **Explorador de Colecciones**:
  - Búsqueda en tiempo real por nombre de colección
  - Información detallada: nombre, cantidad de documentos, tamaño
  - Acciones por colección: Ver, Exportar, Eliminar
  - Exportación a JSON
  - Eliminación con confirmación

#### 🔧 Mejoras Técnicas
- Nuevo endpoint: `GET /api/database/collections/:collection/documents` con paginación
- Uso de `execFile` en lugar de `exec` para mayor seguridad en Windows
- Parámetro `--db` en `mongodump` para respaldo selectivo
- Manejo mejorado de errores en operaciones de respaldo
- Auto-refresh cada 30 segundos en la página de database

#### 📚 Documentación
- Nuevo archivo: `DATABASE_PAGE.md` con guía completa de la página
- Nuevo archivo: `INSTALL_GUIDE.md` para instalación en nuevo PC
- Actualización de `Apis.md` con endpoints de gestión de database
- Actualización de `README.md` con features de database
- `.gitignore` actualizado para excluir respaldos y archivos temporales

---

## [2.0.0] - 2025-11-30

### 🔄 **Migración a MongoDB**

#### ✨ Características Principales
- MongoDB como base de datos principal
- Auto-inicialización de colecciones y esquemas
- Validación de datos con JSON Schema
- Índices optimizados para queries frecuentes
- Soporte para MongoDB Atlas (Cloud)

#### 🛠️ Scripts de Migración
- `npm run init-mongo`: Inicializar MongoDB
- `npm run migrate-to-mongo`: Migrar datos desde SQLite
- Auto-creación de usuario admin en primer arranque

#### 📊 Colecciones Implementadas
- users, clients, tickets, budgets, contracts
- payments, products, client_accesses
- calendar_events, notifications
- configurations, audit_logs

---

## [1.5.0] - 2025-11-27

### 👤 **Sistema de Avatares**

#### ✨ Nuevas Características
- Upload de avatares para usuarios
- Visualización en tabla de usuarios
- Visualización en modal de edición
- Visualización en tabla de tickets (columna "Asignado a")
- Almacenamiento en `server/uploads/users/`

#### 🔧 API
- `POST /api/users/:id/avatar`: Upload de avatar
- Soporte para imágenes (jpg, png, gif, webp)
- Tamaño máximo: 5MB

---

## [1.4.0] - 2025-11-26

### 🎫 **Mejoras en Tickets**

#### ✨ Nuevas Características
- Asignación de tickets a usuarios del sistema
- Campo "Asignado a" con búsqueda de usuarios
- Visualización de avatar del usuario asignado
- Filtros mejorados en tabla de tickets

#### 🔧 Mejoras
- Carga optimizada de usuarios
- Manejo de errores mejorado
- Timeline de tickets con eventos de asignación

---

## [1.3.0] - 2025-11-25

### 🔔 **Sistema de Notificaciones Automáticas**

#### ✨ Nuevas Características
- Notificaciones multi-canal (Email, Telegram, WhatsApp, Slack)
- Eventos automáticos para:
  - Tickets (creado, actualizado, cerrado)
  - Presupuestos (creado, aprobado, rechazado)
  - Pagos (recibido)
  - Contratos (firmado)
  - Calendario (evento creado)
- Configuración granular por evento
- Plantillas personalizables con variables
- Historial completo de notificaciones

#### 🔧 API
- `POST /api/notifications/send`: Enviar notificación manual
- `GET /api/notifications/history`: Historial de notificaciones
- `POST /api/notifications/verify-smtp`: Verificar configuración SMTP
- `POST /api/config/notifications`: Guardar configuración

---

## [1.2.0] - 2025-11-24

### 🎨 **Instalador Web**

#### ✨ Nuevas Características
- Wizard interactivo de instalación
- 4 pasos: Empresa, Base de Datos, Notificaciones, Finalización
- Selección de motor de BD (MongoDB/SQLite)
- Prueba de conexión antes de guardar
- Configuración de canales de notificación
- Animaciones con Framer Motion

#### 🔧 Seguridad
- Archivo `.installed` para bloquear reinstalación
- Middleware de protección de rutas
- Validación de datos en cada paso

---

## [1.1.0] - 2025-11-22

### 📊 **Dashboard y Widgets**

#### ✨ Nuevas Características
- KPIs en tiempo real
- Gráficos interactivos (Chart.js)
- Mapa de clientes con Leaflet
- Widgets personalizables
- Exportación a Excel/PDF

#### 🔧 Mejoras
- Auto-refresh de datos
- Responsive design
- Optimización de queries

---

## [1.0.0] - 2025-11-20

### 🚀 **Lanzamiento Inicial**

#### ✨ Módulos Implementados
- Gestión de Clientes
- Sistema de Tickets
- Presupuestos
- Contratos
- Pagos
- Productos
- Repositorio Técnico
- Calendario
- Mapa

#### 🔐 Seguridad
- Autenticación con JWT
- Sesiones con express-session
- Encriptación de contraseñas (bcrypt)
- Protección CORS

#### 🎨 UI/UX
- Diseño moderno con Tailwind CSS
- Componentes Shadcn/ui
- Dark mode ready
- Mobile-first

---

## Próximas Mejoras

### 🔮 En Desarrollo
- [ ] Respaldos programados (cron)
- [ ] Edición inline de documentos
- [ ] Búsqueda avanzada en documentos
- [ ] Comparación de esquemas
- [ ] Exportación a CSV/Excel desde database
- [ ] Historial de cambios en documentos
- [ ] Restauración selectiva de colecciones

### 💡 Planificado
- [ ] Soporte para PostgreSQL
- [ ] Soporte para MySQL
- [ ] Dashboard personalizable
- [ ] Reportes avanzados
- [ ] API pública con rate limiting
- [ ] Integración con servicios externos
- [ ] App móvil (React Native)

---

**Última actualización**: 2025-12-01
