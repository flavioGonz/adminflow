# Plan de Implementación - Mejoras en Pagos

## Tareas Solicitadas

### 1. ✅ Cambiar Combinaciones de Teclas
- **Estado**: Pendiente de corrección
- **Cambio**: De `Ctrl+Shift+X` a `Ctrl+Alt+X`
- **Archivos afectados**:
  - `client/components/command-palette.tsx` (corregir errores de sintaxis)
  - `client/hooks/use-keyboard-shortcuts.ts`
  - `COMMAND_PALETTE.md`

### 2. Edición en Vivo de Fecha en Tabla
- **Componente**: Tabla de pagos
- **Implementación**: DatePicker inline en la celda de fecha
- **Archivos**:
  - `client/app/payments/page.tsx`
- **Requerimientos**:
  - Usar componente DatePicker de shadcn/ui
  - Actualizar fecha en tiempo real
  - Guardar cambios automáticamente

### 3. Campo Ticket Linkeable
- **Implementación**: Convertir el campo ticket en un link
- **Destino**: `/tickets` (filtrado por el ticket específico)
- **Archivos**:
  - `client/app/payments/page.tsx`

### 4. Nuevo Estado "Enviado"
- **Estados actuales**: Pendiente, Pagado, Vencido
- **Nuevo estado**: Enviado
- **Archivos**:
  - `client/app/payments/page.tsx`
  - `server/routes/payments.js` (si hay validación backend)

### 5. Banderas de Monedas (Uruguay 🇺🇾 y USA 🇺🇸)
- **Ubicación**: Modal "Registrar Pago Nuevo"
- **Implementación**:
  - Usar emojis de banderas o SVGs
  - Mostrar junto a "Pesos" y "Dólares"
- **Archivos**:
  - `client/app/payments/page.tsx`

### 6. Tipos de Pago Adicionales
- **Tipos actuales**: Efectivo, Transferencia, Tarjeta
- **Nuevos tipos**: Abitab, Red Pagos, Mercado Pago
- **Ubicación**: Modal "Confirmar Pago"
- **Archivos**:
  - `client/app/payments/page.tsx`

### 7. Campo Condicional para Bancos (Uruguay)
- **Trigger**: Cuando se selecciona "Transferencia"
- **Contenido**: Select con bancos de Uruguay + logos
- **Bancos sugeridos**:
  - Banco República (BROU)
  - Banco Itaú
  - Banco Santander
  - Banco BBVA
  - Scotiabank
  - Banco Heritage
  - Banco Hipotecario
- **Implementación**:
  - Campo oculto que aparece condicionalmente
  - Select con logos de bancos
  - Mostrar logo del banco en la lista de pagos
- **Archivos**:
  - `client/app/payments/page.tsx`
  - Crear carpeta `public/banks/` para logos

## Orden de Implementación Sugerido

1. **Primero**: Corregir `command-palette.tsx` (archivo corrupto)
2. **Segundo**: Actualizar atajos de teclado a Ctrl+Alt
3. **Tercero**: Trabajar en mejoras de Pagos en este orden:
   - Nuevo estado "Enviado"
   - Tipos de pago adicionales
   - Banderas de monedas
   - Campo condicional de bancos
   - Ticket linkeable
   - Edición inline de fecha (más complejo)

## Recursos Necesarios

### Logos de Bancos
Necesitaremos descargar o crear logos SVG para:
- BROU
- Itaú
- Santander
- BBVA
- Scotiabank
- Heritage
- Hipotecario

### Componentes shadcn/ui
- DatePicker (para edición inline)
- Select (para bancos)
- Conditional rendering

## ¿Proceder?

Por favor confirma si quieres que:
1. Primero corrija el `command-palette.tsx`
2. Luego implemente las mejoras de Pagos una por una

O prefieres que me enfoque solo en las mejoras de Pagos y dejemos el command palette para después.
