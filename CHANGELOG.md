# Changelog - AdminFlow

## [2.2.0] - 2026-02-22
### 🍏 iPhone PWA & Native Experience (Standalone Architecture)
- **Header Único Standalone:** Migración de toda la App a una arquitectura de cabecera independiente por página, eliminando de raíz cualquier duplicidad visual.
- **IPhoneHeader Pro:** Implementación de un componente de cabecera premium con título dinámico, campana de notificaciones con badges en vivo y avatar del usuario a la derecha.
- **Nuevas Pantallas Nativas:** 
  - **Nuevo Pago:** Página dedicada  con selectores optimizados y soporte de moneda (UYU/USD) con banderas.
  - **Nuevo Contrato:** Página dedicada  para gestión ágil desde el móvil.
- **Navegación Táctica:** Consolidación de la barra de navegación inferior (Tab Bar) en todas las rutas principales.
- **Buscador & Filtros:** Integración de herramientas de filtrado y búsqueda directamente bajo el header en Tickets, Clientes, Pagos y Contratos.
- **Estabilidad de Build:** Corrección de errores críticos de tipado y limpieza de cachés para asegurar un despliegue v60 impecable.

### 💰 Gestión Financiera Móvil
- **Edición de Pagos:** Panel táctil para modificar montos, monedas y estados de pagos pendientes directamente desde la lista.
- **Contratos:** Visualización mejorada con montos y estados de vigencia destacados.

### 🛠️ Backend
- **Safe API:** Blindaje del endpoint de pagos para garantizar estabilidad ante errores de mapeo.
