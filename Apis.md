# APIs de AdminFlow

Base URL: `http://localhost:5000`
Todas las llamadas devuelven JSON. Si se envía cuerpo, use `Content-Type: application/json`. Las rutas protegidas (p. ej. `/profile`) esperan `Authorization: Bearer <token>` y la cookie `connect.sid` (la sesión se abre en `/login`).

---

## Autenticación general

### `GET /`
Ping rápido del servidor. Sin parámetros.

### `POST /register`
- Cuerpo: `{ "email": string, "password": string }`.
- Devuelve: `{ message: 'User registered successfully', userId: number }`.
- Registra el usuario en SQLite y replica `sqliteId`/`email` en Mongo (`trackRegisteredUser`). Maneja `409` si el email ya existe.

### `POST /login`
- Cuerpo: `{ "email": string, "password": string }`.
- Devuelve: `{ message: 'Logged in successfully', token: string }` y mantiene `req.session.userId`.
- Genera JWT con `JWT_SECRET` y expira en 1 hora.

### `POST /logout`
- Destruye la sesión de SQLite y borra la cookie `connect.sid`.

### `GET /profile`
- Protegida por middleware `authenticateToken`.
- Debe enviarse encabezado `Authorization: Bearer <token>`.
- Devuelve `{ message, user }` con los datos contenidos en el JWT.

---

## Usuarios registrados (Mongo)

### `GET /api/users/registered`
Devuelve la cola de usuarios sincronizados en Mongo (`_id`, `sqliteId`, `email`, `roles`, `metadata`, `createdAt`, `updatedAt`). Retorna `503` si Mongo no está conectado.

### `PATCH /api/users/registered/:id`
Actualiza roles/metadata/email de un registro existente (puede suministrarse `_id` de Mongo o `sqliteId`). El cuerpo debe ser un objeto con alguno de los campos; se registra en `sync_events`.

---

## Configuraciones modulares

### `GET /api/config`
Lista todas las configuraciones (`tickets`, `contracts`, `payments`, `products`, `budgets`, `clients`, `users`). Si Mongo no tiene documentos, retorna los defaults.

### `GET /api/config/:module`
Obtiene o crea el documento del módulo solicitado.

### `POST /api/config/:module`
Guarda o actualiza la configuración. Body: objeto arbitrario (`data`, `notifyOn`, `templates`, etc.). Devuelve el documento persistido.

---

## Sistema y bases de datos

### `GET /api/system/database`
Devuelve `{ module: 'database', data: { engine, mongoUri, mongoDb, sqlitePath }, engine }` leyendo `.selected-db.json`.

### `POST /api/system/database`
Actualiza la configuración guardada y persiste los nuevos valores (puedes cambiar URI/engine/paths). Devuelve la misma estructura que el GET.

### `POST /api/system/database/verify`
Valida una conexión.
- Body: `{ engine: 'mongodb' | 'sqlite', mongoUri?, mongoDb?, sqlitePath? }`.
- Mongo: necesita URI y DB; hace `ping`.
- SQLite: prueba que el archivo `sqlitePath` existe.

### `GET /api/system/database/overview`
Devuelve un resumen con conteos de tablas SQLite (`sqlite.tables`) y colecciones Mongo (`mongo.collections`, `mongo.size`), más el `engine` activo.

### `GET /api/system/database/export/:engine`
Simula una exportación serializada a JSON (`engine` debe ser `mongodb` o `sqlite`). Agrega headers `Content-Disposition` y retorna `{ message, timestamp }`.

### `POST /api/db/select`
- Body: `{ engine: 'sqlite' | 'mongodb' }`.
- Cambia la selección persistida (reiniciar el servidor para que el motor activo se reevalúe).

### `POST /api/db/sync`
- Body: `{ engine: 'sqlite' | 'mongodb' }`.
- Si se solicita `mongodb`, ejecuta `syncLocalToMongo` sobre las tablas definidas (`clients`, `tickets`, `budgets`, etc.) sin borrar documentos existentes.
- Si se solicita `sqlite`, responde que no aplica.

### `POST /api/db/reset`
- Body: `{ engine: 'sqlite' | 'mongodb' }`.
- `sqlite`: cierra la DB, borra el archivo `database.sqlite`. Hay que reiniciar para recrear las tablas.
- `mongodb`: suelta todas las colecciones del cliente Mongo conectado.

### `POST /api/db/migrate-to-mongo`
Replica SQLite en Mongo borrando las colecciones antes de insertar (`dropExisting: true`). Devuelve el resumen de cada tabla.

---

## Notificaciones

AdminFlow incluye un **sistema de notificaciones automáticas** que envía alertas por múltiples canales (Email, Telegram, WhatsApp, Slack) cuando ocurren eventos importantes en el sistema.

### Sistema de Notificaciones Automáticas

El servidor envía notificaciones automáticamente para los siguientes eventos:

**Tickets:**
- `ticket_created`: Cuando se crea un nuevo ticket
- `ticket_updated`: Cuando se actualiza el estado de un ticket
- `ticket_closed`: Cuando se cierra un ticket

**Presupuestos:**
- `budget_created`: Cuando se genera un nuevo presupuesto
- `budget_approved`: Cuando el cliente aprueba un presupuesto
- `budget_rejected`: Cuando se rechaza un presupuesto

**Pagos:**
- `payment_received`: Cuando se confirma un pago

**Contratos:**
- `contract_signed`: Cuando se firma un contrato (estado "Firmado" o "Activo")

**Calendario:**
- `event_created`: Cuando se crea un nuevo evento

La configuración de qué canales usar para cada evento se guarda en MongoDB (colección `configurations`, módulo `notifications`) y se puede administrar desde `/notifications`.

### `POST /api/notifications/send`
- Body: `{ event: string, message: string, channels?: string[], metadata?: object, recipients?: string[] }`.
- Requiere que `notificationService.isReady()` (al menos un canal configurado). Si no lo está responde `503`.
- Ejecuta cada canal configurado (`email`, `telegram`, `whatsapp`, `slack`) y guarda el resultado en Mongo + `sync_events`.
- **Nota**: Este endpoint se usa principalmente para pruebas. Las notificaciones automáticas se envían internamente cuando ocurren los eventos.

### `GET /api/notifications/history`
- Query opcional `limit` (default 25).
- Consulta la colección `notifications` en Mongo; si no hay conexión devuelve los eventos de `sync_events`.
- Devuelve un array de notificaciones con: `{ event, message, channels, recipients, metadata, results, createdAt }`.

### `POST /api/notifications/verify-smtp`
- Body: `{ host: string, port: string, user: string, pass: string }`.
- Verifica la conexión SMTP con los parámetros proporcionados usando `nodemailer.createTransport().verify()`.
- Devuelve `{ success: true, message: 'Conexión SMTP exitosa' }` si la conexión es exitosa.
- Devuelve `{ success: false, message: 'Error de conexión SMTP', detail: string }` con código `500` si falla.
- Útil para validar credenciales SMTP antes de guardar la configuración.

### `POST /api/config/notifications`
- Body: `{ channels: object, templates: object, events: array }`.
- Guarda la configuración de canales, plantillas y eventos de notificación en MongoDB (colección `configurations`, módulo `notifications`).
- **Estructura de `channels`**: 
  ```json
  {
    "email": { "enabled": true, "apiKey": "smtp.gmail.com", "webhook": "587", "smtpUser": "user@example.com", "smtpPass": "password" },
    "telegram": { "enabled": true, "apiKey": "BOT_TOKEN", "webhook": "CHAT_ID" },
    "whatsapp": { "enabled": true, "apiKey": "TWILIO_SID", "webhook": "TWILIO_TOKEN" },
    "slack": { "enabled": true, "apiKey": "WEBHOOK_URL" }
  }
  ```
- **Estructura de `events`**: Array de eventos con canales habilitados:
  ```json
  [
    {
      "id": "ticket_created",
      "name": "Ticket Creado",
      "description": "Cuando se crea un nuevo ticket",
      "module": "tickets",
      "channels": { "email": true, "telegram": true, "whatsapp": false, "slack": true }
    }
  ]
  ```
- Devuelve el documento completo guardado con estructura `{ module: 'notifications', data: {...}, createdAt, updatedAt }`.

### `GET /api/config/notifications`
- Obtiene la configuración de canales, plantillas y eventos de notificación desde MongoDB.
- Devuelve `{ module: 'notifications', data: { channels, templates, events } }`.
- Si no existe configuración, devuelve valores por defecto vacíos.

---

## Clientes y repositorio

### `GET /api/clients`
Lista completa de clientes: `{ id, name, contract (boolean), latitude?, longitude?, ... }`.

### `GET /api/clients/:id`
Ficha del cliente con lat/long.

### `POST /api/clients`
- Body: `{ name, alias?, rut?, email?, phone?, address?, contract?, latitude?, longitude? }`.
- `name` es obligatorio; `contract` se guarda como booleano.
- Responde `409` si el email ya existe.

### `PUT /api/clients/:id`
- Body: campos actualizables, `name` obligatorio.
- Actualiza lat/lng y marca `updatedAt`.

### `DELETE /api/clients/:id`
Elimina cliente y dependencias suaves.

### `POST /api/clients/import`
Acepta `[Client]` o `{ clients: [Client] }`. Retorna `{ total, imported, failed, errors }`.

### Repositorio
- `GET /api/clients/:id/repository`: obtiene documentos/credenciales asociados (normaliza `name`, `type`, `category`, `format`, `credential`, `notes`, `content`, `fileName`).
- `POST /api/clients/:id/repository`: requiere `{ name, type }`; guarda categoría/formato/credential/opciones adicionales y retorna la entrada.
- `PUT /api/repository/:id`: actualiza los campos enumerados y actualiza `updatedAt`.
- `DELETE /api/repository/:id`: elimina la entrada.

---

## Pagos

### `GET /api/clients/:id/payments`
Pagos ordenados por `createdAt` para un cliente.

### `GET /api/payments`
Lista global ordenada.

### `POST /api/payments`
- Body: `{ invoice, client, clientId?, amount, status?, ticketId?, ticketTitle?, method?, note?, concept?, currency?, createdAt? }`.
- `invoice`, `client` y `amount` son obligatorios; `amount > 0`.
- Genera `id` tipo `PAY-${uuid().slice(0,6)}`.
- Notifica por los canales configurados y replica en Mongo (`syncPaymentToMongo`).

### `PUT /api/payments/:id`
- Actualiza los mismos campos; valida `amount > 0`.
- Si `status` pasa a `Pagado` o `Facturar` y hay `ticket_id`, llama a `updateTicketStatus`.

### `DELETE /api/payments/:id`
Elimina el pago si existe.

---

## Contratos

### `GET /api/contracts`
Lista todos los contratos (`CONTRACT_SELECT_BASE`).

### `GET /api/clients/:id/contracts`
Contratos filtrados por cliente.

### `POST /api/contracts`
- Body: `{ clientId, title, description?, startDate?, endDate?, status?, sla?, contractType?, amount?, currency? }`.
- `clientId` y `title` obligatorios.

### `PUT /api/contracts/:id`
Actualiza todos los campos y responde con la fila actualizada.

### `DELETE /api/contracts/:id`
Elimina el contrato y, si tenía `file_path`, borra el archivo.

### `POST /api/contracts/import`
Importa un array (o `{ contracts: [] }`). Valida `clientId`.

### `POST /api/contracts/:id/upload`
- `multipart/form-data` con campo `contractFile`.
- Guarda el archivo en `uploads/contracts/`, actualiza `file_path` y retorna el contrato actualizado.

---

## Presupuestos y items

### `GET /api/budgets`
Lista con join al cliente y secciones JSON.

### `GET /api/budgets/:id`
Detalle de budgeting.

### `GET /api/clients/:id/budgets`
Lista por cliente.

### `POST /api/budgets`
- Body: `{ clientId, title, description?, amount?, status?, sections? }`.
- `clientId` y `title` obligatorios; `sections` se serializa a JSON.

### `PUT /api/budgets/:id`
Actualiza título, descripción, monto, estado, cliente y secciones.

### `DELETE /api/budgets/:id`
Elimina el presupuesto.

### `POST /api/budgets/:id/cover`
`multipart/form-data` campo `cover`; guarda el archivo en `uploads/budgets` y retorna `{ url }`.

### `POST /api/budgets/:id/share`
`multipart/form-data` campo `file`; retorna `{ url }` (puede usarse para compartir PDF generado en el frontend).

### Items
- `GET /api/budgets/:id/items`: lista los items relacionados.
- `POST /api/budgets/:id/items`: requiere `{ description, quantity, unitPrice }`, `productId` opcional.
- `PUT /api/items/:itemId`: actualiza el item; `description`, `quantity` y `unitPrice` obligatorios.
- `DELETE /api/items/:itemId`: elimina el ítem.

---

## Productos

### `GET /api/products`
Catálogo completo.

### `POST /api/products`
- Body: `{ name, description?, manufacturer, category?, badge?, priceUYU?, priceUSD?, imageUrl? }`.
- `name` y `manufacturer` obligatorios.

### `PUT /api/products/:id`
Actualiza cualquier campo.

### `DELETE /api/products/:id`
Elimina el producto.

---

## Tickets

### `GET /api/tickets`
Lista con datos enriquecidos (cliente, estado, prioridad, montos, attachments, audioNotes).

### `GET /api/tickets/:id`
Detalle completo.

### `POST /api/tickets`
- Body: `{ clientId, title, priority, annotations?, status?, amount?, visit?, description?, attachments?, audioNotes? }`.
- `clientId`, `title` y `priority` obligatorios.
- `annotations`, `attachments`, `audioNotes` se guardan como JSON.

### `PUT /api/tickets/:id`
- Mantiene los arrays si no se reenvían.
- Si el nuevo `status` es `Facturar`, llama a `ensurePendingPaymentForTicket` (genera un pago pendiente si no existe).

### `DELETE /api/tickets/:id`
Elimina el ticket.

### `GET /api/clients/:id/tickets`
Tickets de un cliente.

---

## Calendario

### `GET /api/calendar-events`
Eventos ordenados por `start`.

### `POST /api/calendar-events`
- Body: `{ title, start, end?, location? }`.
- `title` y `start` obligatorios.

### `PUT /api/calendar-events/:id`
Actualiza título, ubicación, fechas.
