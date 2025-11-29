# Command Palette - Atajos de Teclado

El **Command Palette** es un sistema de comandos rápidos que permite navegar y ejecutar acciones desde cualquier lugar de la aplicación.

## 🎯 Características

### ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+K` / `Cmd+K` | Abrir/Cerrar Command Palette |
| `Ctrl+H` | Ir al Dashboard (Home) |
| `Ctrl+Shift+C` | Ir a Clientes |
| `Ctrl+Shift+T` | Ir a Tickets |
| `Ctrl+Shift+P` | Ir a Pagos |
| `Ctrl+Shift+B` | Ir a Presupuestos |
| `Ctrl+Shift+R` | Ir a Repositorio |
| `Ctrl+Shift+E` | Ir a Calendario (Events) |
| `Ctrl+N` | Nuevo registro (abre Command Palette) |
| `Ctrl+/` | Enfocar búsqueda |
| `Shift+?` | Mostrar ayuda de atajos |
| `↑` `↓` | Navegar entre opciones |
| `Enter` | Ejecutar acción seleccionada |
| `Esc` | Cerrar Command Palette |

### 🔍 Búsqueda Global

El Command Palette permite buscar y acceder rápidamente a:

- **Clientes**: Busca por nombre o email
- **Tickets**: Busca por título o ID
- **Navegación**: Accede a cualquier sección del sistema
- **Acciones Rápidas**: Crea nuevos registros con un clic

### ⚡ Acciones Rápidas

Desde el Command Palette puedes:

- ✅ Crear Nuevo Cliente
- ✅ Crear Nuevo Ticket
- ✅ Registrar Pago
- ✅ Crear Contrato
- ✅ Crear Presupuesto

### 🧭 Navegación Rápida

Accede instantáneamente a:

- Dashboard
- Clientes
- Tickets
- Pagos
- Contratos
- Presupuestos
- Calendario
- Bóveda de Archivos
- Notificaciones
- Configuración del Sistema
- Base de Datos

## 💡 Uso

1. **Abrir el Command Palette**: Presiona `Ctrl+K` (Windows/Linux) o `Cmd+K` (Mac)
2. **Buscar**: Escribe lo que necesitas (cliente, acción, sección)
3. **Navegar**: Usa las flechas `↑` `↓` para moverte entre resultados
4. **Ejecutar**: Presiona `Enter` para ejecutar la acción seleccionada

## 🎨 Grupos de Comandos

Los comandos están organizados en grupos para facilitar la navegación:

- **⚡ Acciones Rápidas**: Crear nuevos registros
- **🧭 Navegación**: Ir a diferentes secciones
- **👥 Clientes**: Resultados de búsqueda de clientes
- **🎫 Tickets**: Resultados de búsqueda de tickets

## 🔧 Implementación Técnica

### Componente Principal

El Command Palette está implementado en `client/components/command-palette.tsx` y utiliza:

- **shadcn/ui Command**: Componente base para el diálogo de comandos
- **React Hooks**: `useState`, `useEffect`, `useCallback` para gestión de estado
- **Next.js Router**: Para navegación programática
- **API Fetch**: Carga dinámica de clientes y tickets

### Integración

El componente está integrado globalmente en `DashboardLayout`, lo que significa que está disponible en todas las páginas protegidas de la aplicación.

## 🚀 Mejoras Futuras

- [ ] Historial de comandos recientes
- [ ] Comandos personalizados por usuario
- [ ] Búsqueda en contenido de documentos
- [ ] Acciones en lote
- [ ] Temas personalizados
- [ ] Comandos de voz
- [ ] Sincronización de favoritos
