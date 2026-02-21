# Changelog - AdminFlow

## [2.1.0] - 2026-02-21
### 🍏 iPhone PWA & Native Experience (Major Update)
- **Header Único Premium:** Implementación de cabecera dinámica con efecto vidrio (glassmorphism) y avatar integrado a la derecha en todas las secciones móviles.
- **Navegación Táctica:** Rediseño del Tab Bar inferior estilo iOS 18, estático y sin parpadeos durante transiciones.
- **Gestos de Deslizamiento (Swipe):** Integración de gestos nativos para eliminar registros y realizar cobros rápidos en Pagos.
- **Buscador & Herramientas Unificadas:** Eliminación de botones flotantes a favor de una barra de herramientas integrada (Buscador + Filtro + Nuevo) en la parte superior de cada lista.
- **Gestión de Tickets Móvil:** Soporte nativo para captura de fotos con cámara y adjuntos multimedia directamente desde la PWA.
- **Notificaciones Push Pro:** Motor de notificaciones PWA v25 optimizado para iPhone con indicadores (badges) en vivo y vibración háptica.
- **Ficha de Cliente & Contratos:** Rediseño total de historiales y listados en formato de tarjetas inteligentes con badges de estado (Pendientes/Abiertos/Vencidos).

### 🛠️ Backend & Estabilidad
- **Robustez en Pagos:** Parche de seguridad en la API de pagos para garantizar respuestas consistentes incluso bajo errores de mapeo.
- **Sincronización PWA:** Actualización del Service Worker para forzar la invalidación de caché antigua y asegurar el despliegue de nuevas versiones.
- **Optimización Proxmox:** Despliegue de entorno independiente para Totem Kiosko en Debian 12 (CT 113).
