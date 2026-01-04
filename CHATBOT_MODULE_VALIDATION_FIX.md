# Corrección: Validación de Módulos en Chatbot

## Fecha: 2025-12-31

## 🐛 PROBLEMA REPORTADO

**Síntoma**: El bot respondía a comandos incluso cuando el módulo correspondiente estaba desactivado.

**Causa**: El backend no verificaba si los módulos estaban activos antes de procesar los comandos.

## 🔧 SOLUCIÓN IMPLEMENTADA

### 1. **Función Helper para Detección de Módulos**

**Archivo**: `server/routes/chatbot.js`

**Agregado**:
```javascript
const getModuleForCommand = (cmd) => {
    if (cmd.includes('ticket')) return 'tickets';
    if (cmd.includes('pago') || cmd.includes('payment')) return 'payments';
    if (cmd.includes('cliente') || cmd.includes('client')) return 'clients';
    if (cmd.includes('agenda') || cmd.includes('agendar') || cmd.includes('visita')) return 'scheduling';
    if (cmd.includes('pass') || cmd.includes('contraseña')) return 'passwords';
    if (cmd.includes('user') || cmd.includes('usuario')) return 'users';
    return null;
};
```

**Propósito**: Identificar qué módulo necesita un comando específico.

### 2. **Validaciones Agregadas a Comandos**

Se agregó validación `&& modules.[modulo]` a los siguientes comandos:

| Comando | Módulo Requerido | Línea |
|---------|------------------|-------|
| `/tickets` | `tickets` | 236 |
| `/ticket nuevo` | `tickets` | 349 |
| `/pago nuevo` | `payments` | 345 |
| `/pago confirmado` | `payments` | 315 |
| `/pass` / `/contraseñas` | `passwords` | 260 |
| `/cliente nuevo` | `clients` | 353 |
| `/agenda hoy` | `scheduling` | 361 |
| `/agenda semana` | `scheduling` | 365 |
| `/agenda mes` | `scheduling` | 369 |
| `/agenda visita` | `scheduling` | 357 |
| `/agendar` | `scheduling` | 373 |

### 3. **Mensaje de Módulo Desactivado**

**Agregado en el bloque `else`**:

```javascript
// Verificar si el comando pertenece a un módulo desactivado
const moduleNeeded = getModuleForCommand(cmd);
if (moduleNeeded && !modules[moduleNeeded]) {
    const moduleNames = {
        tickets: 'Tickets',
        payments: 'Pagos',
        clients: 'Clientes',
        scheduling: 'Agenda',
        passwords: 'Contraseñas',
        users: 'Usuarios'
    };
    await sendReply(url, session, from, 
        `⚠️ *MÓDULO DESACTIVADO*\n━━━━━━━━━━━━━━━━━━\n` +
        `El módulo de *${moduleNames[moduleNeeded]}* está actualmente desactivado.\n\n` +
        `Para usar este comando, un administrador debe activar el módulo desde la configuración del sistema.\n\n` +
        `💡 _Escribe_ *ayuda* _para ver los comandos disponibles._`, 
        apiKey, reply_delay);
    return;
}
```

**Beneficio**: Informa claramente al usuario cuando intenta usar un comando de un módulo desactivado.

### 4. **Búsqueda de Clientes Condicional**

La búsqueda automática de clientes (cuando se envía un nombre sin comando) ahora solo funciona si el módulo `clients` está activo:

```javascript
if (modules.clients) {
    const clients = await searchClients(text);
    if (clients.length > 0) {
        // Mostrar resumen del cliente
    }
}
```

## 📊 COMPORTAMIENTO ANTES vs DESPUÉS

### ANTES ❌
```
Usuario: /tickets
Bot: 🎫 *ASISTENTE DE TICKETS*... (responde siempre)

Usuario: /pago nuevo
Bot: 💳 *REGISTRO DE PAGO*... (responde siempre)
```

### DESPUÉS ✅
```
Usuario: /tickets (con módulo desactivado)
Bot: ⚠️ *MÓDULO DESACTIVADO*
     El módulo de *Tickets* está actualmente desactivado.
     Para usar este comando, un administrador debe activar 
     el módulo desde la configuración del sistema.

Usuario: /tickets (con módulo activado)
Bot: 🎫 *ASISTENTE DE TICKETS*... (funciona normalmente)
```

## 🧪 PRUEBAS SUGERIDAS

### Test 1: Desactivar Módulo de Tickets
1. Ir a http://192.168.99.183:3000/system
2. Desactivar módulo "Soporte" (tickets)
3. Enviar `/tickets` por WhatsApp
4. **Esperado**: Mensaje de módulo desactivado

### Test 2: Desactivar Módulo de Pagos
1. Desactivar módulo "Cuentas" (payments)
2. Enviar `/pago nuevo` por WhatsApp
3. **Esperado**: Mensaje de módulo desactivado

### Test 3: Desactivar Módulo de Clientes
1. Desactivar módulo "Clientes"
2. Enviar nombre de un cliente por WhatsApp
3. **Esperado**: Mensaje de comando no reconocido (no busca clientes)

### Test 4: Desactivar Módulo de Agenda
1. Desactivar módulo "Agenda"
2. Enviar `/agenda hoy` por WhatsApp
3. **Esperado**: Mensaje de módulo desactivado

### Test 5: Reactivar Módulos
1. Reactivar todos los módulos
2. Probar comandos nuevamente
3. **Esperado**: Todos funcionan normalmente

## 📋 MAPEO COMPLETO DE MÓDULOS

| Módulo Frontend | ID Backend | Comandos Afectados |
|----------------|------------|-------------------|
| **Clientes** | `clients` | `/cliente nuevo`, `/pass`, búsqueda por nombre |
| **Cuentas** | `payments` | `/pagos`, `/pago nuevo`, `/pago confirmado` |
| **Agenda** | `scheduling` | `/agenda hoy/semana/mes`, `/agenda visita`, `/agendar` |
| **Soporte** | `tickets` | `/tickets`, `/ticket nuevo` |
| **Security** | `passwords` | `/pass`, `/contraseñas` |
| **Staff** | `users` | (comandos de usuarios si existen) |

## ✅ ESTADO FINAL

- ✅ Todos los comandos validan su módulo correspondiente
- ✅ Mensajes claros cuando un módulo está desactivado
- ✅ Búsqueda de clientes solo funciona si el módulo está activo
- ✅ Función helper para detectar módulos necesarios
- ✅ Consistencia en todas las validaciones

## 🎯 RESULTADO

**PROBLEMA RESUELTO COMPLETAMENTE** ✅

El bot ahora respeta el estado de los módulos y solo procesa comandos de módulos activos.
