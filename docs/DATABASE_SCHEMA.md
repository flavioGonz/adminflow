# Esquema de la Base de Datos de AdminFlow

Este documento detalla la estructura de las bases de datos utilizadas en el proyecto AdminFlow. La arquitectura es **híbrida**, empleando SQLite para datos de negocio centrales y MongoDB para gestión de la aplicación y funcionalidades extendidas.

## 1. SQLite: Base de Datos de Negocio Principal

SQLite se utiliza como una base de datos relacional simple y basada en archivos para las entidades de negocio fundamentales. El archivo de la base de datos se encuentra típicamente en `server/database/database.sqlite`.

A continuación se detallan las tablas y sus columnas inferidas a partir del código fuente (`server/index.js`).

---

### Tabla: `clients`

Almacena la información de los clientes de la empresa.

| Columna                 | Tipo      | Descripción                                              |
| ----------------------- | --------- | -------------------------------------------------------- |
| `id`                    | `INTEGER` | **Clave Primaria**. Identificador único autoincremental. |
| `name`                  | `TEXT`    | Nombre completo o razón social del cliente. (Obligatorio) |
| `alias`                 | `TEXT`    | Un nombre corto o alias para el cliente.                 |
| `rut`                   | `TEXT`    | Número de identificación fiscal del cliente.             |
| `email`                 | `TEXT`    | Correo electrónico de contacto. Debe ser único.          |
| `phone`                 | `TEXT`    | Teléfono de contacto.                                    |
| `address`               | `TEXT`    | Dirección física del cliente.                            |
| `latitude`              | `REAL`    | Coordenada de latitud para geolocalización.              |
| `longitude`             | `REAL`    | Coordenada de longitud para geolocalización.             |
| `contract`              | `INTEGER` | Booleano (0 o 1) que indica si tiene un contrato activo. (Legacy) |
| `notifications_enabled` | `INTEGER` | Booleano (0 o 1) para habilitar notificaciones al cliente. |
| `avatarUrl`             | `TEXT`    | Ruta al archivo de avatar del cliente.                   |
| `createdAt`             | `DATETIME`| Fecha de creación (automática).                          |
| `updatedAt`             | `DATETIME`| Fecha de última actualización (automática).              |

---

### Tabla: `tickets`

Gestiona los tickets de soporte o servicio asociados a los clientes.

| Columna          | Tipo      | Descripción                                                                 |
| ---------------- | --------- | --------------------------------------------------------------------------- |
| `id`             | `INTEGER` | **Clave Primaria**. Identificador único autoincremental.                    |
| `client_id`      | `INTEGER` | **Clave Foránea** a `clients.id`. Cliente al que pertenece el ticket.       |
| `title`          | `TEXT`    | Título o resumen del problema. (Obligatorio)                                |
| `description`    | `TEXT`    | Descripción detallada del ticket.                                           |
| `status`         | `TEXT`    | Estado actual del ticket (ej. "Nuevo", "En Proceso", "Cerrado", "Facturar").|
| `priority`       | `TEXT`    | Prioridad del ticket (ej. "Baja", "Media", "Alta"). (Obligatorio)           |
| `amount`         | `REAL`    | Costo asociado al trabajo del ticket, si aplica.                            |
| `visit`          | `INTEGER` | Booleano (0 o 1) que indica si requiere una visita presencial.              |
| `annotations`    | `TEXT`    | Un campo JSON que almacena un array de notas o comentarios.                 |
| `attachments`    | `TEXT`    | Un campo JSON que almacena un array de rutas a archivos adjuntos.           |
| `audioNotes`     | `TEXT`    | Un campo JSON que almacena un array de rutas a notas de audio.              |
| `assigned_to`    | `TEXT`    | ID del usuario (de MongoDB) asignado al ticket.                             |
| `assigned_group` | `TEXT`    | ID del grupo (de MongoDB) asignado al ticket.                               |
| `createdAt`      | `DATETIME`| Fecha de creación (automática).                                             |
| `updatedAt`      | `DATETIME`| Fecha de última actualización (automática).                                 |

---

### Tabla: `contracts`

Almacena información sobre los contratos con los clientes.

| Columna        | Tipo      | Descripción                                                         |
| -------------- | --------- | ------------------------------------------------------------------- |
| `id`           | `INTEGER` | **Clave Primaria**. Identificador único.                            |
| `client_id`    | `INTEGER` | **Clave Foránea** a `clients.id`.                                   |
| `title`        | `TEXT`    | Nombre o título del contrato. (Obligatorio)                         |
| `description`  | `TEXT`    | Descripción de los términos del contrato.                           |
| `startDate`    | `DATE`    | Fecha de inicio del contrato.                                       |
| `endDate`      | `DATE`    | Fecha de finalización del contrato.                                 |
| `status`       | `TEXT`    | Estado del contrato (ej. "Activo", "Finalizado").                   |
| `amount`       | `REAL`    | Monto del contrato.                                                 |
| `currency`     | `TEXT`    | Moneda del monto (ej. "ARS", "UYU").                                |
| `sla`          | `TEXT`    | Acuerdo de Nivel de Servicio (SLA) asociado.                        |
| `contractType` | `TEXT`    | Tipo de contrato (ej. "Mantenimiento", "Proyecto").                 |
| `file_path`    | `TEXT`    | Ruta al archivo PDF del contrato escaneado.                         |
| `createdAt`    | `DATETIME`| Fecha de creación (automática).                                     |
| `updatedAt`    | `DATETIME`| Fecha de última actualización (automática).                         |

---

### Tabla: `budgets` (Presupuestos)

Contiene los presupuestos enviados a los clientes.

| Columna          | Tipo      | Descripción                                                               |
| ---------------- | --------- | ------------------------------------------------------------------------- |
| `id`             | `INTEGER` | **Clave Primaria**.                                                       |
| `client_id`      | `INTEGER` | **Clave Foránea** a `clients.id`.                                         |
| `title`          | `TEXT`    | Título del presupuesto. (Obligatorio)                                     |
| `description`    | `TEXT`    | Descripción general.                                                      |
| `amount`         | `REAL`    | Monto total del presupuesto.                                              |
| `status`         | `TEXT`    | Estado (ej. "Enviado", "Aprobado", "Rechazado").                          |
| `sections`       | `TEXT`    | Campo JSON que almacena un array de secciones y sus ítems.                |
| `file_path`      | `TEXT`    | Ruta a una imagen de portada o PDF asociado.                              |
| `assigned_to`    | `TEXT`    | ID del usuario (de MongoDB) asignado.                                     |
| `assigned_group` | `TEXT`    | ID del grupo (de MongoDB) asignado.                                       |
| `createdAt`      | `DATETIME`| Fecha de creación.                                                        |
| `updatedAt`      | `DATETIME`| Fecha de última actualización.                                            |

---

### Tabla: `budget_items`

Ítems individuales que componen un presupuesto.

| Columna       | Tipo      | Descripción                                         |
| ------------- | --------- | --------------------------------------------------- |
| `id`          | `INTEGER` | **Clave Primaria**.                                 |
| `budget_id`   | `INTEGER` | **Clave Foránea** a `budgets.id`.                   |
| `product_id`  | `INTEGER` | **Clave Foránea** opcional a `products.id`.         |
| `description` | `TEXT`    | Descripción del ítem. (Obligatorio)                 |
| `quantity`    | `REAL`    | Cantidad. (Obligatorio)                             |
| `unit_price`  | `REAL`    | Precio por unidad. (Obligatorio)                    |

---

### Tabla: `products`

Catálogo de productos y servicios que se pueden incluir en los presupuestos.

| Columna        | Tipo      | Descripción                                       |
| -------------- | --------- | ------------------------------------------------- |
| `id`           | `INTEGER` | **Clave Primaria**.                               |
| `name`         | `TEXT`    | Nombre del producto/servicio. (Obligatorio)       |
| `description`  | `TEXT`    | Descripción detallada.                            |
| `manufacturer` | `TEXT`    | Fabricante o marca. (Obligatorio)                 |
| `category`     | `TEXT`    | Categoría del producto.                           |
| `price_uyu`    | `REAL`    | Precio en Pesos Uruguayos.                        |
| `price_usd`    | `REAL`    | Precio en Dólares Americanos.                     |
| `badge`        | `TEXT`    | Etiqueta corta (ej. "Servicio", "Hardware").      |
| `image_url`    | `TEXT`    | URL a una imagen del producto.                    |
| `createdAt`    | `DATETIME`| Fecha de creación.                                |
| `updatedAt`    | `DATETIME`| Fecha de última actualización.                    |

---

### Tabla: `payments`

Registros de pagos recibidos.

| Columna       | Tipo      | Descripción                                            |
| ------------- | --------- | ------------------------------------------------------ |
| `id`          | `TEXT`    | **Clave Primaria**. Un ID único generado (ej. "PAY-XXXXXX"). |
| `invoice`     | `TEXT`    | Número de factura asociado. (Obligatorio)              |
| `ticket_id`   | `INTEGER` | **Clave Foránea** opcional a `tickets.id`.             |
| `ticket_title`| `TEXT`    | Título del ticket (denormalizado).                     |
| `client`      | `TEXT`    | Nombre del cliente (denormalizado). (Obligatorio)      |
| `client_id`   | `INTEGER` | **Clave Foránea** opcional a `clients.id`.             |
| `amount`      | `REAL`    | Monto del pago. (Obligatorio, > 0)                     |
| `status`      | `TEXT`    | Estado (ej. "Pendiente", "Pagado").                    |
| `method`      | `TEXT`    | Método de pago (ej. "Transferencia").                  |
| `note`        | `TEXT`    | Notas adicionales.                                     |
| `concept`     | `TEXT`    | Concepto del pago.                                     |
| `currency`    | `TEXT`    | Moneda (ej. "UYU", "USD").                             |
| `createdAt`   | `DATETIME`| Fecha del pago.                                        |

---

### Tabla: `repository`

Un repositorio genérico de información asociada a un cliente.

| Columna     | Tipo      | Descripción                                                            |
| ----------- | --------- | ---------------------------------------------------------------------- |
| `id`        | `INTEGER` | **Clave Primaria**.                                                    |
| `client_id` | `INTEGER` | **Clave Foránea** a `clients.id`.                                      |
| `name`      | `TEXT`    | Nombre del recurso (ej. "Router Principal"). (Obligatorio)             |
| `type`      | `TEXT`    | Tipo del recurso (ej. "Credencial", "Equipo"). (Obligatorio)           |
| `category`  | `TEXT`    | Categoría (ej. "Documento").                                           |
| `format`    | `TEXT`    | Formato o dato secundario (ej. MAC Address, número de serie).          |
| `credential`| `TEXT`    | Credencial o contraseña (debe usarse con precaución).                  |
| `notes`     | `TEXT`    | Comentarios o notas.                                                   |
| `content`   | `TEXT`    | Contenido principal, si aplica.                                        |
| `file_name` | `TEXT`    | Nombre de un archivo asociado.                                         |
| `createdAt` | `DATETIME`| Fecha de creación.                                                     |
| `updatedAt` | `DATETIME`| Fecha de última actualización.                                         |

---

### Tabla: `calendar_events`

Almacena eventos para el calendario, que pueden ser manuales o generados por otras entidades.

| Columna       | Tipo      | Descripción                                                              |
| ------------- | --------- | ------------------------------------------------------------------------ |
| `id`          | `INTEGER` | **Clave Primaria**.                                                      |
| `title`       | `TEXT`    | Título del evento. (Obligatorio)                                         |
| `start`       | `DATETIME`| Fecha y hora de inicio del evento.                                       |
| `end`         | `DATETIME`| Fecha y hora de fin del evento.                                          |
| `location`    | `TEXT`    | Ubicación del evento.                                                    |
| `source_type` | `TEXT`    | Origen del evento ('manual', 'ticket', 'payment', 'contract').           |
| `source_id`   | `TEXT`    | ID del objeto de origen (ej. el ID del ticket).                          |
| `locked`      | `INTEGER` | Booleano (0 o 1). Si está bloqueado, no se puede editar manualmente.     |
| `createdAt`   | `DATETIME`| Fecha de creación.                                                       |
| `updatedAt`   | `DATETIME`| Fecha de última actualización.                                           |

---

## 2. MongoDB: Base de Datos de la Aplicación

MongoDB se utiliza para datos que requieren más flexibilidad, escalabilidad o que están relacionados con la gestión de la propia aplicación, como usuarios y configuraciones.

### Colección: `users`

Gestiona las cuentas de usuario para acceder al sistema.

-   `_id`: `ObjectId` - Clave primaria.
-   `email`: `String` - Correo electrónico del usuario, usado para login. Es único.
-   `password`: `String` - Hash de la contraseña (usando bcrypt).
-   `name`: `String` - Nombre del usuario.
-   `role`: `String` - Rol del usuario (ej. "admin", "user").
-   `avatar`: `String` - Ruta al archivo de avatar del usuario.
-   `groupId`: `ObjectId` - ID del grupo al que pertenece el usuario (referencia a la colección `groups`).
-   `status`: `String` - Estado de la cuenta ('active', 'inactive').
-   `createdAt`: `Date` - Fecha de creación.
-   `updatedAt`: `Date` - Fecha de última modificación.

### Colección: `groups`

Agrupa a los usuarios en equipos.

-   `_id`: `ObjectId` - Clave primaria.
-   `name`: `String` - Nombre del grupo (ej. "Soporte Nivel 1").
-   `slug`: `String` - Identificador único para el grupo (ej. "soporte-n1").
-   `description`: `String` - Descripción del propósito del grupo.
-   `members`: `Array<ObjectId>` - Array de IDs de los usuarios que pertenecen al grupo.

### Colección: `sessions`

Utilizada por `express-session` para almacenar las sesiones de los usuarios. La estructura es gestionada por la librería `connect-mongo`.

### Colección: `audit_logs`

Registra eventos importantes que ocurren en el sistema para fines de auditoría.

-   `_id`: `ObjectId` - Clave primaria.
-   `timestamp`: `Date` - Fecha y hora del evento.
-   `user`: `String` - Email del usuario que realizó la acción (o "system").
-   `action`: `String` - Acción realizada (ej. "create", "update", "delete", "login").
-   `resource`: `String` - Recurso afectado (ej. "client", "ticket", "user").
-   `details`: `Object` - Objeto con detalles adicionales sobre el evento.
-   `ip`: `String` - Dirección IP desde la que se realizó la solicitud.

### Colección: `notifications`

Almacena un historial de las notificaciones enviadas.

-   `_id`: `ObjectId` - Clave primaria.
-   `createdAt`: `Date` - Fecha de envío.
-   `event`: `String` - ID del evento que disparó la notificación (ej. "ticket_created").
-   `channels`: `Array<String>` - Canales por los que se envió (ej. ["email", "slack"]).
-   `message`: `String` - Contenido del mensaje enviado.
-   `metadata`: `Object` - Datos adicionales asociados a la notificación.

### Colección: `configs`

Guarda configuraciones modulares del sistema.

-   `_id`: `ObjectId` - Clave primaria.
-   `module`: `String` - Nombre del módulo de configuración (ej. "notifications", "database"). Es único.
-   `data`: `Object` - Objeto JSON con la configuración específica del módulo.
-   `updatedAt`: `Date` - Fecha de última modificación.
