# Base de datos de AdminFlow

## Arquitectura MongoDB-First

La aplicación utiliza **MongoDB como base de datos principal** para toda la operativa del sistema. SQLite se mantiene como opción de respaldo para compatibilidad legacy.

### 1. MongoDB (Primaria - Operativa)
*   **Ubicación:** Configurada en `.selected-db.json` (URI remota o local).
*   **Función:** Maneja toda la lógica core de la aplicación (Auth, CRUD de entidades, Configuraciones).
*   **Inicialización:** Se gestiona automáticamente con `npm run init-mongo`. Las colecciones y esquemas se crean al ejecutar el script.

#### Colecciones Principales

| Colección | Propósito | Campos principales |
| --- | --- | --- |
| `users` | Autenticación local. | `_id`, `email` (UNIQUE), `password` (bcrypt hash), `role`. |
| `clients` | Clientes del sistema. | `_id`, `name`, `alias`, `rut`, `email`, `phone`, `address`, `latitude`, `longitude`, `contract` (BOOL). |
| `tickets` | Gestión de incidencias. | `_id`, `clientId`, `title`, `status`, `priority`, `amount`, `visit`, `annotations` (Array), `description`, `attachments` (Array), `audioNotes` (Array). |
| `contracts` | Contratos de servicio. | `_id`, `clientId`, `title`, `description`, `responsibilities`, `recurrence`, `startDate`, `endDate`, `status`, `sla`, `contractType`, `amount`, `currency`, `filePath`. |
| `budgets` | Presupuestos generados. | `_id`, `clientId`, `title`, `description`, `amount`, `status`, `sections` (Array), `filePath`. |
| `budget_items` | Líneas de presupuesto. | `_id`, `budgetId`, `productId`, `description`, `quantity`, `unitPrice`. |
| `products` | Catálogo de servicios/productos. | `_id`, `name`, `description`, `manufacturer`, `category`, `priceUYU`, `priceUSD`, `badge`, `imageUrl`. |
| `payments` | Registro de pagos/cobros. | `_id`, `invoice`, `ticketId`, `clientId`, `amount`, `status`, `method`, `concept`, `currency`. |
| `client_accesses` | Credenciales y accesos por cliente. | `_id`, `clientId`, `equipo`, `tipo_equipo`, `ip`, `user`, `pass`, `serieMac`, `comentarios`. |
| `calendar_events` | Eventos de calendario. | `_id`, `title`, `location`, `start`, `end`, `sourceType`, `sourceId`, `locked`. |
| `notifications` | Historial de notificaciones. | `_id`, `event`, `message`, `channels`, `recipients`, `metadata`, `results`. |
| `configurations` | Configuraciones del sistema. | `_id`, `module`, `data`, `createdAt`, `updatedAt`. |
| `audit_logs` | Auditoría de acciones del sistema. | `_id`, `user`, `action`, `resource`, `details`, `status`, `ip`, `createdAt`. |

#### Características de MongoDB

Todas las colecciones incluyen:
- ✅ **Validación de esquema** JSON Schema para integridad de datos
- ✅ **Índices optimizados** para queries frecuentes
- ✅ **Timestamps automáticos** (`createdAt`, `updatedAt`)
- ✅ **IDs autoincrementales** mediante colección `counters`

### 2. SQLite (Opcional - Compatibilidad)
*   **Ubicación:** `server/database/database.sqlite`
*   **Función:** Respaldo opcional y compatibilidad con versiones antiguas.
*   **Uso:** Solo si se requiere compatibilidad legacy o desarrollo offline.

### Flujo de Datos
1.  **Escritura:** El usuario realiza una acción → Se escribe en **MongoDB**.
2.  **Lectura:** Todas las consultas se hacen directamente a **MongoDB**.
3.  **Validación:** MongoDB valida automáticamente los datos contra el esquema definido.
4.  **Índices:** Las consultas usan índices optimizados para máximo rendimiento.

### Configuración
El archivo `server/.selected-db.json` controla la conexión a MongoDB:
```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://host:port",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
```

### Inicialización Rápida

```bash
# 1. Configurar MongoDB URI en .selected-db.json
# 2. Inicializar base de datos
cd server
npm run init-mongo

# 3. (Opcional) Migrar datos de SQLite si existen
npm run migrate-to-mongo

# 4. Iniciar servidor
npm run dev
```

### Documentación Completa

Para guías detalladas de instalación, configuración, backup, seguridad y troubleshooting, consulta:

📚 **[README_MONGODB.md](server/database/README_MONGODB.md)** - Documentación completa de MongoDB

### Ventajas de MongoDB

- 🚀 **Escalabilidad** - Fácil de escalar horizontalmente
- 📊 **Consultas avanzadas** - Agregaciones potentes
- 🔄 **Replicación** - Alta disponibilidad nativa
- ☁️ **Cloud-ready** - Compatible con MongoDB Atlas
- 🔍 **Índices** - Búsquedas ultra-rápidas
- 📝 **Esquemas flexibles** - Adaptable a cambios

### Scripts Disponibles

```bash
npm run init-mongo        # Inicializar MongoDB
npm run migrate-to-mongo  # Migrar desde SQLite
npm run db:init           # Alias de init-mongo
npm run db:migrate        # Alias de migrate-to-mongo
```

### Soporte

Para problemas con MongoDB:
1. Verifica que MongoDB esté ejecutándose
2. Revisa la URI en `.selected-db.json`
3. Consulta `server/database/README_MONGODB.md`
4. Revisa los logs del servidor
