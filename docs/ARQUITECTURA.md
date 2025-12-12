# Arquitectura del Proyecto AdminFlow

Este documento describe la arquitectura de alto nivel del proyecto AdminFlow, incluyendo la estructura del backend, el frontend y la estrategia de persistencia de datos.

## 1. Vista General

AdminFlow es una aplicación web full-stack organizada en un formato **monorepo**, lo que significa que el código del cliente y del servidor residen en el mismo repositorio pero operan como aplicaciones separadas e independientes.

-   **Backend (`/server`):** Una API RESTful construida con **Node.js** y el framework **Express.js**. Se encarga de toda la lógica de negocio, autenticación, y acceso a la base de datos.
-   **Frontend (`/client`):** Una Single-Page Application (SPA) construida con **Next.js** (framework de React). Proporciona la interfaz de usuario y consume los datos expuestos por la API del backend.

Esta separación permite desarrollar, desplegar y escalar cada componente de forma independiente.

## 2. Arquitectura del Backend (`/server`)

El backend sigue una arquitectura mayormente **monolítica**, con la mayoría de la lógica de negocio centralizada en el archivo `index.js`.

### Estructura de Carpetas Clave:

-   `/app`: Contiene lógica específica de funcionalidades, como el dashboard.
-   `/database`: Contiene diagramas y documentación de la base de datos.
-   `/lib`: Un directorio crucial que contiene:
    -   Lógica de conexión y configuración de la base de datos (`dbChoice.js`, `db.js`, `mongoClient.js`).
    -   Lógica de inicio del servidor y verificación de instalación (`serverStart.js`).
    -   Esquemas y modelos para MongoDB (`budgetSchema.js`, `ticketSchema.js`, `userServiceV2.js`).
    -   Servicios auxiliares (auditoría, notificaciones, etc.).
-   `/middleware`: Contiene middleware de Express, como `checkInstallation.js`, que protege las rutas antes de que la app se instale.
-   `/routes`: Contiene los enrutadores de la API de Express, que delegan la lógica a los controladores o servicios. Es el punto de entrada para todas las solicitudes HTTP.
-   `/schemas`: Contiene esquemas de validación (posiblemente para Joi o una herramienta similar).
-   `index.js`: El corazón de la aplicación Express. Define la configuración principal, el middleware de la aplicación, las sesiones y la gran mayoría de las rutas de la API (especialmente las más antiguas).
-   `db.js`: Archivo específico para la inicialización y gestión de la conexión con **SQLite**.

### Flujo de una Solicitud:

1.  Una solicitud HTTP llega al servidor Express.
2.  Pasa a través de middleware globales (CORS, parser de JSON, sesiones).
3.  El enrutador de Express (`/routes` o definido en `index.js`) dirige la solicitud al controlador correspondiente.
4.  El controlador procesa la solicitud, interactúa con la base de datos apropiada (SQLite o MongoDB) a través de los servicios o directamente.
5.  Se devuelve una respuesta JSON al cliente.

## 3. Arquitectura del Frontend (`/client`)

El frontend está construido con Next.js, siguiendo las convenciones del **App Router**.

### Estructura de Carpetas Clave:

-   `/app`: El directorio principal del App Router. Cada subdirectorio corresponde a una ruta URL en la aplicación.
    -   `layout.tsx`: Define la estructura de la página principal (menú lateral, cabecera).
    -   `page.tsx`: La página de inicio o dashboard principal.
    -   `/clients`, `/tickets`, etc.: Directorios que contienen las páginas y componentes para cada sección de la aplicación.
-   `/components`: Contiene componentes de React reutilizables.
    -   `/ui`: Componentes de UI de bajo nivel, probablemente de una librería como **shadcn/ui**, que son bloques de construcción para interfaces más complejas.
    -   Componentes específicos de funcionalidades (ej. `ClientForm`, `TicketList`).
-   `/lib`: Contiene la lógica auxiliar del lado del cliente.
    -   `api-*.ts`: Módulos dedicados a realizar las llamadas a la API del backend para cada entidad (clientes, tickets, etc.). Abstraen la lógica de `fetch`.
    -   `utils.ts`: Funciones de utilidad generales.
    -   `http.ts`: Un cliente HTTP base (probablemente basado en `fetch`) para comunicarse con el backend.
-   `/hooks`: Contiene hooks de React personalizados para encapsular lógica y estado.

## 4. Estrategia de Persistencia de Datos (Híbrida)

Una característica distintiva de AdminFlow es su **arquitectura de base de datos híbrida**. El sistema utiliza dos motores de base de datos diferentes para propósitos distintos, operando simultáneamente.

### SQLite

-   **Propósito:** Actúa como la base de datos principal para las **entidades de negocio fundamentales**. Es referida en el código como "modo de compatibilidad".
-   **Entidades Gestionadas:** Clientes, Contratos, Tickets, Productos, Presupuestos (Budgets).
-   **Ubicación:** Un único archivo `database.sqlite` en el directorio `server/database/`.
-   **Interacción:** La lógica de la API en `server/index.js` interactúa con SQLite directamente usando la librería `sqlite3`, con consultas SQL escritas como texto.

### MongoDB

-   **Propósito:** Gestiona las **entidades de la aplicación y funcionalidades modernas**.
-   **Entidades Gestionadas:** Usuarios (V2), Grupos, Sesiones, Registros de Auditoría (Audit Logs), Notificaciones.
-   **Interacción:** La lógica de la API interactúa con MongoDB a través de un cliente de MongoDB (`mongodb`) y, en algunos casos, usando esquemas definidos (similar a Mongoose) para la validación y estructura.

Esta arquitectura dual sugiere un proceso de migración o una decisión de diseño para mantener un sistema central simple (SQLite) mientras se añaden características más complejas y escalables (MongoDB) sobre él.
