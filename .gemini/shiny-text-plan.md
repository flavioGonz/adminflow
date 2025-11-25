# Script para agregar ShinyText a todas las páginas

## Páginas a actualizar:

1. dashboard/page.tsx - línea 762: "Dashboard"
2. clients/page.tsx - línea 77: "Clientes"
3. tickets/page.tsx - línea 276: "Gestión de Tickets"
4. contracts/page.tsx - línea 124: "Contratos"
5. budgets/page.tsx - línea 130: "Presupuestos"
6. products/page.tsx - línea 208: "Productos y servicios"
7. payments/page.tsx - línea 760: "Pagos"
8. repository/page.tsx - línea 370: "Bóveda de archivos"
9. notifications/page.tsx - línea 449: "Configuración de Alertas"
10. database/page.tsx - línea 296: "Base de Datos"

## Pasos:
1. Agregar import: import { ShinyText } from "@/components/ui/shiny-text";
2. Reemplazar <h1> o <h2> con ShinyText
3. Usar size="3xl" weight="bold" para h1
4. Usar size="xl" weight="semibold" para h2
