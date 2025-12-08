ï»¿# APIs de AdminFlow

Base URL: `http://localhost:5000`
Todas las llamadas devuelven JSON. Si se envÃ­a cuerpo, use `Content-Type: application/json`. Las rutas protegidas (p. ej. `/profile`) esperan `Authorization: Bearer <token>` y la cookie `connect.sid` (la sesiÃ³n se abre en `/login`).

---


### `POST /logout`
- Destruye la sesiÃ³n de SQLite y borra la cookie `connect.sid`.

### `GET /profile`
- Protegida por middleware `authenticateToken`.
- Debe enviarse encabezado `Authorization: Bearer <token>`.
- Devuelve `{ message, user }` con los datos contenidos en el JWT.

---

## Usuarios registrados (Mongo)

### `GET /api/users/registered`
Devuelve la cola de usuarios sincronizados en Mongo (`_id`, `sqliteId`, `email`, `roles`, `metadata`, `createdAt`, `updatedAt`). Retorna `503` si Mongo no estÃ¡ conectado.

### `PATCH /api/users/registered/:id`
Actualiza roles/metadata/groupId o cualquier campo de un usuario sincronizado. Puedes pasar el `_id` de Mongo o el `sqliteId` heredado; si el documento Mongo no existe se sincroniza automáticamente a partir del usuario en SQLite antes de aplicar los cambios.

**Body:** (Parcial, solo los campos a actualizar)
```json
{
  "roles": ["admin", "support"],
  "groupId": "507f1f77bcf86cd799439011",
  "metadata": {
    "phone": "+598 99 123 456",
    "department": "IT"
  }
}
```

**Campos actualizables:**
- `roles`: Array de roles del usuario
- `groupId`: ID del grupo al que pertenece el usuario (referencia a `/api/groups`)
- `metadata`: Objeto con información adicional del usuario
- `avatar`: URL del avatar del usuario

**Respuesta:** El usuario actualizado completo

**Errores:**
- `400`: No se proporcionó ningún campo para actualizar
- `404`: Usuario no encontrado en MongoDB o SQLite
- `500`: Error al actualizar
- `503`: MongoDB no está conectado

### `DELETE /api/users/:id`
Elimina el usuario indicado. Primero intenta borrarlo en Mongo; si no se encuentra, borra el registro original en SQLite usando el `sqliteId`. Siempre retorna el mensaje de eliminación exitosa si el usuario existía en cualquiera de los motores.

### `PATCH /api/users/:id/password`
Actualiza la contraseña de un usuario existente (`_id` o `sqliteId`). Hashea la nueva contraseña y la guarda en Mongo o, si el documento no existe, en SQLite. Requiere `{ newPassword }` con al menos 8 caracteres.

---

## Grupos de Usuarios (MongoDB)

Administra grupos/equipos de usuarios en MongoDB. Los grupos permiten organizar usuarios en equipos de trabajo (Administración, Soporte, Instaladores, etc.) y asignar tickets a grupos completos.

**Grupos por Defecto:**
- `administracion`: Equipo interno responsable de la coordinación general
- `soporte`: Grupo de respaldo para incidentes y asistencia técnica
- `instaladores`: Equipo de instalación y despliegues en sitio

### `GET /api/groups`
Devuelve todos los grupos registrados.

**Respuesta:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "name": "Soporte",
    "slug": "soporte",
    "description": "Grupo de respaldo para incidentes y asistencia técnica",
    "members": [],
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-01T10:00:00.000Z"
  }
]
```

**Errores:**
- `503`: MongoDB no está disponible
- `500`: Error al cargar los grupos

### `POST /api/groups`
Crea un nuevo grupo.

**Body:**
```json
{
  "name": "Ventas",
  "slug": "ventas",
  "description": "Equipo de ventas y atención comercial"
}
```

**Validaciones:**
- `name` (requerido): Nombre del grupo
- `slug` (opcional): Identificador único (se genera automáticamente desde `name` si se omite)
- `description` (opcional): Descripción del grupo

**Respuesta:** `201` con el grupo creado

**Errores:**
- `400`: Nombre requerido
- `500`: Error al crear (ej: slug duplicado)
- `503`: MongoDB no está conectado

### `PATCH /api/groups/:id`
Actualiza un grupo existente.

**Parámetros:**
- `id`: `_id` del grupo en MongoDB

**Body:** (Parcial, solo los campos a actualizar)
```json
{
  "name": "Soporte Técnico",
  "description": "Equipo de soporte técnico especializado"
}
```

**Respuesta:** El grupo actualizado completo

**Errores:**
- `404`: Grupo no encontrado
- `500`: Error al actualizar (ej: slug duplicado)
- `503`: MongoDB no está conectado

### `DELETE /api/groups/:id`
Elimina un grupo permanentemente.

**Parámetros:**
- `id`: `_id` del grupo en MongoDB

**Respuesta:**
```json
{
  "message": "Grupo eliminado."
}
```

**Errores:**
- `404`: Grupo no encontrado
- `500`: Error al eliminar
- `503`: MongoDB no está conectado

**Nota:** Al eliminar un grupo, los usuarios asignados a ese grupo no se eliminan, solo se desvinculan del grupo.

---

## Configuraciones modulares

### `GET /api/config`
Lista todas las configuraciones (`tickets`, `contracts`, `payments`, `products`, `budgets`, `clients`, `users`). Si Mongo no tiene documentos, retorna los defaults.

### `GET /api/config/:module`
Obtiene o crea el documento del mÃ³dulo solicitado.

### `POST /api/config/:module`
Guarda o actualiza la configuraciÃ³n. Body: objeto arbitrario (`data`, `notifyOn`, `templates`, etc.). Devuelve el documento persistido.

---

## Sistema y bases de datos

### `GET /api/system/database`
Devuelve `{ module: 'database', data: { engine, mongoUri, mongoDb, sqlitePath }, engine }` leyendo `.selected-db.json`.

### `POST /api/system/database`
Actualiza la configuraciÃ³n guardada y persiste los nuevos valores (puedes cambiar URI/engine/paths). Devuelve la misma estructura que el GET.

### `POST /api/system/database/verify`
Valida una conexiÃ³n.
- Body: `{ engine: 'mongodb' | 'sqlite', mongoUri?, mongoDb?, sqlitePath? }`.
- Mongo: necesita URI y DB; hace `ping`.
- SQLite: prueba que el archivo `sqlitePath` existe.

### `GET /api/system/database/overview`
Devuelve un resumen con conteos de tablas SQLite (`sqlite.tables`) y colecciones Mongo (`mongo.collections`, `mongo.size`), mÃ¡s el `engine` activo.

### `GET /api/system/database/export/:engine`
Simula una exportaciÃ³n serializada a JSON (`engine` debe ser `mongodb` o `sqlite`). Agrega headers `Content-Disposition` y retorna `{ message, timestamp }`.

### `POST /api/db/select`
- Body: `{ engine: 'sqlite' | 'mongodb' }`.
- Cambia la selecciÃ³n persistida (reiniciar el servidor para que el motor activo se reevalÃºe).

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

## Gestión de Base de Datos

### `GET /api/database/overview`
Obtiene un resumen completo de la base de datos MongoDB activa.

**Respuesta:**
```json
{
  "collections": [
    {
      "name": "clients",
      "count": 150,
      "size": 524288
    }
  ],
  "totalSize": 5242880,
  "dbName": "adminflow",
  "mongoUri": "mongodb://localhost:27017",
  "connected": true
}
```

### `POST /api/database/verify`
Verifica la conexión a MongoDB con los parámetros proporcionados.

**Body:**
```json
{
  "mongoUri": "mongodb://localhost:27017",
  "mongoDb": "adminflow"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Conexión exitosa a MongoDB",
  "info": "Conectado a adminflow"
}
```

### `GET /api/database/export/:collection`
Exporta una colección completa como archivo JSON descargable.

**Parámetros:**
- `collection`: Nombre de la colección a exportar

**Respuesta:** Archivo JSON con todos los documentos de la colección.

### `DELETE /api/database/collections/:collection`
Elimina una colección completa de la base de datos.

**Parámetros:**
- `collection`: Nombre de la colección a eliminar

**Respuesta:**
```json
{
  "success": true,
  "message": "Colección clients eliminada correctamente"
}
```

### `GET /api/database/collections/:collection/documents`
Obtiene documentos de una colección con paginación.

**Parámetros:**
- `collection`: Nombre de la colección
- `page` (query): Número de página (default: 1)
- `limit` (query): Documentos por página (default: 20)

**Respuesta:**
```json
{
  "documents": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Respaldos (Backups)

### `GET /api/system/backups`
Lista todos los respaldos disponibles en el servidor.

**Respuesta:**
```json
[
  {
    "name": "adminflow_2025-12-01T10-30-00-000Z",
    "createdAt": "2025-12-01T10:30:00.000Z",
    "size": 5242880
  }
]
```

### `POST /api/system/backups`
Crea un nuevo respaldo completo de la base de datos MongoDB.

**Nota:** Solo respalda la base de datos específica configurada en `.selected-db.json`, no todas las bases de datos del servidor MongoDB.

**Respuesta:**
```json
{
  "success": true,
  "backupName": "adminflow_2025-12-01T10-30-00-000Z",
  "path": "/path/to/backup",
  "timestamp": "2025-12-01T10:30:00.000Z"
}
```

### `GET /api/system/backups/:backupName/download`
Descarga un respaldo como archivo `.tar.gz`.

**Parámetros:**
- `backupName`: Nombre del respaldo a descargar

**Respuesta:** Archivo `.tar.gz` con el respaldo completo.

### `POST /api/system/backups/restore`
Restaura la base de datos desde un respaldo local existente.

**Body:**
```json
{
  "backupName": "adminflow_2025-12-01T10-30-00-000Z"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Restauración completada"
}
```

### `POST /api/system/backups/analyze`
Analiza un archivo de respaldo subido para ver su contenido antes de restaurar.

**Body:** `multipart/form-data` con campo `backup` (archivo `.tar.gz`)

**Respuesta:**
```json
{
  "collections": [
    {
      "name": "clients",
      "size": 524288
    }
  ],
  "totalSize": 5242880,
  "backupId": "temp_backup_id"
}
```

### `POST /api/system/backups/restore-upload`
Restaura la base de datos desde un archivo de respaldo previamente analizado.

**Body:**
```json
{
  "backupId": "temp_backup_id"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Restauración completada exitosamente"
}
```

### `DELETE /api/system/backups/:backupName`
Elimina un respaldo del servidor.

**Parámetros:**
- `backupName`: Nombre del respaldo a eliminar

**Respuesta:**
```json
{
  "message": "Backup deleted successfully"
}
```

---

## Notificaciones

AdminFlow incluye un **sistema de notificaciones automÃ¡ticas** que envÃ­a alertas por mÃºltiples canales (Email, Telegram, WhatsApp, Slack) cuando ocurren eventos importantes en el sistema.

### Sistema de Notificaciones AutomÃ¡ticas

El servidor envÃ­a notificaciones automÃ¡ticamente para los siguientes eventos:

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

La configuraciÃ³n de quÃ© canales usar para cada evento se guarda en MongoDB (colecciÃ³n `configurations`, mÃ³dulo `notifications`) y se puede administrar desde `/notifications`.

### `POST /api/notifications/send`
- Body: `{ event: string, message: string, channels?: string[], metadata?: object, recipients?: string[] }`.
- Requiere que `notificationService.isReady()` (al menos un canal configurado). Si no lo estÃ¡ responde `503`.
- Ejecuta cada canal configurado (`email`, `telegram`, `whatsapp`, `slack`) y guarda el resultado en Mongo + `sync_events`.
- **Nota**: Este endpoint se usa principalmente para pruebas. Las notificaciones automÃ¡ticas se envÃ­an internamente cuando ocurren los eventos.

### `GET /api/notifications/history`
- Query opcional `limit` (default 25).
- Consulta la colecciÃ³n `notifications` en Mongo; si no hay conexiÃ³n devuelve los eventos de `sync_events`.
- Devuelve un array de notificaciones con: `{ event, message, channels, recipients, metadata, results, createdAt }`.

### `POST /api/notifications/verify-smtp`
- Body: `{ host: string, port: string, user: string, pass: string }`.
- Verifica la conexiÃ³n SMTP con los parÃ¡metros proporcionados usando `nodemailer.createTransport().verify()`.
- Devuelve `{ success: true, message: 'ConexiÃ³n SMTP exitosa' }` si la conexiÃ³n es exitosa.
- Devuelve `{ success: false, message: 'Error de conexiÃ³n SMTP', detail: string }` con cÃ³digo `500` si falla.
- Ãštil para validar credenciales SMTP antes de guardar la configuraciÃ³n.

### `POST /api/config/notifications`
- Body: `{ channels: object, templates: object, events: array }`.
- Guarda la configuraciÃ³n de canales, plantillas y eventos de notificaciÃ³n en MongoDB (colecciÃ³n `configurations`, mÃ³dulo `notifications`).
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
- Obtiene la configuraciÃ³n de canales, plantillas y eventos de notificaciÃ³n desde MongoDB.
- Devuelve `{ module: 'notifications', data: { channels, templates, events } }`.
- Si no existe configuraciÃ³n, devuelve valores por defecto vacÃ­os.

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
- `POST /api/clients/:id/repository`: requiere `{ name, type }`; guarda categorÃ­a/formato/credential/opciones adicionales y retorna la entrada.
- `PUT /api/repository/:id`: actualiza los campos enumerados y actualiza `updatedAt`.
- `DELETE /api/repository/:id`: elimina la entrada.

### Accesos y Credenciales

Gestion de dispositivos, IPs, contrasenas y serie/MAC del cliente (coleccion MongoDB `client_accesses`). Soporta tipos clasicos (router, firewall, camara) y accesos virtuales (`virtual-linux`, `virtual-windows`).

#### `GET /api/clients/:id/access`
Obtiene todos los accesos de un cliente ordenados por fecha de creacion (mas recientes primero).

**Respuesta:**
```json
[
  {
    "_id": "60d5ec...",
    "clientId": "2",
    "equipo": "Router Principal",
    "tipo_equipo": "router",
    "ip": "192.168.1.1",
    "user": "admin",
    "pass": "admin123",
    "serieMac": "AA:BB:CC:DD:EE:FF",
    "comentarios": "Acceso principal",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
]
```

```

#### `POST /api/clients/:id/access`


Crea un nuevo acceso para el cliente.

**Body:**
```json
{
  "equipo": "Servidor Web",
  "tipo_equipo": "servidor",
  "ip": "10.0.0.50",
  "user": "root",
  "pass": "s3cr3t",
  "comentarios": "Servidor de producción"
}
```

**Validaciones:**
- `equipo` (requerido): Nombre del equipo/dispositivo
- `tipo_equipo` (requerido): Tipo de equipo (router, switch, servidor, firewall, etc.)
- `ip` (opcional): Dirección IP o URL
- `user` (opcional): Usuario de acceso
- `pass` (opcional): Contraseña (se guarda en texto plano por diseño del repositorio)
- `comentarios` (opcional): Notas adicionales

**Respuesta:** El acceso creado con `_id` y timestamps.

#### `PUT /api/access/:accessId`
Actualiza un acceso existente.

**Body:** (Parcial, solo los campos a actualizar)
```json
{
  "pass": "new_password",
  "comentarios": "Clave actualizada el 20/11/2025"
}
```

**Respuesta:** El acceso actualizado completo.

#### `DELETE /api/access/:accessId`
Elimina un acceso permanentemente.

**Respuesta:**
```json
{
  "message": "Acceso eliminado correctamente"
}
```

**Errores comunes:**
- `400`: ID inválido
- `404`: Acceso no encontrado
- `503`: Base de datos no disponible

### Diagramas de Red

Gestión de diagramas de red (Excalidraw) asociados a clientes.

#### `GET /api/clients/:id/diagram`
Obtiene el diagrama guardado para un cliente. Retorna el objeto del diagrama o `null` si no existe.

#### `POST /api/clients/:id/diagram`
Guarda o actualiza el diagrama del cliente.
- **Body**: `{ elements: [], appState: {}, files: {} }` (Estructura interna de Excalidraw).
- **Respuesta**: `{ message: "Diagram saved successfully" }`.

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
- Body: `{ clientId, title, description?, responsibilities?, recurrence?, startDate?, endDate?, status?, sla?, contractType?, amount?, currency? }`.
- `clientId` y `title` obligatorios. El campo `responsibilities` almacena deberes/responsabilidades asociados al acuerdo; `recurrence` define la periodicidad (Semanal, Mensual, Anual u Otro).

### `PUT /api/contracts/:id`
Actualiza todos los campos, incluyendo `responsibilities` y `recurrence`, y responde con la fila actualizada.

### `DELETE /api/contracts/:id`
Elimina el contrato y, si tenÃ­a `file_path`, borra el archivo.

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
Actualiza tÃ­tulo, descripciÃ³n, monto, estado, cliente y secciones.

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
- `DELETE /api/items/:itemId`: elimina el Ã­tem.

---

## Productos

### `GET /api/products`
CatÃ¡logo completo.

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
- Mantiene los arrays si no se reenvÃ­an.
- Si el nuevo `status` es `Facturar`, llama a `ensurePendingPaymentForTicket` (genera un pago pendiente si no existe).

### `DELETE /api/tickets/:id`
Elimina el ticket.

### `GET /api/clients/:id/tickets`
Tickets de un cliente.

---

## Calendario

### `GET /api/calendar-events`
Devuelve eventos ordenados por `start` con metadata completa: `{ id, title, start, end?, location?, sourceType, sourceId, locked }`.

### `POST /api/calendar-events`
- Body: `{ title, start?, end?, location?, sourceType?, sourceId?, locked? }`.
- `title` es obligatorio; si `start` no llega se usa la fecha actual.
- Cuando `sourceType` no es `manual`, el evento queda bloqueado (`locked: true`) y solo puede modificarse desde su modulo de origen.

### `PUT /api/calendar-events/:id`
Actualiza titulo, ubicacion y fechas de un evento no bloqueado. Si el evento esta bloqueado responde `403` con el mensaje "Evento bloqueado. Modificalo desde su origen".

### Eventos automaticos
- Al crear Tickets, Pagos o Contratos el servidor genera/actualiza eventos en el calendario con `sourceType` (`ticket`, `payment`, `contract`), `sourceId` y `locked: true`.
- Estos eventos aparecen con icono segun el tipo y un candado en el cliente; se editan solo desde el modulo que los creo.


### `DELETE /api/calendar-events/:id`
Elimina un evento manual (bloqueados devuelven `403`).

### Eventos automaticos
- Al crear Tickets, Pagos o Contratos el servidor genera/actualiza eventos en el calendario con `sourceType` (`ticket`, `payment`, `contract`), `sourceId` y `locked: true`.
- Estos eventos aparecen con icono segun el tipo y un candado en el cliente; se editan solo desde el modulo que los creo.

