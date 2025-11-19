# AdminFlow

## Resumen
AdminFlow es un cockpit administrativo completo que combina un frontend Next.js 16 (React 19 + Tailwind CSS 4) con un backend Express 4.19 que puede ejecutar sobre MongoDB como motor principal y mantener una réplica local en SQLite. Cada módulo cubre un paso del ciclo comercial: registrar clientes, resolver tickets, crear presupuestos exportables, cargar productos y contratos, gestionar pagos reales y mantener un repositorio seguro de archivos y credenciales por cliente.

El backend (`server/`) expone una API RESTful y sincroniza eventos clave mediante `sync_events` para ofrecer reporting y replicaciones seguras. El frontend (`client/`) consume `http://localhost:5000/api/*`, utiliza NextAuth con un proveedor de credenciales (`client/app/api/auth/[...nextauth]/route.ts`) y agrupa el workflow dentro de `DashboardLayout`, sidebar y componentes reutilizables.

## Módulos principales
1. **Dashboard** (`client/app/dashboard/page.tsx`): KPI cards, gráficos de tendencia con Chart.js, exportación de datos y un mapa embebido con Leaflet que reutiliza los mismos marcadores verdes/naranjas que el módulo de mapa completo.
2. **Clientes** (`client/app/clients/page.tsx` + `client/components/clients/*`): `ClientTable` (búsqueda tolerante, paginación, exportación a Excel/PDF, filtros por contrato), modales `Create/Edit/Delete`, importación en lote y creación directa de tickets (`create-ticket-dialog.tsx`).
3. **Tickets** (`client/app/tickets/page.tsx`, `client/app/tickets/[id]/page.tsx`, `client/app/tickets/new/page.tsx`, `client/components/clients/ticket-table.tsx`, `client/components/tickets/kyban-editor.tsx`): listado enriquecido con filtros, exportes y fallback cuando la API falla; detalle del ticket con bloqueo, adjuntos, grabaciones de audio y editor rico (`rich-text-editor.tsx`), y creación rápida usando `EditTicketDialog`.
4. **Presupuestos** (`client/app/budgets/page.tsx` + `client/components/budgets/*`): métricas, buscador, generadores de PDF/Excel, tabla principal con `BudgetTable`, `Create/Edit/Delete Budget` y secciones/items (`budget-items-table.tsx`). También soporta subir portada (`budget-pdf-preview.tsx`) y compartir archivos (`share`).
5. **Pagos** (`client/app/payments/page.tsx`, `client/lib/api-payments.ts`): tabla con filtros de estado, modal administrado (`PaymentDialog`) que ofrece sugerencias por cliente/ticket, exportes Excel/PDF y llamadas a la API para crear/editar/eliminar registros (`PAY-XXXXXX`).
6. **Productos** (`client/app/products/page.tsx`, `client/lib/api-products.ts`): CRUD con badges, doble pricing (UYU/USD), cargas de imágenes base64, filtros y estadísticas por categoría.
7. **Contratos** (`client/app/contracts/page.tsx`, `client/components/contracts/*`, `client/lib/api-contracts.ts`): métricas de estado/vencimiento, importación, generación de PDFs con `pdf-viewer-modal.tsx`, subida de archivos `multer` y auditoría de estados.
8. **Repositorio** (`client/app/repository/page.tsx`, `client/lib/api-repository.ts`): grid de tarjetas por categoría, editor modal con carga de archivos/Markdown, notas enriquecidas y filtros.
9. **Mapa** (`client/app/map/page.tsx`, `client/lib/leaflet-icon.ts`): Leaflet server-side safe, geocodificación con Nominatim, conteo de tickets abiertos por marcador, confirmación al mover ubicaciones y persistencia `PUT /api/clients/:id`.
10. **Calendario** (`client/app/calendar/page.tsx` + `FullCalendar`): agenda interactiva, creación/edición con modal, arrastrar eventos y sincronización con `GET/POST/PUT /api/calendar-events`.
11. **Notificaciones** (`client/app/notifications/page.tsx`): **[SISTEMA AUTOMÁTICO - 2025-11-18]** Panel de configuración multi-canal (Email, WhatsApp, Telegram, Slack) con:
   - **Configuración por Evento**: Define qué canales usar para cada tipo de evento (tickets, presupuestos, pagos, contratos, calendario)
   - **Notificaciones Automáticas**: El servidor envía notificaciones automáticamente cuando ocurren eventos importantes:
     - Tickets: creación, actualización, cierre
     - Presupuestos: creación, aprobación, rechazo
     - Pagos: confirmación de pago
     - Contratos: firma de contrato
     - Calendario: creación de eventos
   - **Botones de Test**: Prueba cada canal individualmente con mensajes personalizados
   - **Historial**: Visualización de todas las notificaciones enviadas
   - **Persistencia**: Configuración guardada en MongoDB (`configurations.notifications`)
12. **Base de datos** (`client/app/database/page.tsx`, `client/lib/api-database.ts`): panel para cambiar de motor, verificar conexiones, sincronizar/resetear, migrar a Mongo y visualizar conteos de tablas/colecciones.
13. **Sistema** (`client/app/system/page.tsx`, `client/lib/api-system.ts`): **[REDISEÑADO - 2025-11-18]** Panel de control centralizado completamente funcional con persistencia real en base de datos. Incluye:
   - **Gestión de Usuarios**: Visualización y edición de usuarios registrados (roles, metadata) conectado a `/api/users/registered`. Los cambios persisten en MongoDB.
   - **Configuración de Canales**: Administración de 4 canales de notificación (Email, WhatsApp, Telegram, Slack) con switches de activación, API Keys y Webhooks. Configuración guardada en `/api/config/notifications`.
   - **Plantillas de Mensajes**: Editor de plantillas personalizables por canal con soporte de variables dinámicas (`{{cliente}}`, `{{ticket}}`). Persistidas en la misma configuración de notificaciones.
   - **Historial de Eventos**: Visualización en tiempo real de notificaciones enviadas desde `/api/notifications/history`.
   - **Pruebas de Canal**: Botón para enviar notificaciones de prueba a cada canal configurado.
   - **Componentes UI**: Utiliza `Switch` de Radix UI (`@radix-ui/react-switch`) y componentes Shadcn UI para una interfaz moderna y responsive.
   - **Backup**: El archivo original se respaldó como `page.tsx.bak` para permitir reversión.
14. **Login y autenticación** (`client/app/login/page.tsx`, `client/components/auth/login-form.tsx`, `client/app/api/auth/[...nextauth]/route.ts`): formulario protegido, NextAuth con token JWT, sesión `SessionProvider` (`client/app/providers.tsx`) y redirect automático desde `/` (`client/app/page.tsx`). Los errores personalizados viven en `client/pages/_error.tsx`, `client/pages/404.tsx` y `_document.tsx` define `lang="es"`.

## Arquitectura y persistencia
- **Frontend (`client/`)**: Next.js 16 con `app/` router, layout global (`client/app/layout.tsx`), transiciones (`components/ui/page-transition.tsx`) y múltiples componenciales `Radix UI` + Tailwind 4. El `API_BASE_URL` está en `client/lib/config.ts` y `client/lib/http.ts` normaliza cada llamada.
- **Backend (`server/`)**: Express + SQLite/Mongo (decisión en `.selected-db.json` / `DB_ENGINE`) con sesiones (`express-session` + `connect-sqlite3`), JWT (`jsonwebtoken`) y `multer` para uploads en `server/uploads/contracts` y `server/uploads/budgets`. `server/db.js` crea tablas, columnas adicionales y semilla `admin@adminflow.uy`/`admin`.
- **Sincronización**: `server/lib/mongo-sync.js` replica tablas SQLite en Mongo, `server/lib/sqliteSync.js` registra `sync_events`, `server/lib/userService.js` rastrea usuarios registrados, `server/lib/notificationService.js` dispara email/Telegram/WhatsApp/Slack cuando hay canales configurados.

## Flujo de desarrollo
### Backend
```bash
cd server
npm install
npm run dev # arranca nodemon sobre index.js
```
- Usa `.selected-db.json` y `server/lib/dbConfigDefaults.js` para persistir `engine`, `mongoUri`, `mongoDb`, `sqlitePath`.
- Expone `GET /`, autenticación (`/register`, `/login`, `/logout`, `/profile`), configuraciones, operaciones sobre clientes, contratos, presupuestos, productos, pagos, repositorio, tickets y calendario.

### Frontend
```bash
cd client
npm install
npm run dev
```
- Next.js corre en `http://localhost:3000`. La sesión se guarda en NextAuth y el `Sidebar` (`client/components/layout/sidebar.tsx`) redirige a `/login` si no hay `session`.
- Los componentes reutilizables están en `client/components/ui/` y el layout general incluye `DashboardLayout`, `header-bar`, `ticket-table`, modales y tablas.

### Variables de entorno
- Backend: `PORT`, `JWT_SECRET`, `SESSION_SECRET`, `DEFAULT_ADMIN_EMAIL/PASSWORD`, `MONGODB_URI`, `MONGODB_DB`, `EMAIL_*`, `TWILIO_*`, `TELEGRAM_*`, `SLACK_WEBHOOK`.
- Frontend: `NEXTAUTH_SECRET`, `EXPRESS_BASE_URL` (apunta a `http://localhost:5000`).

## Frontend (`client/`)
### App Router y layouts
- `client/app/layout.tsx` importa fuentes de Google, envuelve `Providers` y `PageTransition`, y carga `Toaster` (Sonner).
- `client/app/providers.tsx` usa `SessionProvider` de NextAuth.
- `client/app/page.tsx` redirige a `/login` para cualquier acceso no autenticado.
- Cada módulo (`clients`, `contracts`, `budgets`, `tickets`, `payments`, `repository`, `map`, `calendar`, `notifications`, `database`, `system`) envuelve su contenido con `DashboardLayout` y define su propio `page.tsx` (y de ser necesario `layout.tsx`).

### Componentes
- `client/components/auth/login-form.tsx`: formulario estilizado con `Card`, validaciones y toast de errores.
- `client/components/layout/`: `dashboard-layout.tsx` (guardado de sesión), `sidebar.tsx` (navegación, logout, toggles), `header-bar.tsx`, `ticket-table.tsx`, modales de ticket (`create/delete`), y `page.tsx` heredado para escuchar cambios en la tabla.
- `client/components/clients/`: `client-table.tsx`, `import-clients-dialog.tsx`, `create-client-dialog.tsx`, `edit-client-dialog.tsx`, `delete-client-dialog.tsx`, `ticket-table.tsx`, y modales para tickets (`create-ticket-dialog.tsx`, `edit-ticket-dialog.tsx`, `view-ticket-dialog.tsx`).
- `client/components/contracts/`: `contract-table.tsx`, `create-contract-dialog.tsx`, `edit-contract-dialog.tsx`, `delete-contract-dialog.tsx`, `import-contracts-dialog.tsx`, `upload-contract-dialog.tsx`, `pdf-viewer-modal.tsx`.
- `client/components/budgets/`: `budget-table.tsx`, `budget-items-table.tsx`, `budget-pdf-preview.tsx`, y los modales `create-budget-dialog.tsx`, `edit-budget-dialog.tsx`, `delete-budget-dialog.tsx`.
- `client/components/database/database-settings-panel.tsx`: UI para cambiar la URL de Mongo/SQLite y lanzar las acciones.
- `client/components/tickets/kyban-editor.tsx`: editor WYSIWYG usado en la ficha del ticket.
- `client/components/ui/`: componentes base (`alert-dialog.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `command.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `page-transition.tsx`, `pagination.tsx`, `popover.tsx`, `radio-group.tsx`, `rich-text-editor.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sonner.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`).

### Librerías y tipos
- `client/lib/http.ts` normaliza la URL y permite cambiar el prefijo `API_URL` (`client/lib/config.ts`).
- `client/lib/api-*` (budgets, clients, contracts, database, payments, products, repository) abstraen llamadas HTTP y exponen helpers para cada recurso.
- `client/lib/utils.ts` proporciona helpers `cn`, `exportToCsv`, `parseCsv`.
- `client/lib/leaflet-icon.ts` crea el ícono base de Leaflet con los assets locales.
- `client/types/` contiene definiciones para `budget.ts`, `budget-item.ts`, `budget-section.ts`, `client.ts`, `contract.ts`, `payment.ts`, `product.ts`, `ticket.ts`.

### Activos estáticos
- `client/public/` aloja íconos y assets (`logo.png`, `presu-01.pdf`, SVGs) utilizados por plantillas y el módulo de presupuesto.
- `client/pages/_error.tsx`, `_document.tsx`, `404.tsx`, `500.tsx` controlan los fallos de Next.js en modo `pages`.

## Backend (`server/`)
### `server/index.js`
- Configura CORS, sesiones (`express-session` + SQLiteStore), parsers JSON, `multer` para `uploads/contracts` y `uploads/budgets`, y crea carpetas si no existen.
- Define utilerías (`mapClientRow`, `mapTicketRow`, trackers de pagos, `ensurePendingPaymentForTicket`, `updateTicketStatus`).
- Rutas agrupadas:
  - Autenticación: `/`, `/register`, `/login`, `/logout`, `/profile` (JWT + `authenticateToken`).
  - Datos maestros: `/api/users/registered`, `/api/config` y `/api/config/:module` con `configService`.
  - Sistema: `/api/system/database*`, `/api/db/*`, `/api/notifications/*` (usa `notificationService`, `mongo-sync`, `sqliteSync`).
  - Clientes/Repositorio/Pagos/Contratos/Presupuestos/Productos/Tickets/Calendario: endpoints CRUD detallados más importaciones, uploads, exportaciones y sincronizaciones.
- Envía notificaciones automáticas cuando se registra un pago y sincroniza en Mongo (`syncPaymentToMongo`).

### `server/db.js`
- Inicializa `database/database.sqlite`, crea tablas (`users`, `sessions`, `clients`, `repository`, `tickets`, `contracts`, `budgets`, `budget_items`, `payments`, `sync_events`), añade columnas faltantes y semilla `admin@adminflow.uy`/`admin`.

### `server/lib/`
- `dbChoice.js`: lee/graba `.selected-db.json` y expone `determineDbEngine`, `updateDbConfig`.
- `dbConfigDefaults.js`: valores por defecto y rutas.
- `db-adapter.js`: helpers para decidir el origen de datos primario.
- `mongoClient.js`: cache de clientes Mongo y helpers de conexión.
- `mongo-sync.js`: sincroniza tablas SQLite en colecciones Mongo, compara conteos, verifica conexión.
- `configService.js`: persistencia de configuraciones modulares en Mongo con defaults.
- `userService.js`: replica usuarios registrados en Mongo y registra eventos.
- `notificationService.js`: abstrae envíos por email (Nodemailer), Telegram, WhatsApp (Twilio) y Slack, guarda historial en Mongo y `sync_events`.
- `sqliteSync.js`: guarda eventos de sincronización en la tabla `sync_events` para fallback.

### Archivos y sincronización
- `server/uploads/`: contratos (`contracts/`) y presupuestos (`budgets/`).
- `server/database/database.sqlite`: base de datos persistente.
- `.selected-db.json`: mantiene la selección de motor y las URIs.
- `server/scripts/migrate-sqlite-to-mongo.js`: script CLI que llama `syncLocalToMongo` para migración completa a Mongo.
- `server/app/dashboard/`: carpeta placeholder para futuros microservicios o dashboards.

## Estructura del repositorio
- `/server`: backend Express con SQLite + sincronización a Mongo, maneja autenticación, APIs CRUD, notificaciones, migraciones y uploads descritos en esta documentación.
- `/client`: frontend Next.js 16 con NextAuth, layout del dashboard y todos los módulos (clientes, tickets, presupuestos, etc.) que consumen los endpoints REST del backend.
- No existe ninguna carpeta `fullstack-login-app`; el código activo vive únicamente en `server/` y `client/`, y el README refleja esa estructura principal.

## Documentación de APIs
Todas las rutas REST enumeradas, con cuerpo, validaciones y ejemplos, viven en `Apis.md`. Este documento es la fuente canónica para integrar nuevos clientes o automatizar pruebas.

## Consejos y próximos pasos
- Verifica que el backend arranque antes de iniciar Next.js: el login depende del endpoint `/login` y del JWT `accessToken` que guarda NextAuth.
- Usa `Apis.md` para conocer qué cuerpo enviar en cada llamada; las llamadas desde `client/lib/api-*` siguen ese contrato.
- Cambia el motor con `client/app/database/page.tsx` si necesitas forzar SQLite o Mongo, y reinicia el servidor.
- Para replicar en producción, adapta `notificationService.js` con credenciales reales (SMTP, Twilio, Telegram, Slack) y habilita `DB_ENGINE`.
- Mantén la carpeta `server/uploads` fuera del control de versiones si empiezas a subir archivos reales; se regeneran desde los endpoints.

## Changelog

### 2025-11-18: Rediseño del Módulo Sistema

**Archivos Modificados:**
- `client/app/system/page.tsx` - Reescrito completamente con nueva arquitectura
- `client/lib/api-system.ts` - Nuevo servicio API creado
- `client/components/ui/switch.tsx` - Componente Switch agregado
- `README.md` - Documentación actualizada

**Cambios Realizados:**
1. **Rediseño de UI**: Interfaz moderna con diseño de tarjetas (cards), pestañas mejoradas y feedback visual en tiempo real.
2. **Integración con Backend**: Todas las funcionalidades ahora están conectadas a la API real:
   - Gestión de usuarios: `GET/PATCH /api/users/registered`
   - Configuración de notificaciones: `GET/POST /api/config/notifications`
   - Historial de eventos: `GET /api/notifications/history`
   - Pruebas de canal: `POST /api/notifications/send`
3. **Persistencia Real**: Los cambios ahora se guardan en MongoDB y persisten tras recargar la página.
4. **Componentes Nuevos**: 
   - Instalado `@radix-ui/react-switch` para switches de activación/desactivación
   - Creado componente `Switch` en `client/components/ui/switch.tsx`
5. **Mejoras de UX**:
   - Loading states durante la carga de datos
   - Toasts de confirmación para todas las acciones
   - Validación de JSON en campos de metadata
   - Botones de prueba para cada canal de notificación

**Reversión:**
Para revertir los cambios, restaurar desde el backup:
```bash
cd client/app/system
copy page.tsx.bak page.tsx
```

**Dependencias Agregadas:**
- `@radix-ui/react-switch@^1.1.2`

### 2025-11-18: Sistema de Notificaciones Automáticas

**Archivos Modificados:**
- `server/index.js` - Agregada función `sendAutoNotification` y notificaciones en endpoints CRUD
- `server/lib/notificationService.js` - Actualizado para leer configuración de MongoDB
- `client/app/notifications/page.tsx` - Implementado guardado real de configuración de eventos
- `client/lib/api-system.ts` - Agregado parámetro `recipients` a `sendTestNotification`
- `Apis.md` - Documentación actualizada con sistema automático
- `README.md` - Documentación actualizada

**Cambios Realizados:**

1. **Sistema de Notificaciones Automáticas**:
   - El servidor ahora envía notificaciones automáticamente cuando ocurren eventos importantes
   - Eventos soportados:
     - **Tickets**: `ticket_created`, `ticket_updated`, `ticket_closed`
     - **Presupuestos**: `budget_created`, `budget_approved`, `budget_rejected`
     - **Pagos**: `payment_received`
     - **Contratos**: `contract_signed`
     - **Calendario**: `event_created`

2. **Configuración Basada en MongoDB**:
   - `notificationService.js` ahora lee la configuración de canales desde MongoDB
   - Fallback a variables de entorno si no hay configuración guardada
   - Soporta Email (SMTP), Telegram, WhatsApp (Twilio) y Slack

3. **Función `sendAutoNotification`**:
   - Helper function que verifica la configuración guardada
   - Determina qué canales están habilitados para cada evento
   - Envía notificaciones solo por los canales configurados
   - Logs detallados para debugging

4. **Guardado de Configuración**:
   - La página `/notifications` ahora guarda la configuración de eventos en MongoDB
   - Estructura: `{ channels, templates, events }` guardada en `configurations.notifications`
   - Los eventos incluyen qué canales usar para cada tipo de notificación

5. **Botones de Test Funcionales**:
   - Test Email: Envía email con asunto y cuerpo personalizables
   - Test Telegram: Envía mensaje al chat configurado
   - Test WhatsApp: Envía mensaje vía Twilio
   - Test Slack: Envía mensaje al webhook configurado

6. **Logs de Debug**:
   - Logs detallados en consola del servidor para troubleshooting
   - Muestra configuración leída de MongoDB
   - Indica qué canales están habilitados para cada evento

**Uso:**
1. Configurar canales en `/system` → Canales
2. Configurar eventos en `/notifications` (qué canales usar para cada evento)
3. Hacer clic en "Guardar" para persistir la configuración
4. Las notificaciones se enviarán automáticamente cuando ocurran los eventos
5. Ver historial en `/notifications` → Historial
