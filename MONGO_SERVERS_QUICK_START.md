# 🔄 Sistema de Cambio de Servidores MongoDB

## ✅ ¿Qué hace?

Te permite **cambiar entre diferentes servidores MongoDB** desde una interfaz web, con verificación automática de colecciones.

---

## 🌐 Cómo Acceder

### Opción 1: Desde Sistema
1. Ve a **Sistema** en el menú
2. Click en **"Servidores MongoDB"**

### Opción 2: Paleta de Comandos
1. Presiona `Ctrl+K`
2. Escribe "servidores"
3. Enter

### Opción 3: Directamente
```
http://localhost:3000/mongo-servers
```

---

## 🚀 Uso Rápido

### 1. Agregar un Servidor
```
1. Click "Agregar Servidor"
2. Completa:
   - ID: produccion
   - Nombre: Servidor Producción
   - Host: 192.168.1.100
   - Puerto: 27017
   - Base de datos: adminflow
3. Guardar
```

### 2. Cambiar de Servidor
```
1. Click "Test" para verificar conexión
2. Click "Cambiar" en el servidor deseado
3. Confirmar
4. ✅ ¡Listo! La app ahora usa el nuevo servidor
```

### 3. Si Faltan Colecciones
```
El sistema lo detecta y muestra:
⚠️ 2 faltantes

1. Click "Crear"
2. Se crean automáticamente las 17 colecciones requeridas
```

---

## 📦 Lo Que Hace Automáticamente

✅ Verifica 17 colecciones requeridas  
✅ Crea las que faltan  
✅ Crea índices optimizados  
✅ Reconecta la aplicación al nuevo servidor  
✅ Muestra log detallado del proceso  

---

## 🎯 Casos de Uso

**Desarrollo ↔ Producción**
```
Trabaja local → Click "Cambiar" a Producción → Listo
```

**Múltiples Clientes**
```
Cliente A → Click "Cambiar" a Cliente B → Listo
```

**Testing**
```
Producción → Click "Cambiar" a Testing → Prueba → Vuelve a Producción
```

---

## ⚠️ Importante

- ❌ **NO migra datos** entre servidores (solo crea estructura)
- ✅ Los datos permanecen en cada servidor
- ✅ Puedes volver al servidor anterior cuando quieras
- ✅ No se puede eliminar el servidor activo

---

## 📊 Interfaz

La tabla muestra:

| Columna | Descripción |
|---------|-------------|
| **Nombre** | Identificación del servidor |
| **Host** | IP:Puerto del servidor |
| **Estado** | 🟢 Online / 🔴 Offline |
| **Colecciones** | ✅ 17/17 o ⚠️ Faltantes |
| **Actual** | 🎯 Servidor en uso |
| **Acciones** | Test, Cambiar, Editar, Eliminar |

---

## 🔄 Proceso al Cambiar

```
1. 🔌 Conecta al nuevo servidor
2. 🔍 Verifica las 17 colecciones
3. ➕ Crea las faltantes (si autoCreate=true)
4. 📑 Crea índices
5. ✅ Cambia la conexión
6. 📋 Muestra log
```

---

## 📁 Archivos Importantes

```
server/
├── lib/mongoServerManager.js     ⭐ Servicio principal
├── routes/mongo-servers.js       🌐 API REST
└── config/mongo-servers.json     ⚙️ Config (auto-generado)

client/
├── components/mongo-servers-manager.tsx  🎨 Interfaz web
└── app/mongo-servers/page.tsx            📄 Página
```

---

## 🛡️ Seguridad

⚠️ **Importante**: 
- `mongo-servers.json` contiene credenciales
- Ya está en `.gitignore`
- ❌ NO commitear al repositorio
- ✅ Hacer backup manual

---

## 💡 Tips

✅ **Probar primero**: Usa "Test" antes de cambiar  
✅ **Verificar colecciones**: Mira el estado antes de cambiar  
✅ **Crear faltantes**: Click en "Crear" si ves ⚠️  
✅ **Ver logs**: Revisa el log después de cambiar  

---

## 🎉 ¡Y eso es todo!

Interfaz simple para cambiar entre servidores MongoDB con un click.

**Documentación completa**: [MONGO_SERVERS_WEB_GUIDE.md](./MONGO_SERVERS_WEB_GUIDE.md)
