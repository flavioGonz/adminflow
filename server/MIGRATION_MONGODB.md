# Migración a MongoDB - AdminFlow

## ✅ Estado Actual

El proyecto ha sido migrado completamente de SQLite a MongoDB.

## 🔄 Cambios Realizados

### 1. **Sesiones**
- ✅ Migradas de `connect-sqlite3` a `connect-mongo`
- Las sesiones ahora se almacenan en la colección `sessions` de MongoDB

### 2. **Autenticación**
- ✅ `/register` - Solo MongoDB
- ✅ `/login` - Solo MongoDB
- ✅ `/api/users` - Solo MongoDB
- ✅ `/api/users/register` - Solo MongoDB
- ✅ `/api/users/:id/avatar` - Solo MongoDB
- ✅ `/api/users/:id` - Solo MongoDB
- ✅ `/api/users/:id/password` - Nuevo endpoint para reset de contraseña
- ✅ `/api/users/:id` (DELETE) - Nuevo endpoint para eliminar usuarios

### 3. **Base de Datos**
- ✅ `server/db.js` refactorizado para eliminar SQLite
- ✅ Proxy de compatibilidad agregado para prevenir errores
- ✅ Función `ensureDefaultAdmin()` migrada a MongoDB

### 4. **UI Mejorada**
- ✅ Modal de confirmación para eliminación de usuarios
- ✅ Botón de eliminar en tabla de usuarios
- ✅ Reset de contraseña funcional
- ✅ Validación de campos de contraseña

## 📦 Dependencias

### Activas
- `mongodb` - Base de datos principal
- `connect-mongo` - Store de sesiones
- `bcrypt` - Hash de contraseñas
- `express-session` - Manejo de sesiones

### Deprecadas (pueden ser removidas)
- `sqlite3` - Ya no se usa
- `connect-sqlite3` - Ya no se usa

## 🗑️ Limpieza Pendiente (Opcional)

Si deseas eliminar completamente SQLite del proyecto:

```bash
cd server
npm uninstall sqlite3 connect-sqlite3
```

También puedes eliminar:
- `server/database/database.sqlite` (archivo de base de datos)
- Scripts de migración en `server/scripts/migrate-sqlite-to-mongo.js`

## ⚠️ Notas Importantes

1. **Usuario Admin por Defecto**
   - Email: `admin@adminflow.uy`
   - Password: `admin`
   - Se crea automáticamente en MongoDB si no existe

2. **Usuarios Existentes**
   - Si tienes usuarios creados sin contraseña, usa el botón de "Reset Password" (🔑)
   - O elimínalos y créalos de nuevo

3. **Sesiones**
   - Las sesiones antiguas de SQLite no son compatibles
   - Los usuarios deberán volver a iniciar sesión

## 🚀 Próximos Pasos

1. Probar login con usuarios existentes
2. Crear nuevos usuarios desde la UI
3. Verificar que el reset de contraseña funciona
4. (Opcional) Desinstalar dependencias de SQLite
