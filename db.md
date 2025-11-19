# Base de datos de AdminFlow

## SQLite (`server/database/database.sqlite`)

El backend arranca su persistencia relacional con SQLite. `server/db.js` crea automáticamente las tablas necesarias y aplica `ALTER TABLE` para columnas extra cuando falta alguna. Estas son las tablas y columnas clave:

| Tabla | Propósito | Campos principales |
| --- | --- | --- |
| `users` | Autenticación local (admin demo). | `id`, `email` (UNIQUE), `password` (bcrypt hash). Se inserta `admin@adminflow.uy` si no existe. |
| `sessions` | Sesiones de `express-session`. | `sid` PK, `sess` JSON, `expired` timestamp. Utilizada por el store SQLite. |
| `clients` | Clientes del CRM. | `id`, `name` (NOT NULL), `alias`, `rut`, `email` (UNIQUE), `phone`, `address`, `latitude`, `longitude`, `contract` (BOOLEAN), `createdAt`, `updatedAt`. `latitude`/`longitude` se llenan desde el frontend de mapa. |
| `repository` | Documentos/credenciales por cliente. | `id`, `client_id` FK, `equipo`, `usuario`, `password`, `mac_serie`, `comentarios`, columnas añadidas: `name`, `type`, `category`, `format`, `credential`, `notes`, `content`, `file_name`, `createdAt`, `updatedAt`. |
| `tickets` | Tickets con anotaciones, attachments y pagos. | `id`, `client_id`, `title`, `status`, `priority`, `amount`, `visit`, `annotations`, `description`, `attachments`, `audioNotes`, `createdAt`, `updatedAt`. Los campos JSON (`annotations`, `attachments`, `audioNotes`) se almacenan como TEXT. |
| `contracts` | Contratos por cliente y uploads. | `id`, `client_id`, `contract_name`, `file_path`, `currency`, `title`, `description`, `startDate`, `endDate`, `status`, `sla`, `contractType`, `amount`, `createdAt`, `updatedAt`. |
| `budgets` | Presupuestos con secciones JSON y portada. | `id`, `client_id`, `title`, `description`, `amount`, `status`, `sections` (JSON TEXT), `file_path`, `createdAt`, `updatedAt`. |
| `budget_items` | Items de presupuesto. | `id`, `budget_id` FK, `product_id` FK (nullable), `description`, `quantity`, `unit_price`. Las relaciones con `products` tienen `ON DELETE CASCADE`. |
| `products` | Catálogo de productos/servicios. | `id`, `name`, `description`, `manufacturer`, `category`, `badge`, `price_uyu`, `price_usd`, `image_url`, `createdAt`, `updatedAt`. |
| `payments` | Pagos guardados con IDs humanos. | `id` (e.g. `PAY-XXXXXX`), `invoice`, `ticket_id`, `ticket_title`, `client`, `client_id`, `concept`, `amount`, `status`, `method`, `note`, `currency`, `createdAt`. Se sincroniza con Mongo y dispara notificaciones. |
| `sync_events` | Historial de eventos para fallback de notificaciones. | `id`, `collection`, `payload` (JSON), `createdAt`. Cada módulo llama a `recordSyncEvent` al escribir en Mongo. |
| `calendar_events` | Eventos del módulo de calendario. | `id`, `title`, `location`, `start`, `end`, `createdAt`, `updatedAt`. |

### Consideraciones

- Las relaciones básicas son manuales; no hay claves foráneas estrictas salvo `budget_items.budget_id` y `products` (por `FOREIGN KEY` en creación). Las demás referencias se gestionan en el código (e.g. `client_id`).
- Los IDs en SQLite son `INTEGER AUTOINCREMENT` excepto `payments.id` (string generado con `uuid` + prefijo).
- `payments` y `tickets` mantienen triggers lógicos `ensurePendingPaymentForTicket`, `updateTicketStatus` que generan pagos pendientes cuando se marca un ticket como `Facturar`.
- `clients.contract` se guarda como `0`/`1` pero se mapea a booleano antes de enviarlo al frontend.
- `budget_items` se borra automáticamente con el presupuesto; en el código no existen procedimientos almacenados, todo se maneja mediante consultas SQL estándar.

## MongoDB

Cuando `DB_ENGINE` se elige como `mongodb` (o es el valor por defecto), el servidor inicializa un cliente Mongo (`server/lib/mongoClient.js`) y sincroniza las colecciones críticas.

| Colección | Origen/Sincronización | Campos destacados |
| --- | --- | --- |
| `users` | `trackRegisteredUser` replica `users` SQLite (`sqliteId`, `email`, `roles`, `metadata`). | `_id` (ObjectId), `sqliteId`, `email`, `roles`, `metadata`, `createdAt`, `updatedAt`. |
| `configurations` | `configService` guarda defaults y permite updates vía `/api/config/:module`. | `module`, `data` JSON, `notifyOn`, `templates`, `createdAt`, `updatedAt`. |
| `notifications` | `notificationService` registra envíos de email/Slack/Telegram/WhatsApp. | `event`, `message`, `channels`, `recipients`, `metadata`, `results`, `createdAt`. |
| `clients` | `syncLocalToMongo` copia la tabla completa. | `_id` = sqlite `id`, `name`, `alias`, `rut`, `email`, `phone`, `address`, `latitude`, `longitude`, `contract`, `createdAt`, `updatedAt`. |
| `repository`, `tickets`, `contracts`, `budgets`, `budget_items`, `products`, `payments` | El script `server/scripts/migrate-sqlite-to-mongo.js` y el endpoint `/api/db/migrate-to-mongo` replican estos datos. Cada colección incluye `_id` igual al `id` SQLite, payload normalizado con fechas convertidas a `Date`. |
| `sessions` | Exporta desde `sessions` SQLite (`sid`, `sess`, `expired`). |

#### Colecciones sincronizadas desde SQLite

`server/lib/mongo-sync.js` aglutina las transformaciones de `tableConfigs` que normalizan fechas (`new Date(...)`) y JSON (`safeParseJSON`). Cada colección obtiene `_id` igual al `id` SQLite (salvo `sessions`, que usa `sid`) y conserva los campos relevantes descritos abajo:

- **users**: `_id` = `users.id`, `email`, `password`.
- **sessions**: `_id` = `sessions.sid`, `sess` (JSON parseado), `expired`.
- **clients**: `_id` = `clients.id`, `name`, `alias`, `rut`, `email`, `phone`, `address`, `latitude`, `longitude`, `contract` (booleano), `createdAt`, `updatedAt`.
- **repository**: `_id` = `repository.id`, `clientId`, `equipo`, `usuario`, `password`, `macSerie`, `comentarios`, `name`, `type`, `category`, `format`, `credential`, `notes`, `content` (JSON), `fileName`, `createdAt`, `updatedAt`.
- **tickets**: `_id` = `tickets.id`, `clientId`, `title`, `status`, `priority`, `amount`, `visit` (booleano), `annotations`, `description`, `attachments`, `audioNotes` (JSON), `createdAt`, `updatedAt`.
- **contracts**: `_id` = `contracts.id`, `clientId`, `title`, `description`, `startDate`, `endDate`, `status`, `sla`, `contractType`, `amount`, `currency`, `filePath`, `createdAt`, `updatedAt`.
- **products**: `_id` = `products.id`, `name`, `manufacturer`, `description`, `category`, `badge`, `priceUYU`, `priceUSD`, `imageUrl`, `createdAt`, `updatedAt`.
- **budgets**: `_id` = `budgets.id`, `clientId`, `title`, `description`, `amount`, `status`, `sections` (JSON), `filePath`, `createdAt`, `updatedAt`.
- **budget_items**: `_id` = `budget_items.id`, `budgetId`, `productId`, `description`, `quantity`, `unitPrice`.
- **payments**: `_id` = `payments.id` (prefijo `PAY-`), `invoice`, `ticketId`, `ticketTitle`, `client`, `clientId`, `amount`, `status`, `method`, `note`, `currency`, `createdAt`.
### Sincronización y validación

- `server/lib/mongo-sync.js` mantiene `tableConfigs` con funciones `transform` para normalizar datos. Cada tabla se convierte en documento con `_id` definido (por ejemplo `tickets.id`).
- La función `syncLocalToMongo({ dropExisting })` permite sincronizar y comparar conteos (`compareBases`). El front de base de datos usa `/api/db/sync` y `/api/db/overview` para exponer el estado.
- El middleware `notificationService` guarda eventos en Mongo y también escribe una copia en `sync_events` para lectura si Mongo no está disponible; el endpoint `/api/notifications/history` prefiere Mongo y luego la tabla SQLite.

## Flujo típico

1. SQLite almacena todas las transacciones; el frontend y las APIs CRUD trabajan sobre `server/db.js`.
2. Si la réplica Mongo está activa, `syncLocalToMongo` y `trackRegisteredUser` mantienen colecciones `clients`, `tickets`, `payments`, etc.
3. La configuración del motor (`server/lib/dbChoice.js` + `.selected-db.json`) decide si se inicia `initMongo`; cambiar de motor se hace por `/api/db/select`.
4. `server/lib/notificationService` usa la colección `notifications` y `sync_events` (SQLite) para guardar registros de envíos externos.

## Referencias

- Configuración del motor: `server/lib/dbChoice.js`, `server/lib/dbConfigDefaults.js`.
- Estructura SQL: `server/db.js` crea tablas y columnas faltantes.
- Sincronización a Mongo: `server/lib/mongo-sync.js`, `server/scripts/migrate-sqlite-to-mongo.js`, `server/lib/userService.js`.
- Notificaciones: `server/lib/notificationService.js`, `server/lib/sqliteSync.js`.
