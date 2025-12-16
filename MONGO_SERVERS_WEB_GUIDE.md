# 🌐 Guía Rápida: Interfaz Web - Gestión de Servidores MongoDB

## 🚀 Acceso Rápido

### Desde el Sistema
1. Ve a **Sistema** en el menú principal
2. Click en el botón **Servidores MongoDB** en la barra superior

### Desde la Paleta de Comandos
1. Presiona `Ctrl+K` (Windows/Linux) o `Cmd+K` (Mac)
2. Escribe "servidores" o "mongodb"
3. Selecciona **Servidores MongoDB**

### Directamente
Accede a: `http://localhost:3000/mongo-servers`

---

## 📋 Funcionalidades de la Interfaz

### 1️⃣ Vista Principal
La interfaz muestra una tabla con todos tus servidores MongoDB configurados:

- **Nombre**: Identificación del servidor
- **Host**: Dirección IP y puerto
- **Base de Datos**: Nombre de la BD
- **Estado**: 
  - 🟢 **Online** - Servidor accesible
  - 🔴 **Offline** - Servidor no disponible
  - ⚠️ **Error** - Problema de conexión
- **Colecciones**:
  - ✅ **Completas** - Todas las colecciones presentes (17/17)
  - ⚠️ **Faltantes** - Algunas colecciones no existen
- **Actual**: Indica cuál servidor está activo

---

## ➕ Agregar Nuevo Servidor

1. Click en **"Agregar Servidor"** (esquina superior derecha)
2. Completa el formulario:
   - **ID único**: Identificador interno (ej: `produccion`, `dev-remoto`)
   - **Nombre**: Nombre descriptivo (ej: "Servidor de Producción")
   - **Host**: Dirección del servidor (ej: `192.168.1.100`)
   - **Puerto**: Puerto MongoDB (default: `27017`)
   - **Base de datos**: Nombre de la BD (default: `adminflow`)
   - **Usuario** (opcional): Usuario de autenticación
   - **Contraseña** (opcional): Contraseña de autenticación
   - **Descripción** (opcional): Notas adicionales
3. Click en **"Agregar Servidor"**

---

## 🔄 Cambiar de Servidor

### Cambio Seguro (Recomendado)

1. Verifica el estado del servidor destino
2. Si faltan colecciones, el sistema mostrará un botón **"Crear"**
3. Click en **"Cambiar"** en el servidor deseado
4. Confirma la acción
5. El sistema:
   - ✅ Conecta al nuevo servidor
   - ✅ Verifica las 17 colecciones requeridas
   - ✅ Crea las colecciones faltantes automáticamente
   - ✅ Crea índices optimizados
   - ✅ Actualiza la conexión de la aplicación
6. Verás un log detallado del proceso

### ⚠️ Importante
- La aplicación se reconectará automáticamente al nuevo servidor
- Los datos NO se migran automáticamente entre servidores
- Solo se verifica y crea la estructura de colecciones

---

## 🧪 Probar Conexión

Antes de cambiar a un servidor, puedes probar la conexión:

1. Click en **"Test"** en la fila del servidor
2. Verás un mensaje con:
   - ✅ Estado de la conexión
   - 📊 Versión de MongoDB
   - ⏱️ Uptime del servidor

---

## 📦 Crear Colecciones Faltantes

Si un servidor muestra colecciones faltantes:

1. Click en el botón **"Crear"** (junto al badge rojo)
2. Confirma la acción
3. El sistema creará las colecciones faltantes con sus índices

---

## ✏️ Editar Servidor

1. Click en el icono de **edición** (lápiz) en la fila del servidor
2. Modifica los datos necesarios
3. Click en **"Guardar Cambios"**

---

## 🗑️ Eliminar Servidor

1. Click en el icono de **eliminación** (papelera) en la fila del servidor
2. Confirma la acción

**⚠️ No puedes eliminar el servidor activo**. Primero cambia a otro servidor.

---

## 🔍 Detalles del Proceso de Cambio

Cuando cambias de servidor, verás un log en tiempo real:

```
🔄 Conectando a servidor: Producción (192.168.1.100:27017)
✅ Conexión establecida
📋 Verificando colecciones en base de datos: adminflow_prod
  📊 Total de colecciones: 15
  ✅ Colecciones requeridas presentes: 15
  ⚠️ Colecciones faltantes: 2
    - audit_logs
    - counters
🔧 Creando colecciones faltantes...
  ✅ Colecciones creadas: 2
✅ Servidor cambiado exitosamente a: Producción
```

---

## 💡 Casos de Uso Comunes

### Desarrollo Local → Producción
```
1. Trabaja en tu servidor local mientras desarrollas
2. Cuando estés listo, cambia a "Producción"
3. La app se conecta al servidor productivo
4. Cambia de vuelta a "Local" para seguir desarrollando
```

### Múltiples Clientes
```
1. Configura un servidor para cada cliente
2. Cambia entre ellos según con quién estés trabajando
3. Cada cliente tiene sus datos aislados en su propia BD
```

### Testing
```
1. Crea un servidor "Testing" o "Staging"
2. Cambia a él para probar cambios sin afectar producción
3. Si algo sale mal, vuelve a "Producción" fácilmente
```

---

## 🔐 Seguridad

- El archivo de configuración `server/config/mongo-servers.json` contiene las credenciales
- Este archivo está en `.gitignore` y NO se sube al repositorio
- Asegúrate de hacer backup manual de este archivo

---

## 📊 Colecciones Gestionadas (17)

El sistema verifica y crea estas colecciones:

✅ `users` - Usuarios del sistema  
✅ `clients` - Clientes  
✅ `tickets` - Tickets de soporte  
✅ `budgets` - Presupuestos  
✅ `budget_items` - Items de presupuestos  
✅ `contracts` - Contratos  
✅ `payments` - Pagos  
✅ `products` - Productos  
✅ `client_accesses` - Accesos de clientes  
✅ `client_diagrams` - Diagramas  
✅ `client_implementations` - Implementaciones  
✅ `calendar_events` - Eventos de calendario  
✅ `groups` - Grupos de usuarios  
✅ `notifications` - Notificaciones  
✅ `configurations` - Configuraciones  
✅ `audit_logs` - Logs de auditoría  
✅ `counters` - Contadores  

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa con mis datos al cambiar de servidor?
Los datos permanecen en cada servidor. El cambio solo modifica a qué servidor se conecta tu aplicación.

### ¿Puedo tener el mismo servidor configurado dos veces?
Sí, pero necesitas IDs diferentes. Útil para tener configuraciones de conexión alternativas.

### ¿Qué pasa si el servidor destino no está disponible?
El cambio fallará y tu aplicación seguirá conectada al servidor actual.

### ¿Se migran los datos automáticamente?
No. Solo se crea la estructura (colecciones e índices). Para migrar datos, usa herramientas como `mongodump`/`mongorestore`.

### ¿Puedo usar esto en producción?
Sí, pero ten cuidado al cambiar servidores. Asegúrate de probar la conexión primero.

---

## 🎨 Indicadores Visuales

### Estados de Conexión
- 🟢 **Verde (Online)**: Servidor disponible y funcionando
- 🔴 **Rojo (Offline)**: Servidor no accesible
- ⚠️ **Amarillo (Error)**: Problema de conexión o configuración

### Colecciones
- 🟢 **Verde con check**: Todas las colecciones presentes
- 🔴 **Rojo con alerta**: Faltan colecciones (click en "Crear")

### Servidor Actual
- 🎯 **Badge azul "Activo"**: Este es el servidor en uso

---

## 🔄 Actualizar Estado

Para ver el estado actualizado de todos los servidores:

1. Click en **"Actualizar Estado"** (botón con icono de recarga)
2. El sistema verificará:
   - Conectividad de cada servidor
   - Colecciones presentes/faltantes
   - Estado general

---

## 🎯 Flujo de Trabajo Recomendado

```
1. Agregar Servidor
   ↓
2. Probar Conexión (Test)
   ↓
3. Verificar Colecciones
   ↓
4. Crear Colecciones Faltantes (si es necesario)
   ↓
5. Cambiar Servidor
   ↓
6. Revisar Log de Cambio
   ↓
7. ✅ ¡Listo para trabajar!
```

---

**¿Necesitas más ayuda?** Consulta la [documentación completa](./MONGO_SERVERS_DOCUMENTATION.md)
