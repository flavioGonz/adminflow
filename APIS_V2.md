# AdminFlow API V2 (Sistema de Usuarios)

Esta API V2 reemplaza al sistema anterior de gestión de usuarios. Utiliza exclusivamente `ObjectId` de MongoDB y ofrece una estructura más robusta y tipada.

**Base URL:** `/api/v2`

## Autenticación

### `POST /auth/login`
Inicia sesión y obtiene un token JWT.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta (200 OK):**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "roles": ["admin", "viewer"],
    "groupId": "507f1f77bcf86cd799439012"
  }
}
```

---

## Usuarios

### `GET /users`
Obtiene la lista de todos los usuarios.

**Respuesta:** Array de objetos User.

### `GET /users/:id`
Obtiene un usuario por su ID.

### `POST /users`
Crea un nuevo usuario.

**Body:**
```json
{
  "email": "nuevo@ejemplo.com", // Requerido
  "password": "password123",    // Requerido
  "name": "Nuevo Usuario",
  "phone": "+598 99 123 456",
  "roles": ["viewer"],
  "groupId": "507f1f77bcf86cd799439012", // Opcional
  "status": "active" // "active", "inactive", "suspended"
}
```

### `PATCH /users/:id`
Actualiza un usuario existente.

**Body:** (Campos opcionales)
```json
{
  "name": "Nombre Actualizado",
  "phone": "+598 99 999 999",
  "roles": ["admin"],
  "groupId": null, // Desasignar grupo
  "status": "inactive"
}
```
*Nota: No se puede actualizar email ni password con este endpoint.*

### `PATCH /users/:id/password`
Cambia la contraseña de un usuario.

**Body:**
```json
{
  "newPassword": "nuevaPassword123"
}
```

### `POST /users/:id/avatar`
Sube una imagen de avatar para el usuario.
- **Content-Type:** `multipart/form-data`
- **Campo:** `avatar` (archivo)

### `DELETE /users/:id`
Elimina un usuario permanentemente.

---

## Definiciones

### Roles Disponibles
- `admin`: Acceso total
- `support`: Gestión de tickets y clientes
- `installer`: Visualización de tareas asignadas
- `viewer`: Solo lectura

### Estados de Usuario
- `active`: Puede iniciar sesión
- `inactive`: No puede iniciar sesión (temporal)
- `suspended`: Bloqueado permanentemente por seguridad
