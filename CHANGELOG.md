# Changelog - AdminFlow

## [2.1.5] - 2026-02-22
### 🍏 iPhone PWA & Native Overhaul (Final Release)
- **Header Único iOS:** Eliminación de duplicidad de cabeceras. Ahora existe un solo header estilizado con efecto vidrio y avatar integrado arriba a la derecha.
- **Tarjetas de Tickets Pro:** 
  - Integración de **doble avatar apilado** (Cliente + Técnico asignado).
  - Contador de **tiempo transcurrido** desde la apertura en tiempo real.
  - Badges de prioridad con diseño premium.
- **Gestos Táctiles (Swipe):** Implementación de gestos de deslizamiento a la izquierda en todas las secciones principales para acciones rápidas (Eliminar/Pagar).
- **Control Unificado:** Fusión de Buscador, Filtro y Botón Nuevo (+) en una sola línea superior, eliminando los botones flotantes.
- **Notificaciones v25:** Motor optimizado para iPhone con indicadores visuales y soporte para alertas del sistema.
- **Ficha de Cliente:** Rediseño del historial de tickets en formato de tarjetas nativas de iPhone.
- **Contratos:** Inclusión del monto y moneda directamente en la vista de lista.

### 🛠️ Estabilidad & Proxmox
- **Fix de Pagos:** Parche de seguridad en la API para evitar bloqueos en la creación de nuevos pagos.
- **Service Worker v20:** Forzado de actualización de caché para asegurar que todos los dispositivos carguen la última interfaz.
- **LXC Kiosko:** Despliegue independiente del proyecto BioCloud Kiosk en contenedor Debian 12 dedicado.
