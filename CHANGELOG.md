# APIs de AdminFlow - Documentación Completa

Base URL: `http://localhost:5000`

## Resumen de Cambios Implementados

### ✅ Auditoría
- **Timestamp**: Ahora muestra correctamente la fecha y hora del evento
- **Acciones en Español**: Todas las acciones se traducen automáticamente (Crear, Actualizar, Eliminar, etc.)

### ✅ Usuarios
- Soporte completo para MongoDB y SQLite
- Gestión de roles (admin, manager, editor, viewer)
- Funcionalidad de avatar (pendiente de implementación en UI)

### ✅ Canales de Notificación
- Email (SMTP)
- WhatsApp (Twilio/360dialog)
- Telegram (Bot API)
- Slack (Webhooks)
- Verificación de conexión SMTP antes de guardar

### ✅ Instalación
- Wizard web interactivo
- Selección de motor de BD (MongoDB/SQLite)
- Prueba de conexión
- Inicialización automática de esquema
- Creación de usuario admin por defecto

## APIs Documentadas

Ver `Apis.md` para la documentación completa de todos los endpoints.

## Próximas Mejoras

1. **Usuarios**: Implementar subida de avatar
2. **Auditoría**: Agregar filtros por rango de fechas
3. **Canales**: Agregar más proveedores de notificaciones
