# README General de AdminFlow

## 1. ¿Qué es AdminFlow?

AdminFlow es una aplicación web full-stack diseñada para la gestión integral de clientes y operaciones de servicio técnico. Permite a pequeñas y medianas empresas, así como a profesionales independientes, organizar su base de clientes, gestionar tickets de soporte, llevar un control de contratos, generar presupuestos y procesar pagos en un único lugar.

El sistema está diseñado para ser flexible, ofreciendo una base sólida de gestión de entidades de negocio (clientes, tickets) y extendiendo su funcionalidad con características modernas como gestión de usuarios por roles, auditoría, notificaciones y una API robusta.

## 2. Propósito del Proyecto

El objetivo principal de AdminFlow es centralizar la información operativa y de clientes, que a menudo se encuentra dispersa en hojas de cálculo, correos electrónicos y diferentes aplicaciones. Al unificar estos datos, se busca:

-   **Mejorar la Eficiencia:** Acceder rápidamente al historial de un cliente, incluyendo sus tickets, contratos y pagos.
-   **Profesionalizar el Servicio:** Generar presupuestos y contratos estandarizados y realizar un seguimiento formal de los problemas.
-   **Facilitar la Colaboración:** Permitir que múltiples usuarios (técnicos, administradores) trabajen sobre la misma base de información.
-   **Automatizar Tareas:** Enviar notificaciones automáticas sobre cambios de estado en tickets o recepción de pagos.

## 3. Stack Tecnológico

AdminFlow es un **monorepo** que se compone de dos aplicaciones principales: un backend (servidor) y un frontend (cliente).

### Backend (Servidor)

-   **Framework:** Node.js con Express.js.
-   **Lenguaje:** JavaScript (ES6+).
-   **Base de Datos:** Arquitectura híbrida:
    -   **SQLite:** Para las entidades de negocio principales (clientes, tickets, contratos, etc.), operando en un "modo de compatibilidad" simple y robusto.
    -   **MongoDB:** Para la gestión de la aplicación (usuarios, roles, grupos, sesiones, logs, configuraciones), permitiendo mayor flexibilidad y escalabilidad.
-   **Autenticación:** JSON Web Tokens (JWT) para la seguridad de la API.
-   **Gestión de Sesiones:** `express-session` con `connect-mongo` para persistir las sesiones en MongoDB.
-   **Otros:** `multer` para la subida de archivos, `bcrypt` para el hashing de contraseñas.

### Frontend (Cliente)

-   **Framework:** Next.js (App Router) sobre React 18.
-   **Lenguaje:** TypeScript.
-   **Estilos:** Tailwind CSS, siguiendo una filosofía "utility-first".
-   **Componentes de UI:** shadcn/ui, que utiliza Radix UI como base para componentes accesibles y no estilizados.
-   **Gestión de Estado:** Principalmente hooks de React (`useState`, `useContext`, `useEffect`), complementados con librerías de fetching de datos como SWR o React Query (implícito en el uso de hooks para la API).
-   **Librerías Clave:** `tanstack/react-table` para tablas de datos, `recharts` para gráficos, `leaflet` para mapas.

## 4. Flujo de Interacción

1.  El **Cliente (Next.js)** se ejecuta en el navegador del usuario.
2.  Cuando el usuario realiza una acción (ej. crear un cliente), la aplicación cliente realiza una llamada a la **API del Servidor (Express.js)**.
3.  El **Servidor** recibe la solicitud, la procesa, y realiza las operaciones necesarias en la base de datos correspondiente (SQLite o MongoDB).
4.  El **Servidor** devuelve una respuesta en formato JSON al **Cliente**.
5.  El **Cliente** actualiza su estado y la interfaz de usuario para reflejar los cambios.
