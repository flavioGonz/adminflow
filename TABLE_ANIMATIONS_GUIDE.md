# Guía: Aplicar Animaciones a Tablas

Este documento muestra cómo aplicar animaciones elegantes de bottom-to-top a las tablas existentes en la aplicación.

## Opción 1: Usando `AnimatedTableBody` (Recomendado - Más simple)

```tsx
import { AnimatedTableBody, AnimatedRow } from "@/hooks/use-table-animation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MyTable() {
  const items = [/* tu data */];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Columna 1</TableHead>
          <TableHead>Columna 2</TableHead>
        </TableRow>
      </TableHeader>
      <AnimatedTableBody staggerDelay={0.05}>
        {items.map((item, index) => (
          <AnimatedRow key={item.id} delay={index * 0.05}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.value}</TableCell>
          </AnimatedRow>
        ))}
      </AnimatedTableBody>
    </Table>
  );
}
```

## Opción 2: Usando `useTableAnimation` Hook (Más control)

```tsx
import { useTableAnimation } from "@/hooks/use-table-animation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

export function MyTable() {
  const items = [/* tu data */];
  const { MotionTableBody, rowVariants } = useTableAnimation({
    staggerDelay: 0.05,
    rowDelay: 0,
    duration: 0.4,
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Columna 1</TableHead>
          <TableHead>Columna 2</TableHead>
        </TableRow>
      </TableHeader>
      <MotionTableBody
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {items.map((item, index) => (
          <motion.tr key={item.id} variants={rowVariants}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.value}</TableCell>
          </motion.tr>
        ))}
      </MotionTableBody>
    </Table>
  );
}
```

## Opción 3: Usando `TableRowAnimation` para elementos individuales

Si prefieres animar solo algunos elementos de lista (no necesariamente tablas):

```tsx
import { TableRowAnimation, TableListAnimation } from "@/components/animations/table-row-animation";

export function MyList() {
  const items = [/* tu data */];

  return (
    <TableListAnimation staggerDelay={0.05}>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </TableListAnimation>
  );
}
```

## Parámetros

### `staggerDelay`
- **Tipo**: `number`
- **Default**: `0.05`
- **Descripción**: Delay en segundos entre cada fila. Valores menores = más rápido, valores mayores = más lento

### `rowDelay`
- **Tipo**: `number`
- **Default**: `0`
- **Descripción**: Delay inicial antes de empezar a animar

### `duration`
- **Tipo**: `number`
- **Default**: `0.4`
- **Descripción**: Duración en segundos de la animación de cada fila

## Easing

Las animaciones usan una curva de easing personalizada: `[0.34, 1.56, 0.64, 1]`

Esto proporciona un efecto "spring" suave y elegante (bounce ligero) que no es demasiado agresivo.

## Tablas que necesitan actualización

Lista de archivos con tablas que pueden beneficiarse de estas animaciones:

- `client/app/products/page.tsx` - 3 tablas
- `client/app/system/page.tsx` - 2 tablas
- `client/app/payments/page.tsx` - 1 tabla
- `client/components/layout/ticket-table.tsx`
- `client/components/contracts/contract-table.tsx`
- `client/app/clients/[id]/page.tsx`
- `client/components/budgets/budget-items-table.tsx`
- `client/components/budgets/budget-table.tsx`
- `client/components/clients/client-table.tsx`
- `client/components/users/user-table.tsx`
- Y más...

## Implementación Rápida

Para aplicar a una tabla existente:

1. Importa `AnimatedTableBody` y `AnimatedRow`
2. Reemplaza `<TableBody>` con `<AnimatedTableBody>`
3. Envuelve cada `<TableRow>` con `<AnimatedRow>`
4. ¡Listo!

### Ejemplo Antes:
```tsx
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Ejemplo Después:
```tsx
import { AnimatedTableBody, AnimatedRow } from "@/hooks/use-table-animation";

<Table>
  <TableHeader>...</TableHeader>
  <AnimatedTableBody>
    {items.map((item, index) => (
      <AnimatedRow key={item.id} delay={index * 0.05}>
        <TableCell>{item.name}</TableCell>
      </AnimatedRow>
    ))}
  </AnimatedTableBody>
</Table>
```

## Notas

- Las animaciones son completamente opcionales y no afectan la funcionalidad
- Son especialmente efectivas cuando se cargan datos de forma dinámica
- El hook de `framer-motion` es reutilizable en otros componentes también
