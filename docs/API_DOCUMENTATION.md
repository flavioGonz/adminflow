# Documentación de la API de AdminFlow

Esta es la documentación de referencia para la API RESTful del servidor de AdminFlow.

## Conceptos Generales

-   **URL Base:** Todas las rutas de la API están prefijadas con `/api`. La URL base para un entorno de desarrollo local es `http://localhost:3001/api`.
-   **Autenticación:** La mayoría de las rutas están protegidas y requieren un JSON Web Token (JWT). El token debe ser enviado en la cabecera `Authorization` con el formato `Bearer <TOKEN>`.
-   **Formatos de Datos:** La API consume y produce `application/json`.
-   **Respuestas de Error:** Las respuestas de error generalmente siguen este formato:
    ```json
    {
      "message": "Descripción del error.",
      "detail": "Información adicional (opcional)."
    }
    ```

---

## Módulo de Instalación

Estas rutas solo están disponibles si el sistema aún no ha sido instalado (es decir, si no existe el archivo `.installed`).

### `POST /api/install`

Ejecuta el proceso de instalación inicial del sistema. Crea el archivo de la base de datos SQLite, las tablas, y el primer usuario administrador en MongoDB.

-   **Request Body:**
    ```json
    {
      "dbEngine": "sqlite" | "mongodb",
      "user": {
        "email": "admin@example.com",
        "password": "strongpassword123",
        "name": "Admin"
      },
      "config": {
        // Opciones de configuración de la BD, ej. mongoUri
      }
    }
    ```
-   **Success Response (200):**
    ```json
    {
      "message": "Instalación completada. Reinicia el servidor."
    }
    ```

---

## Autenticación y Usuarios (V2)

Estas son las rutas principales para la gestión de usuarios y la autenticación, utilizando el sistema de MongoDB.

### `POST /api/v2/auth/login`

Autentica a un usuario y devuelve un token JWT.

-   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
-   **Success Response (200):**
    ```json
    {
      "message": "Login exitoso",
      "token": "ey...",
      "user": {
        "id": "60d...e1",
        "email": "user@example.com",
        "name": "User Name",
        "roles": ["user"],
        "groupId": "60d...f2"
      }
    }
    ```
-   **Error Response (401):** `{"message": "Credenciales inválidas"}`

### `GET /api/v2/users`

Obtiene una lista de todos los usuarios del sistema.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<User>` (una lista de objetos de usuario).

### `POST /api/v2/users`

Crea un nuevo usuario en el sistema.

-   **Autenticación:** Requerida (generalmente solo para administradores).
-   **Request Body:** Objeto de usuario sin `id`.
    ```json
    {
      "email": "new.user@example.com",
      "password": "password123",
      "name": "New User",
      "role": "user",
      "groupId": "60d...f2"
    }
    ```
-   **Success Response (201):** Objeto del usuario creado.

### `GET /api/v2/users/:id`

Obtiene los detalles de un usuario específico.

-   **Autenticación:** Requerida.
-   **Success Response (200):** Objeto del usuario.

### `PUT /api/v2/users/:id`

Actualiza la información de un usuario.

-   **Autenticación:** Requerida.
-   **Request Body:** Campos del usuario a actualizar.
-   **Success Response (200):** Objeto del usuario actualizado.

### `DELETE /api/v2/users/:id`

Elimina un usuario del sistema.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `{"message": "Usuario eliminado"}`.

---

## Clientes (`/api/clients`)

Endpoints para la gestión de clientes (CRUD sobre la tabla `clients` de SQLite).

### `GET /api/clients`

Obtiene una lista de todos los clientes.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<Client>`
    ```json
    [
      {
        "id": "1",
        "name": "Cliente Ejemplo S.A.",
        "alias": "Ejemplo",
        "email": "contacto@ejemplo.com",
        "contract": "Título del Contrato Activo", // o null si no tiene
        "hasDiagram": true, // Indicador de MongoDB
        "hasAccess": false, // Indicador de MongoDB
        // ...otros campos
      }
    ]
    ```

### `POST /api/clients`

Crea un nuevo cliente.

-   **Autenticación:** Requerida.
-   **Request Body:**
    ```json
    {
      "name": "Nuevo Cliente",
      "email": "nuevo@cliente.com",
      "phone": "12345678",
      // ... otros campos opcionales
    }
    ```
-   **Success Response (201):** `Client` (el objeto del cliente creado).
-   **Error Response (409):** Si el email ya existe.

### `GET /api/clients/:id`

Obtiene un cliente por su ID.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Client`
-   **Error Response (404):** `{"message": "Client not found"}`

### `PUT /api/clients/:id`

Actualiza un cliente existente.

-   **Autenticación:** Requerida.
-   **Request Body:** Campos del cliente a actualizar.
-   **Success Response (200):** `Client` (el objeto del cliente actualizado).

### `DELETE /api/clients/:id`

Elimina un cliente.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `{"message": "Client deleted successfully."}`

### `POST /api/clients/:id/avatar`

Sube un avatar para un cliente.

-   **Autenticación:** Requerida.
-   **Request:** `multipart/form-data` con un campo `avatar` (imagen).
-   **Success Response (200):** `{"avatarUrl": "/uploads/avatars/..."}`

### `POST /api/clients/import`

Importa múltiples clientes desde un array JSON.

-   **Autenticación:** Requerida.
-   **Request Body:** `Array<Client>`
-   **Success Response (200):**
    ```json
    {
      "message": "Client import completed",
      "stats": { "total": 10, "imported": 8, "failed": 2 }
    }
    ```

---

## Tickets (`/api/tickets`)

Endpoints para gestionar los tickets de soporte (CRUD sobre la tabla `tickets` de SQLite).

### `GET /api/tickets`

Obtiene todos los tickets.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<Ticket>`

### `POST /api/tickets`

Crea un nuevo ticket.

-   **Autenticación:** Requerida.
-   **Request Body:**
    ```json
    {
      "clientId": 1,
      "title": "Falla en el servidor",
      "priority": "Alta",
      "status": "Nuevo"
      // ... otros campos
    }
    ```
-   **Success Response (201):** `Ticket` (objeto del ticket creado).

### `GET /api/tickets/:id`

Obtiene un ticket por su ID.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Ticket`.

### `PUT /api/tickets/:id`

Actualiza un ticket existente.

-   **Autenticación:** Requerida.
-   **Request Body:** Campos a actualizar. Incluir `"notifyClient": true` para forzar una notificación al cliente.
-   **Success Response (200):** `Ticket` (actualizado).

### `DELETE /api/tickets/:id`

Elimina un ticket.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `{"message": "Ticket deleted successfully."}`

### `GET /api/clients/:id/tickets`

Obtiene todos los tickets de un cliente específico.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<Ticket>`.

---

## Presupuestos (`/api/budgets`)

Gestión de presupuestos (CRUD sobre la tabla `budgets` y `budget_items` de SQLite).

### `GET /api/budgets`

Obtiene todos los presupuestos.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<Budget>`.

### `POST /api/budgets`

Crea un nuevo presupuesto.

-   **Autenticación:** Requerida.
-   **Request Body:**
    ```json
    {
      "clientId": 1,
      "title": "Presupuesto de Hardware",
      "sections": [ { "title": "Equipos", "items": [...] } ]
    }
    ```
-   **Success Response (201):** `Budget`.

### `GET /api/budgets/:id`

Obtiene un presupuesto por ID.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Budget`.

### `PUT /api/budgets/:id`

Actualiza un presupuesto.

-   **Autenticación:** Requerida.
-   **Request Body:** Campos a actualizar.
-   **Success Response (200):** `Budget`.

### `DELETE /api/budgets/:id`

Elimina un presupuesto y sus ítems asociados.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `{"message": "Budget deleted successfully."}`

---

## Contratos (`/api/contracts`)

Gestión de contratos (CRUD sobre la tabla `contracts` de SQLite).

### `GET /api/contracts`

Obtiene todos los contratos.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<Contract>`.

### `POST /api/contracts`

Crea un nuevo contrato.

-   **Autenticación:** Requerida.
-   **Request Body:**
    ```json
    {
      "clientId": 1,
      "title": "Contrato de Mantenimiento Anual",
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "amount": 5000,
      "currency": "USD"
    }
    ```
-   **Success Response (201):** `Contract`.

### `PUT /api/contracts/:id`

Actualiza un contrato.

-   **Autenticación:** Requerida.
-   **Request Body:** Campos a actualizar.
-   **Success Response (200):** `Contract`.

### `DELETE /api/contracts/:id`

Elimina un contrato y su archivo asociado (si existe).

-   **Autenticación:** Requerida.
-   **Success Response (200):** `{"message": "Contract deleted successfully."}`

### `POST /api/contracts/:id/upload`

Sube el archivo PDF para un contrato.

-   **Autenticación:** Requerida.
-   **Request:** `multipart/form-data` con un campo `contractFile` (archivo).
-   **Success Response (200):** `Contract` (actualizado con la ruta del archivo).

---

## Pagos (`/api/payments`)

Gestión de pagos (CRUD sobre la tabla `payments` de SQLite).

### `GET /api/payments`

Obtiene todos los pagos.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `Array<Payment>`.

### `POST /api/payments`

Registra un nuevo pago.

-   **Autenticación:** Requerida.
-   **Request Body:**
    ```json
    {
      "invoice": "F-00123",
      "client": "Cliente Ejemplo",
      "clientId": 1,
      "amount": 150.50,
      "status": "Pagado"
    }
    ```
-   **Success Response (201):** `Payment`.

### `PUT /api/payments/:id`

Actualiza un pago.

-   **Autenticación:** Requerida.
-   **Request Body:** Campos a actualizar.
-   **Success Response (200):** `Payment`.

### `DELETE /api/payments/:id`

Elimina un pago.

-   **Autenticación:** Requerida.
-   **Success Response (200):** `{"message": "Payment deleted"}`.

---
*Nota: Esta documentación es un resumen. Existen más endpoints para productos, repositorio, calendario y sistema que siguen patrones similares de CRUD. Para ver la lista completa y detalles específicos, se recomienda consultar el código fuente en `server/index.js`.*
