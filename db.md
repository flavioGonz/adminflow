# Base de datos de AdminFlow

## Arquitectura Híbrida

La aplicación utiliza una arquitectura de base de datos **híbrida**, donde **SQLite es la fuente de verdad principal** para la operativa diaria, y **MongoDB actúa como capa secundaria** para sincronización, respaldo y consultas avanzadas.

### 1. SQLite (Primaria - Operativa)
*   **Ubicación:** `server/database/database.sqlite`
*   **Función:** Maneja toda la lógica core de la aplicación (Auth, CRUD de entidades, Sesiones).
*   **Inicialización:** Se gestiona en `server/db.js`. Las tablas se crean automáticamente al inicio si no existen.

#### Tablas y Estructura

| Tabla | Propósito | Campos principales |
| --- | --- | --- |
| `users` | Autenticación local. | `id`, `email` (UNIQUE), `password` (bcrypt hash). |
| `sessions` | Sesiones de usuario. | `sid` PK, `sess` JSON, `expired`. Store de `express-session`. |
| `clients` | Clientes del sistema. | `id`, `name`, `alias`, `rut`, `email`, `phone`, `address`, `latitude`, `longitude`, `contract` (BOOL), `notifications_enabled` (BOOL). |
| `repository` | Datos técnicos por cliente. | `id`, `client_id` FK, `equipo`, `usuario`, `password`, `mac_serie`, `comentarios`, `name`, `type`, `category`, `format`, `credential`, `notes`, `content`, `file_name`. |
| `tickets` | Gestión de incidencias. | `id`, `client_id` FK, `title`, `status`, `priority`, `amount`, `visit`, `annotations` (JSON), `description`, `attachments` (JSON), `audioNotes` (JSON). |
| `contracts` | Contratos de servicio. | `id`, `client_id` FK, `title`, `description`, `responsibilities`, `recurrence`, `startDate`, `endDate`, `status`, `sla`, `contractType`, `amount`, `currency`, `file_path`. |
| `budgets` | Presupuestos generados. | `id`, `client_id` FK, `title`, `description`, `amount`, `status`, `sections` (JSON), `file_path`. |
| `budget_items` | Líneas de presupuesto. | `id`, `budget_id` FK, `product_id` FK, `description`, `quantity`, `unit_price`. |
| `products` | Catálogo de servicios/productos. | `id`, `name`, `description`, `manufacturer`, `category`, `price_uyu`, `price_usd`, `badge`, `image_url`. |
| `payments` | Registro de pagos/cobros. | `id` (UUID string), `invoice`, `ticket_id`, `client_id`, `amount`, `status`, `method`, `concept`, `currency`. |
| `calendar_events` | Eventos de calendario. | `id`, `title`, `location`, `start`, `end`, `source_type`, `source_id`, `locked`. |
| `sync_events` | Cola de eventos de sincronización. | `id`, `collection`, `payload` (JSON). Usado para reintentos de sync. |
| `audit_logs` | Auditoría de acciones del sistema. | `id`, `user`, `action`, `resource`, `details` (JSON), `status`, `ip`, `createdAt`. |

### 2. MongoDB (Secundaria - Sincronización)
*   **Ubicación:** Definida en `.selected-db.json` (URI remota).
*   **Función:** Respaldo de datos, analítica y fuente para módulos específicos (ej. `/api/users/registered`).
*   **Sincronización:** El sistema intenta replicar los cambios de SQLite a MongoDB en segundo plano mediante `syncLocalToMongo`.

#### Colecciones
Las colecciones en MongoDB son un espejo de las tablas de SQLite, con los tipos de datos normalizados (fechas como objetos `Date`, JSONs parseados).

*   `users`, `clients`, `tickets`, `payments`, `contracts`, `budgets`, `products`, `repository`, `audit_logs`, `notifications`.
*   `client_accesses`: **(NUEVO)** Colección nativa de Mongo para guardar credenciales y accesos.
    *   `_id`: ObjectId
    *   `clientId`: String (ID del cliente de SQLite, almacenado como string)
    *   `equipo`: String
    *   `tipo_equipo`: String (router, switch, servidor, firewall, etc.)
    *   `ip`: String
    *   `user`: String
    *   `pass`: String (Texto plano por diseño del repositorio)
    *   `comentarios`: String
    *   `createdAt`: Date
    *   `updatedAt`: Date

### Flujo de Datos
1.  **Escritura:** El usuario realiza una acción -> Se escribe en **SQLite**.
2.  **Sync:** Un proceso en segundo plano o trigger detecta el cambio y lo envía a **MongoDB**.
3.  **Lectura:** 
    *   La mayoría de la UI lee de **SQLite**.
    *   Reportes avanzados o módulos específicos pueden leer de **MongoDB**.

### Configuración
El archivo `server/.selected-db.json` controla la conexión a MongoDB:
```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://host:port/db",
  "mongoDb": "adminflow",
  "sqlitePath": "ruta/a/database.sqlite"
}
```
*Nota: Aunque `engine` diga "mongodb", SQLite siempre está activo como base operativa.*
