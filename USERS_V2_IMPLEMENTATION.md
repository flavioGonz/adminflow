# 🚀 Plan de Implementación - Sistema de Usuarios V2

## ✅ Archivos Creados

### Backend
1. ✅ `server/schemas/user.schema.js` - Esquema y constantes
2. ✅ `server/lib/userServiceV2.js` - Servicio de usuarios reescrito
3. ✅ `server/routes/users-v2.js` - Endpoints de API V2
4. ✅ `server/scripts/migrate-users-to-objectid.js` - Script de migración

### Frontend
5. ✅ `client/types/user.ts` - Tipos TypeScript
6. ✅ `client/lib/api-users-v2.ts` - Cliente API
7. ✅ `client/components/users/avatar-upload.tsx` - Componente de avatar
8. ✅ `client/components/users/role-selector.tsx` - Selector de roles

## 📋 Pasos de Implementación

### PASO 1: Migrar Usuarios Antiguos (CRÍTICO)
```bash
cd c:\Users\Flavio\Documents\EXPRESS\adminflow\server
node scripts/migrate-users-to-objectid.js
```

Este script:
- ✅ Crea un backup de todos los usuarios
- ✅ Convierte usuarios con _id numérico a ObjectId
- ✅ Mantiene el ID antiguo en campo `oldNumericId`

### PASO 2: Integrar Endpoints V2 en el Servidor

Editar `server/index.js` y añadir después de las importaciones:

```javascript
// Importar servicio de usuarios V2
const userServiceV2 = require('./lib/userServiceV2');

// Configuración de multer para avatares (si no existe)
const multer = require('multer');
const path = require('path');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const userId = req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  }
});

const avatarUploadV2 = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});
```

Luego añadir los endpoints (copiar de `server/routes/users-v2.js`) antes de `app.listen()`.

### PASO 3: Crear Componentes Faltantes del Frontend

Necesitamos crear:
1. `UserModal` - Modal de creación/edición (2 columnas)
2. `UserTable` - Tabla de usuarios con TanStack Table
3. Nueva página `/system/users` rediseñada

### PASO 4: Actualizar Documentación

Una vez todo funcione, actualizar:
- `Apis.md` - Documentar endpoints V2
- `README.md` - Actualizar sección de usuarios

## 🎯 Próximos Archivos a Crear

1. **UserModal Component** (Modal de 2 columnas)
2. **UserTable Component** (Tabla con búsqueda y filtros)
3. **Nueva página de usuarios** (Rediseñada)

## ⚠️ Estado Actual

- ✅ Backend V2 listo
- ✅ Tipos y API client listos
- ✅ Componentes base (Avatar, Roles) listos
- ⏳ Falta integrar en server/index.js
- ⏳ Falta crear componentes de tabla y modal
- ⏳ Falta crear nueva página de usuarios

## 🔄 Siguiente Acción Recomendada

**¿Quieres que continúe creando los componentes restantes o prefieres que primero integremos lo que ya tenemos y probemos que funcione?**

Opciones:
A) Continuar creando todos los componentes (UserModal, UserTable, nueva página)
B) Integrar lo que tenemos ahora y probar
C) Pausar y que tú revises lo creado hasta ahora
