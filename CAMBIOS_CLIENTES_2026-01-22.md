# Cambios Realizados en la Ficha de Clientes

## Fecha: 2026-01-22

### Problemas Solucionados

1. ✅ **Recuperar iconos y datos de accesos**
   - **Diagnóstico**: El backend buscaba registros en MongoDB usando el `ObjectId` del cliente (string largo), pero los datos en las colecciones relacionadas (`client_accesses`, etc.) estaban vinculados al ID numérico antiguo ("1", "2", etc.).
   - **Solución**: Se modificó `/opt/adminflow/server/index.js` para que busque los indicadores usando `client.numericId || client.id`, asegurando la coincidencia con los datos históricos.

2. ✅ **Columna ID irreconocible**
   - **Diagnóstico**: Se mostraba el `ObjectId` de MongoDB o un formato combinado con avatar.
   - **Solución**: Se actualizó la tabla para mostrar preferentemente el `numericId` (ID corto original) si está disponible, recuperando el formato "valor simple numérico".

3. ✅ **Eliminar toggle de notificaciones**
   - Se eliminó la columna "Notif." y el interruptor correspondiente para limpiar la interfaz.

4. ✅ **Mostrar más clientes**
   - Se aumentó la carga inicial y el incremento de scroll infinito de 15 a 50 clientes.

---

## Detalles Técnicos de la Solución

### Backend (`/opt/adminflow/server/index.js`)

Se actualizaron las consultas de indicadores para usar el ID correcto:

```javascript
// ANTES (fallaba porque client.id era ObjectId)
clientId: client.id.toString()

// AHORA (funciona con datos históricos)
clientId: (client.numericId || client.id).toString()
```

Esto recupera correctamente los flags: `hasAccess`, `hasDiagram`, `hasFiles`, `hasImplementation`.

### Frontend

1. **`types/client.ts`**: Se agregó `numericId?: string` a la interfaz Client.
2. **`components/clients/client-table.tsx`**:
   - `LOAD_INCREMENT` = 50.
   - Columna ID ahora muestra `{client.numericId || client.id}`.
   - Eliminada columna Notificaciones.
   - Código de iconos validado (ya existía y funciona correctamente con los flags del backend).

---

## Verificación

Se verificó que los datos existen en el servidor MongoDB de producción (`192.168.99.121:27017`):
- `client_accesses`: 156 registros
- `client_diagrams`: 13 registros
- `client_implementations`: 4 registros

Con la corrección en el backend, estos datos ahora se vinculan correctamente a los clientes en el listado.
