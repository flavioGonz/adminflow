# 🔄 Sistema de Gestión de Múltiples Servidores MongoDB

## ✨ Características Principales

- ✅ **Múltiples Servidores**: Gestiona varios servidores MongoDB desde una interfaz centralizada
- ✅ **Cambio Seguro**: Verifica y crea colecciones automáticamente antes de cambiar
- ✅ **Interfaz Web**: UI intuitiva para administrar servidores
- ✅ **CLI Tool**: Herramienta de línea de comandos para gestión rápida
- ✅ **API REST**: Endpoints completos para integración programática
- ✅ **Verificación Automática**: Valida 17 colecciones requeridas
- ✅ **Creación de Índices**: Crea índices optimizados automáticamente

## 🚀 Inicio Rápido

### 1. Acceder a la interfaz web
```
http://localhost:3000/mongo-servers
```

### 2. Usar la CLI

```bash
# Ver servidores configurados
node server/mongo-cli.js list

# Ver estado de todos los servidores
node server/mongo-cli.js status

# Agregar un nuevo servidor
node server/mongo-cli.js add produccion "Servidor Producción" \
  --host=192.168.1.100 \
  --port=27017 \
  --database=adminflow_prod

# Probar conexión
node server/mongo-cli.js test produccion

# Cambiar a otro servidor
node server/mongo-cli.js switch produccion

# Verificar colecciones
node server/mongo-cli.js verify produccion

# Crear colecciones faltantes
node server/mongo-cli.js create produccion
```

## 📁 Archivos Creados

```
server/
├── lib/
│   └── mongoServerManager.js      # ⭐ Servicio principal
├── routes/
│   └── mongo-servers.js           # 🌐 API REST
├── config/
│   ├── mongo-servers.json         # ⚙️ Configuración (auto-generado)
│   └── mongo-servers.json.example # 📝 Ejemplo
└── mongo-cli.js                   # 🔧 Herramienta CLI

client/
├── components/
│   └── mongo-servers-manager.tsx  # 🎨 Componente React
└── app/
    └── mongo-servers/
        └── page.tsx               # 📄 Página de gestión
```

## 📚 Documentación

Ver [MONGO_SERVERS_DOCUMENTATION.md](./MONGO_SERVERS_DOCUMENTATION.md) para documentación completa.

## 🔐 Seguridad

⚠️ **IMPORTANTE**: El archivo `server/config/mongo-servers.json` contiene credenciales y está en `.gitignore`. No lo incluyas en el control de versiones.

## 🎯 Casos de Uso

### Desarrollo Local + Producción
```bash
# Trabajar localmente
node server/mongo-cli.js switch local

# Cambiar a producción
node server/mongo-cli.js switch produccion
```

### Múltiples Clientes
```bash
# Cliente A
node server/mongo-cli.js switch cliente-a

# Cliente B
node server/mongo-cli.js switch cliente-b
```

## 🔧 API Endpoints

- `GET /api/mongo-servers` - Listar servidores
- `GET /api/mongo-servers/status` - Estado de todos los servidores
- `POST /api/mongo-servers` - Crear servidor
- `PUT /api/mongo-servers/:id` - Actualizar servidor
- `DELETE /api/mongo-servers/:id` - Eliminar servidor
- `POST /api/mongo-servers/:id/test` - Probar conexión
- `POST /api/mongo-servers/:id/switch` - Cambiar servidor
- `POST /api/mongo-servers/:id/verify` - Verificar colecciones
- `POST /api/mongo-servers/:id/create-collections` - Crear colecciones

## 📦 Colecciones Gestionadas (17)

- `users` - Usuarios del sistema
- `clients` - Clientes
- `tickets` - Tickets de soporte
- `budgets` - Presupuestos
- `budget_items` - Items de presupuestos
- `contracts` - Contratos
- `payments` - Pagos
- `products` - Productos
- `client_accesses` - Accesos
- `client_diagrams` - Diagramas
- `client_implementations` - Implementaciones
- `calendar_events` - Eventos
- `groups` - Grupos
- `notifications` - Notificaciones
- `configurations` - Configuraciones
- `audit_logs` - Logs de auditoría
- `counters` - Contadores

## 💡 Ejemplo de Uso Programático

```javascript
const { getMongoServerManager } = require('./lib/mongoServerManager');

// Obtener el manager
const manager = getMongoServerManager();

// Cambiar a un servidor
const result = await manager.switchToServer('produccion', {
  autoCreate: true  // Crear colecciones faltantes automáticamente
});

if (result.success) {
  console.log('✅ Servidor cambiado exitosamente');
  result.log.forEach(line => console.log(line));
}
```

## 🎨 Interfaz Web

La interfaz web proporciona:
- 📊 Vista de todos los servidores con estado en tiempo real
- ✅ Indicador de servidor actual
- 🔍 Verificación de colecciones
- ⚡ Cambio de servidor con un click
- 📝 Creación/edición/eliminación de servidores
- 🧪 Prueba de conexión
- 📋 Logs detallados del proceso

## 🛠️ Comandos CLI Disponibles

| Comando | Descripción |
|---------|-------------|
| `list` | Listar todos los servidores |
| `status` | Ver estado de todos los servidores |
| `add` | Agregar un nuevo servidor |
| `remove` | Eliminar un servidor |
| `test` | Probar conexión a un servidor |
| `switch` | Cambiar al servidor especificado |
| `verify` | Verificar colecciones de un servidor |
| `create` | Crear colecciones faltantes |
| `current` | Ver servidor actual |
| `help` | Mostrar ayuda |

## 📋 Proceso de Cambio de Servidor

1. 🔌 **Conexión** - Se conecta al servidor de destino
2. 🔍 **Verificación** - Lista todas las colecciones existentes
3. ⚖️ **Comparación** - Compara con las colecciones requeridas
4. ➕ **Creación** - Crea las colecciones faltantes (si autoCreate=true)
5. 📑 **Índices** - Crea los índices recomendados
6. ✅ **Validación** - Verifica que todo esté correcto
7. 🔄 **Cambio** - Actualiza la configuración
8. 🔌 **Reconexión** - Reconecta el cliente de la aplicación

## ⚠️ Solución de Problemas

### "Servidor no tiene todas las colecciones requeridas"
→ Usa `autoCreate: true` al cambiar de servidor

### "No se puede eliminar el servidor activo"
→ Primero cambia a otro servidor

### "Conexión rechazada"
→ Verifica host, puerto, credenciales y firewall

## 🚦 Estado del Sistema

Después de implementar este sistema, verás:

- ✅ Archivo de configuración auto-generado en `server/config/`
- ✅ Interfaz web accesible en `/mongo-servers`
- ✅ CLI funcional con `node server/mongo-cli.js`
- ✅ API REST disponible en `/api/mongo-servers`
- ✅ Logs detallados en consola del servidor

---

**Creado para AdminFlow** | Ver [Documentación Completa](./MONGO_SERVERS_DOCUMENTATION.md)
