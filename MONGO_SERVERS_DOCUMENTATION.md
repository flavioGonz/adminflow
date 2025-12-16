# Sistema de Gestión de Múltiples Servidores MongoDB

Este sistema permite gestionar múltiples servidores MongoDB y cambiar entre ellos de forma segura, verificando y creando automáticamente las colecciones necesarias.

## Características

- ✅ Gestión de múltiples servidores MongoDB
- ✅ Cambio seguro entre servidores con verificación de colecciones
- ✅ Creación automática de colecciones faltantes
- ✅ Creación automática de índices
- ✅ Prueba de conexión antes de cambiar
- ✅ Visualización del estado de cada servidor
- ✅ Logs detallados del proceso de cambio

## Estructura de Archivos

```
server/
├── lib/
│   └── mongoServerManager.js      # Servicio principal de gestión
├── routes/
│   └── mongo-servers.js           # API REST para gestión de servidores
└── config/
    └── mongo-servers.json         # Configuración de servidores (se crea automáticamente)

client/
├── components/
│   └── mongo-servers-manager.tsx  # Componente React de interfaz
└── app/
    └── mongo-servers/
        └── page.tsx               # Página de gestión
```

## Instalación

1. El sistema se activa automáticamente al iniciar el servidor
2. Si no existe el archivo de configuración, se crea uno por defecto
3. Accede a la interfaz en: `http://localhost:3000/mongo-servers`

## Configuración de Servidores

### Formato del archivo `config/mongo-servers.json`

```json
{
  "currentServer": "local",
  "servers": [
    {
      "id": "local",
      "name": "Local Development",
      "host": "localhost",
      "port": 27017,
      "database": "adminflow",
      "uri": "mongodb://localhost:27017",
      "active": true,
      "description": "Servidor MongoDB local"
    },
    {
      "id": "produccion",
      "name": "Servidor de Producción",
      "host": "192.168.1.100",
      "port": 27017,
      "database": "adminflow_prod",
      "username": "admin",
      "password": "password123",
      "active": true,
      "description": "Servidor principal de producción"
    }
  ]
}
```

## Colecciones Requeridas

El sistema verifica y crea estas colecciones automáticamente:

- `users` - Usuarios del sistema
- `clients` - Clientes
- `tickets` - Tickets de soporte
- `budgets` - Presupuestos
- `budget_items` - Items de presupuestos
- `contracts` - Contratos
- `payments` - Pagos
- `products` - Productos
- `client_accesses` - Accesos de clientes
- `client_diagrams` - Diagramas de clientes
- `client_implementations` - Implementaciones
- `calendar_events` - Eventos de calendario
- `groups` - Grupos de usuarios
- `notifications` - Notificaciones
- `configurations` - Configuraciones del sistema
- `audit_logs` - Logs de auditoría
- `counters` - Contadores

## API Endpoints

### GET `/api/mongo-servers`
Obtiene la lista de todos los servidores configurados.

**Response:**
```json
{
  "success": true,
  "servers": [...],
  "currentServer": {...}
}
```

### GET `/api/mongo-servers/status`
Obtiene el estado de todos los servidores (conexión y colecciones).

**Response:**
```json
{
  "success": true,
  "status": [
    {
      "id": "local",
      "name": "Local Development",
      "connectionStatus": "online",
      "current": true,
      "collections": {
        "existing": ["users", "clients", ...],
        "missing": [],
        "complete": true
      }
    }
  ]
}
```

### POST `/api/mongo-servers`
Crea un nuevo servidor.

**Body:**
```json
{
  "id": "nuevo-servidor",
  "name": "Nuevo Servidor",
  "host": "localhost",
  "port": 27017,
  "database": "adminflow",
  "description": "Descripción opcional"
}
```

### POST `/api/mongo-servers/:id/test`
Prueba la conexión a un servidor.

**Response:**
```json
{
  "success": true,
  "message": "Conexión exitosa",
  "serverInfo": {
    "version": "6.0.0",
    "uptime": 12345
  }
}
```

### POST `/api/mongo-servers/:id/switch`
Cambia al servidor especificado.

**Body:**
```json
{
  "autoCreate": true,  // Crear colecciones faltantes automáticamente
  "forceCreate": false // Forzar recreación de colecciones
}
```

**Response:**
```json
{
  "success": true,
  "server": {...},
  "verification": {
    "existing": [...],
    "missing": [...],
    "complete": true
  },
  "log": [
    "🔄 Conectando a servidor...",
    "✅ Conexión establecida",
    "📋 Verificando colecciones...",
    "✅ Servidor cambiado exitosamente"
  ]
}
```

### POST `/api/mongo-servers/:id/verify`
Verifica las colecciones de un servidor sin cambiar a él.

### POST `/api/mongo-servers/:id/create-collections`
Crea las colecciones faltantes en un servidor.

### PUT `/api/mongo-servers/:id`
Actualiza la configuración de un servidor.

### DELETE `/api/mongo-servers/:id`
Elimina un servidor (no se puede eliminar el servidor activo).

## Uso desde la Interfaz Web

1. **Ver Servidores**: La tabla muestra todos los servidores configurados con su estado
2. **Agregar Servidor**: Click en "Agregar Servidor" y completa el formulario
3. **Probar Conexión**: Click en "Test" para verificar la conexión
4. **Cambiar Servidor**: Click en "Cambiar" para cambiar al servidor seleccionado
5. **Crear Colecciones**: Si faltan colecciones, click en "Crear" para crearlas
6. **Ver Logs**: Después de cambiar servidor, se muestran logs detallados del proceso

## Uso Programático

```javascript
const { getMongoServerManager } = require('./lib/mongoServerManager');

// Obtener el manager
const manager = getMongoServerManager();

// Agregar un servidor
manager.addServer({
  id: 'nuevo-servidor',
  name: 'Nuevo Servidor',
  host: 'localhost',
  port: 27017,
  database: 'adminflow'
});

// Probar conexión
const testResult = await manager.testConnection('nuevo-servidor');
console.log(testResult);

// Cambiar a un servidor
const switchResult = await manager.switchToServer('nuevo-servidor', {
  autoCreate: true
});

if (switchResult.success) {
  console.log('Servidor cambiado exitosamente');
  console.log(switchResult.log);
}

// Obtener estado de todos los servidores
const status = await manager.getServersStatus();
console.log(status);
```

## Seguridad

- ⚠️ El archivo `mongo-servers.json` contiene credenciales. **NO lo incluyas en el control de versiones**
- Añade `config/mongo-servers.json` a tu `.gitignore`
- Usa variables de entorno para producción cuando sea posible
- Restringe el acceso a las rutas de API con autenticación/autorización

## Proceso de Cambio de Servidor

1. **Conexión**: El sistema intenta conectar al servidor de destino
2. **Verificación**: Lista todas las colecciones existentes
3. **Comparación**: Compara con las colecciones requeridas
4. **Creación**: Si `autoCreate=true`, crea las colecciones faltantes
5. **Índices**: Crea los índices recomendados para cada colección
6. **Validación**: Verifica que todas las colecciones estén presentes
7. **Cambio**: Si todo es correcto, actualiza la configuración
8. **Reconexión**: Reconecta el cliente MongoDB de la aplicación

## Solución de Problemas

### Error: "Servidor no tiene todas las colecciones requeridas"
- Usa `autoCreate: true` al cambiar de servidor
- O crea las colecciones manualmente antes de cambiar

### Error: "No se puede eliminar el servidor activo"
- Primero cambia a otro servidor, luego elimina el deseado

### Error: "Conexión rechazada"
- Verifica que el servidor MongoDB esté en ejecución
- Verifica host, puerto y credenciales
- Verifica reglas de firewall

### Las colecciones se crean pero no tienen datos
- Este sistema solo crea la estructura, no migra datos
- Para migrar datos, usa herramientas como `mongodump` y `mongorestore`

## Ejemplos de Uso

### Desarrollo Local y Producción

```javascript
// Agregar servidor de producción
manager.addServer({
  id: 'produccion',
  name: 'Producción',
  host: 'prod.example.com',
  port: 27017,
  database: 'adminflow_prod',
  username: process.env.MONGO_PROD_USER,
  password: process.env.MONGO_PROD_PASS
});

// Cambiar a producción
await manager.switchToServer('produccion', { autoCreate: true });
```

### Múltiples Clientes

```javascript
// Cliente A
manager.addServer({
  id: 'cliente-a',
  name: 'Cliente A - Producción',
  host: 'cliente-a.example.com',
  database: 'adminflow_clienteA'
});

// Cliente B
manager.addServer({
  id: 'cliente-b',
  name: 'Cliente B - Producción',
  host: 'cliente-b.example.com',
  database: 'adminflow_clienteB'
});

// Cambiar entre clientes
await manager.switchToServer('cliente-a');
// ... trabajar con cliente A ...
await manager.switchToServer('cliente-b');
// ... trabajar con cliente B ...
```

## Índices Creados Automáticamente

El sistema crea índices optimizados para cada colección:

- **users**: email (único), createdAt
- **clients**: email (único), name, alias, contract, createdAt
- **tickets**: clientId, status, priority, createdAt
- **groups**: slug (único), name
- Y más...

## Contribuir

Para agregar nuevas colecciones al sistema:

1. Añade el nombre de la colección a `REQUIRED_COLLECTIONS` en `mongoServerManager.js`
2. Si necesitas índices, agrégalos a `COLLECTION_INDEXES`
3. El sistema los creará automáticamente en futuros cambios de servidor

## License

MIT
