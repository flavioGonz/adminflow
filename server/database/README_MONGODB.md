# MongoDB - Base de Datos Principal de AdminFlow

## 🎯 Arquitectura

**AdminFlow usa MongoDB como base de datos principal** para toda la operativa del sistema.

### Ventajas de MongoDB:
- ✅ **Escalabilidad horizontal** - Fácil de escalar con sharding
- ✅ **Esquemas flexibles** - Adaptable a cambios de estructura
- ✅ **Alto rendimiento** - Optimizado para lecturas/escrituras rápidas
- ✅ **Consultas avanzadas** - Agregaciones potentes
- ✅ **Replicación nativa** - Alta disponibilidad
- ✅ **Cloud-ready** - Compatible con MongoDB Atlas

---

## 🚀 Inicio Rápido

### **1. Instalar MongoDB**

#### Windows:
```bash
# Descargar desde: https://www.mongodb.com/try/download/community
# O usar Chocolatey:
choco install mongodb
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Docker:
```bash
docker run -d -p 27017:27017 --name adminflow-mongo \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:5.6
```

### **2. Configurar Conexión**

Edita `server/.selected-db.json`:

```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb://localhost:27017",
  "mongoDb": "adminflow",
  "sqlitePath": "database/database.sqlite"
}
```

O usa variables de entorno en `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=adminflow
```

### **3. Inicializar Base de Datos**

```bash
cd server
npm run init-mongo
```

Este comando:
- ✅ Crea todas las colecciones necesarias
- ✅ Aplica esquemas de validación
- ✅ Crea índices optimizados
- ✅ Inserta usuario admin por defecto
- ✅ Crea configuraciones iniciales

### **4. (Opcional) Migrar Datos de SQLite**

Si tienes datos en SQLite:

```bash
npm run migrate-to-mongo
```

### **5. Iniciar Servidor**

```bash
npm run dev
```

---

## 📊 Estructura de Colecciones

### **Colecciones Principales**

| Colección | Descripción | Documentos Típicos |
|-----------|-------------|-------------------|
| `users` | Usuarios del sistema | ~10-100 |
| `clients` | Clientes | ~100-10,000 |
| `tickets` | Incidencias | ~1,000-100,000 |
| `budgets` | Presupuestos | ~100-10,000 |
| `budget_items` | Items de presupuestos | ~500-50,000 |
| `contracts` | Contratos | ~50-5,000 |
| `payments` | Pagos | ~500-50,000 |
| `products` | Catálogo de productos | ~50-1,000 |
| `client_accesses` | Credenciales de acceso | ~200-20,000 |
| `calendar_events` | Eventos de calendario | ~500-50,000 |
| `notifications` | Historial de notificaciones | ~1,000-100,000 |
| `configurations` | Configuraciones del sistema | ~10-50 |
| `audit_logs` | Logs de auditoría | ~10,000-1,000,000 |

### **Colecciones de Soporte**

| Colección | Descripción |
|-----------|-------------|
| `counters` | Contadores para IDs autoincrementales |
| `sessions` | Sesiones de usuario (opcional) |

---

## 🔍 Esquemas de Validación

Cada colección tiene un esquema JSON Schema que valida:
- ✅ Tipos de datos correctos
- ✅ Campos requeridos
- ✅ Formatos específicos
- ✅ Valores permitidos

Ejemplo de esquema para `clients`:

```javascript
{
  bsonType: "object",
  required: ["_id", "name", "createdAt"],
  properties: {
    _id: { bsonType: "int" },
    name: { bsonType: "string" },
    email: { bsonType: ["string", "null"] },
    contract: { bsonType: "bool" },
    latitude: { bsonType: ["double", "null"] },
    longitude: { bsonType: ["double", "null"] },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" }
  }
}
```

---

## 🚀 Índices Optimizados

### **Índices por Colección**

#### `clients`
```javascript
{ email: 1 } // Único, para búsqueda rápida
{ name: 1 }  // Para ordenamiento
{ contract: 1 } // Para filtrar clientes con contrato
{ createdAt: -1 } // Para ordenar por fecha
```

#### `tickets`
```javascript
{ clientId: 1 } // Para obtener tickets de un cliente
{ status: 1 } // Para filtrar por estado
{ priority: 1 } // Para filtrar por prioridad
{ createdAt: -1 } // Para ordenar por fecha
{ clientId: 1, status: 1 } // Compuesto para queries comunes
```

#### `payments`
```javascript
{ clientId: 1 }
{ ticketId: 1 }
{ status: 1 }
{ createdAt: -1 }
```

---

## 💾 Backup y Restauración

### **Backup Manual**

```bash
# Backup completo
mongodump --uri="mongodb://localhost:27017" --db=adminflow --out=./backup

# Backup de una colección específica
mongodump --uri="mongodb://localhost:27017" --db=adminflow --collection=clients --out=./backup
```

### **Restauración**

```bash
# Restaurar completo
mongorestore --uri="mongodb://localhost:27017" --db=adminflow ./backup/adminflow

# Restaurar colección específica
mongorestore --uri="mongodb://localhost:27017" --db=adminflow --collection=clients ./backup/adminflow/clients.bson
```

### **Backup Automático (Recomendado)**

Crea un script en `server/scripts/backup-mongo.js`:

```javascript
const { exec } = require('child_process');
const path = require('path');

const timestamp = new Date().toISOString().replace(/:/g, '-');
const backupPath = path.join(__dirname, `../backups/mongo-${timestamp}`);

exec(`mongodump --uri="mongodb://localhost:27017" --db=adminflow --out=${backupPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error en backup:', error);
    return;
  }
  console.log('✅ Backup completado:', backupPath);
});
```

Agregar a crontab (Linux/Mac):
```bash
# Backup diario a las 2 AM
0 2 * * * cd /path/to/adminflow/server && node scripts/backup-mongo.js
```

---

## 🔒 Seguridad

### **1. Autenticación**

Crear usuario admin en MongoDB:

```javascript
use admin
db.createUser({
  user: "adminflow_admin",
  pwd: "tu_password_seguro",
  roles: [
    { role: "readWrite", db: "adminflow" },
    { role: "dbAdmin", db: "adminflow" }
  ]
})
```

Actualizar URI en `.selected-db.json`:
```json
{
  "mongoUri": "mongodb://adminflow_admin:tu_password_seguro@localhost:27017/adminflow"
}
```

### **2. Conexión Segura (TLS/SSL)**

```json
{
  "mongoUri": "mongodb://user:pass@host:27017/adminflow?ssl=true&authSource=admin"
}
```

### **3. Restricción de IP**

En MongoDB config (`/etc/mongod.conf`):
```yaml
net:
  bindIp: 127.0.0.1,192.168.1.100
```

---

## 📈 Monitoreo

### **Estadísticas de Colecciones**

```javascript
// En MongoDB shell
use adminflow
db.clients.stats()
db.tickets.stats()
```

### **Queries Lentas**

```javascript
// Habilitar profiling
db.setProfilingLevel(1, { slowms: 100 })

// Ver queries lentas
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### **Uso de Índices**

```javascript
// Ver si una query usa índices
db.tickets.find({ clientId: 123 }).explain("executionStats")
```

---

## 🛠️ Mantenimiento

### **Compactar Base de Datos**

```javascript
use adminflow
db.runCommand({ compact: 'clients' })
```

### **Reconstruir Índices**

```javascript
db.clients.reIndex()
```

### **Limpiar Logs Antiguos**

```javascript
// Eliminar audit_logs mayores a 90 días
db.audit_logs.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})
```

---

## 🌐 MongoDB Atlas (Cloud)

### **1. Crear Cluster**

1. Ir a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cuenta gratuita
3. Crear cluster (M0 gratis)
4. Configurar usuario y contraseña
5. Whitelist IP (0.0.0.0/0 para desarrollo)

### **2. Obtener Connection String**

```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/adminflow?retryWrites=true&w=majority
```

### **3. Actualizar Configuración**

```json
{
  "engine": "mongodb",
  "mongoUri": "mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/adminflow?retryWrites=true&w=majority",
  "mongoDb": "adminflow"
}
```

### **4. Inicializar**

```bash
npm run init-mongo
```

---

## 🐛 Troubleshooting

### **Error: "MongoServerError: Authentication failed"**

**Solución:**
- Verifica usuario y contraseña en la URI
- Asegúrate de que el usuario tenga permisos en la BD

### **Error: "MongoNetworkError: connect ECONNREFUSED"**

**Solución:**
- Verifica que MongoDB esté ejecutándose: `sudo systemctl status mongod`
- Verifica el puerto en la URI (por defecto 27017)

### **Error: "MongoServerError: not authorized"**

**Solución:**
- El usuario no tiene permisos suficientes
- Otorga rol `readWrite` al usuario

### **Queries muy lentas**

**Solución:**
- Verifica que existan índices: `db.collection.getIndexes()`
- Analiza el query plan: `.explain("executionStats")`
- Crea índices faltantes

---

## 📚 Recursos

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Cursos gratis
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI oficial
- [Studio 3T](https://studio3t.com/) - IDE avanzado

---

## 🔄 Migración desde SQLite

Si vienes de SQLite, el script de migración maneja:

- ✅ Conversión de tipos de datos
- ✅ Mapeo de IDs autoincrementales
- ✅ Conversión de JSON strings a objetos
- ✅ Conversión de fechas
- ✅ Preservación de relaciones

```bash
npm run migrate-to-mongo
```

---

## 💡 Tips de Rendimiento

1. **Usa proyecciones** - No traigas campos innecesarios
   ```javascript
   db.clients.find({}, { name: 1, email: 1 })
   ```

2. **Limita resultados** - Usa paginación
   ```javascript
   db.tickets.find().limit(20).skip(40)
   ```

3. **Usa índices compuestos** - Para queries frecuentes
   ```javascript
   db.tickets.createIndex({ clientId: 1, status: 1 })
   ```

4. **Evita $where** - Usa operadores nativos
   ```javascript
   // ❌ Lento
   db.clients.find({ $where: "this.name.length > 10" })
   
   // ✅ Rápido
   db.clients.find({ name: { $regex: /.{10,}/ } })
   ```

5. **Usa agregaciones** - Para cálculos complejos
   ```javascript
   db.tickets.aggregate([
     { $match: { status: "Resuelto" } },
     { $group: { _id: "$clientId", total: { $sum: 1 } } }
   ])
   ```

---

**¿Preguntas?** Consulta la [documentación oficial de MongoDB](https://docs.mongodb.com/) o abre un issue en GitHub.
