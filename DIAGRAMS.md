# Implementación de Diagramas de Red (Excalidraw)

Este documento detalla la implementación de la funcionalidad de diagramas de red integrados en la ficha del cliente utilizando Excalidraw.

## Descripción General

La funcionalidad permite crear, editar y guardar diagramas de red directamente asociados a un cliente específico. Los diagramas se persisten en la base de datos (MongoDB) y se cargan automáticamente al acceder a la sección de diagramas de un cliente.

## Componentes

### Frontend (`client/app/clients/[id]/diagram/page.tsx`)

*   **Librería**: `@excalidraw/excalidraw`
*   **Renderizado**: Se utiliza `next/dynamic` con `{ ssr: false }` para cargar el componente Excalidraw solo en el cliente, evitando errores de hidratación y compatibilidad con SSR.
*   **Estilos**: Se importa explícitamente `@excalidraw/excalidraw/index.css` para asegurar la correcta visualización de la interfaz.
*   **Estado**:
    *   `initialData`: Carga los elementos (`elements`), estado de la aplicación (`appState`) y archivos (`files`) recuperados del backend.
    *   `excalidrawAPI`: Referencia a la API de Excalidraw para interactuar con el editor (guardar, exportar, etc.).
*   **Manejo de Sesión**: Se utiliza la prop `key={id}` en el componente `<Excalidraw />` para forzar la recreación del componente cuando cambia el ID del cliente. Esto evita que se muestre un diagrama "en caché" de un cliente anterior al navegar entre fichas.
*   **Sanitización**: Se elimina la propiedad `collaborators` del `appState` al cargar los datos para evitar errores de tiempo de ejecución (`collaborators.forEach is not a function`), ya que no se utiliza la colaboración en tiempo real.

### Backend (`server/routes/diagrams.js`)

*   **Rutas**:
    *   `GET /api/clients/:id/diagram`: Recupera el diagrama almacenado para un cliente. Retorna `null` si no existe.
    *   `POST /api/clients/:id/diagram`: Guarda o actualiza el diagrama. Utiliza `upsert: true` en MongoDB.
*   **Almacenamiento**: Los datos se guardan en la colección `client_diagrams` de MongoDB.

## Base de Datos (MongoDB)

### Colección: `client_diagrams`

Almacena el estado completo del diagrama de Excalidraw para cada cliente.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `_id` | ObjectId | ID único del documento. |
| `clientId` | String | ID del cliente asociado (referencia a `clients`). Índice único. |
| `elements` | Array | Array de objetos que representan los elementos dibujados (rectángulos, flechas, texto, etc.). |
| `appState` | Object | Estado de la vista del editor (zoom, scroll, color seleccionado, etc.). **Nota**: Se excluye `collaborators`. |
| `files` | Object | Archivos binarios incrustados (imágenes) en el diagrama. |
| `createdAt` | Date | Fecha de creación. |
| `updatedAt` | Date | Fecha de última actualización. |

## Flujo de Datos

1.  **Carga**:
    *   El usuario accede a `/clients/:id/diagram`.
    *   El frontend solicita `GET /api/clients/:id/diagram`.
    *   Si existe un diagrama, se carga en `initialData`. Se limpia `appState.collaborators`.
    *   Excalidraw se inicializa con estos datos.

2.  **Guardado**:
    *   El usuario hace clic en "Guardar Cambios".
    *   El frontend extrae `elements`, `appState` y `files` usando `excalidrawAPI`.
    *   Se envía `POST /api/clients/:id/diagram` con estos datos.
    *   El backend actualiza el documento en `client_diagrams` usando `clientId` como filtro.

## Consideraciones

*   **Imágenes**: Excalidraw soporta imágenes. Estas se guardan en el campo `files` como base64 o referencias binarias dentro del documento JSON. Ten en cuenta que diagramas con muchas imágenes grandes pueden aumentar significativamente el tamaño del documento en MongoDB.
*   **Colaboración**: Actualmente la implementación es **single-user**. No hay soporte para edición colaborativa en tiempo real (websockets) en esta versión.
