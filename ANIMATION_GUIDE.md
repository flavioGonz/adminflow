# Guía de Animaciones de Tablas - Aplicable a Toda la App

## Patrones Aplicados en Database y Products

### 1. Importaciones Necesarias

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { DNA } from "react-loader-spinner";
```

### 2. Estructura Base de Tabla Animada

```tsx
<TableBody>
  <AnimatePresence mode="wait">
    {items.map((item, idx) => (
      <motion.tr
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, delay: idx * 0.05 }}
        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
      >
        {/* TableCells aquí */}
      </motion.tr>
    ))}
  </AnimatePresence>
</TableBody>
```

### 3. Propiedades de Animación

- **initial**: Estado inicial (invisible, desplazado)
  - `opacity: 0` - Totalmente transparente
  - `y: 10` - Desplazado 10px hacia abajo

- **animate**: Estado final (visible, en posición)
  - `opacity: 1` - Totalmente visible
  - `y: 0` - En posición normal

- **exit**: Estado de salida (cuando se elimina)
  - `opacity: 0` - Desvanecerse
  - `y: -10` - Deslizar hacia arriba

- **transition**:
  - `duration: 0.2` - 200ms por animación
  - `delay: idx * 0.05` - Efecto escalonado (cada fila 50ms)

### 4. Loaders (Sustituir Loader2 por DNA)

**Antes:**
```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

**Después:**
```tsx
<DNA visible height={16} width={16} ariaLabel="Cargando..." />
```

### 5. Scroll con Fadeout (Colecciones Pattern)

```tsx
<div className="relative overflow-hidden">
  {/* Gradient overlay para fade */}
  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
  
  <ScrollArea className="h-auto max-h-[280px]">
    <div className="space-y-2 pr-4">
      {/* Items aquí con motion.div */}
    </div>
  </ScrollArea>
</div>
```

### 6. Clase de Celda Mejorada

Agregar estas clases a TableCell para mejor visual:

```tsx
<TableCell className="whitespace-nowrap">
  {/* content */}
</TableCell>

<TableCell className="text-right whitespace-nowrap">
  {/* content */}
</TableCell>
```

## Páginas que necesitan actualización

1. **✅ /database** - Completado
2. **✅ /products** - Ya tiene implementado
3. **⏳ /clients** - ClientTable (parcialmente)
4. **⏳ /tickets** - TicketTable (parcialmente)
5. **⏳ /payments** - Necesita animaciones
6. **⏳ /system** - Necesita animaciones
7. **⏳ /contracts** - Necesita animaciones

## Componente Reutilizable

Ver: `@/components/tables/animated-table.tsx`

Uso:
```tsx
import { AnimatedTableRow } from "@/components/tables/animated-table";

<TableBody>
  <AnimatePresence mode="wait">
    {items.map((item, idx) => (
      <AnimatedTableRow key={item.id} data={item} index={idx}>
        {/* TableCells */}
      </AnimatedTableRow>
    ))}
  </AnimatePresence>
</TableBody>
```

## CSS Utilities Recomendadas

```css
/* Para filas de tabla consistentes */
.table-row-animated {
  @apply border-b transition-colors hover:bg-muted/50;
}

.table-cell-nowrap {
  @apply whitespace-nowrap;
}

.table-cell-right {
  @apply text-right whitespace-nowrap;
}
```

## Notas de Performance

- Limite el número de items mostrados simultáneamente (máx ~15 por página)
- Use virtualization para listas muy grandes (>100 items)
- El delay escalonado mejora la UX pero no afecta performance
- AnimatePresence con mode="wait" previene solapamiento de animaciones

## Ejemplo Completo: Implementar en /tickets

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { DNA } from "react-loader-spinner";

export function TicketTable({ tickets, ...props }: TicketTableProps) {
  return (
    <Table>
      <TableHeader>
        {/* Header */}
      </TableHeader>
      <TableBody>
        <AnimatePresence mode="wait">
          {paginatedTickets.map((ticket, idx) => (
            <motion.tr
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="border-b transition-colors hover:bg-muted/50"
            >
              {/* Cells */}
            </motion.tr>
          ))}
        </AnimatePresence>
      </TableBody>
    </Table>
  );
}
```

## Estado de Implementación

| Página | Estado | Animación | Loader | Scroll Fade |
|--------|--------|-----------|--------|-------------|
| Database | ✅ | motion.tr | DNA | ✅ |
| Products | ✅ | motion.tr | DNA | N/A |
| Clients | ⏳ | Parcial | - | - |
| Tickets | ⏳ | No | - | - |
| Payments | ⏳ | No | - | - |
| System | ⏳ | No | - | - |
| Contracts | ⏳ | No | - | - |

## Próximos Pasos

1. Aplicar animaciones a TicketTable
2. Aplicar animaciones a PaymentsTable  
3. Aplicar animaciones a SystemTable
4. Aplicar animaciones a ContractsTable
5. Revisar y optimizar performance
