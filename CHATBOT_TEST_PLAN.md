# Plan de Pruebas - Sistema de Chatbot AdminFlow

## Fecha: 2025-12-31

## 🧪 PRUEBAS A REALIZAR

### 1. PRUEBAS DE CONFIGURACIÓN

#### Test 1.1: Guardar Configuración
- [ ] Abrir http://192.168.99.183:3000/system
- [ ] Ir a la pestaña "Chatbot"
- [ ] Verificar que los campos tengan valores por defecto
- [ ] Modificar URL de WAHA
- [ ] Modificar sesión
- [ ] Modificar API Key
- [ ] Cambiar delay de respuesta
- [ ] Presionar "Aplicar"
- [ ] Verificar toast de éxito
- [ ] Recargar página y verificar que los cambios persistan

**Resultado Esperado**: ✅ Configuración guardada correctamente

#### Test 1.2: Test de Conexión
- [ ] Configurar URL: `http://192.168.99.104:3000`
- [ ] Configurar sesión: `default`
- [ ] Configurar API Key: `e514563f761e44c78c5f84e0d29e46d1`
- [ ] Presionar "Test Link"
- [ ] Verificar mensaje de éxito o error específico

**Resultado Esperado**: ✅ Mensaje claro sobre el estado de la conexión

#### Test 1.3: Activar/Desactivar Módulos
- [ ] Desactivar módulo "Clientes"
- [ ] Desactivar módulo "Pagos"
- [ ] Guardar configuración
- [ ] Verificar que los comandos relacionados no funcionen
- [ ] Reactivar módulos
- [ ] Verificar que los comandos vuelvan a funcionar

**Resultado Esperado**: ✅ Módulos se activan/desactivan correctamente

### 2. PRUEBAS DE COMANDOS SIMPLES

#### Test 2.1: Comando /ping
**Enviar**: `/ping`
**Esperado**: `Pong! 🏓 El sistema AdminFlow está en línea. ✅`

#### Test 2.2: Comando /ayuda
**Enviar**: `/ayuda`
**Esperado**: Manual completo de comandos con formato

#### Test 2.3: Comando /resumen
**Enviar**: `/resumen`
**Esperado**: Estado general con tickets abiertos/resueltos y últimos 5 tickets

#### Test 2.4: Búsqueda de Cliente
**Enviar**: `Coca Cola` (o nombre de cliente existente)
**Esperado**: Ficha completa del cliente con tickets y pagos

#### Test 2.5: Comando sin /
**Enviar**: `ping` (sin barra)
**Esperado**: Debe funcionar igual que `/ping`

### 3. PRUEBAS DE CONSULTAS

#### Test 3.1: Consultar Tickets
**Enviar**: `/tickets`
**Esperado**: Menú con 3 opciones
**Seguir con**: `1`
**Esperado**: Lista de últimos 10 tickets

#### Test 3.2: Tickets por Cliente
**Enviar**: `/tickets Coca Cola`
**Esperado**: Tickets del cliente específico

#### Test 3.3: Consultar Contraseñas
**Enviar**: `/pass Coca Cola`
**Esperado**: Accesos y credenciales del cliente

#### Test 3.4: Consultar Pagos
**Enviar**: `/pagos`
**Esperado**: Menú de opciones de pagos
**Seguir con**: `2`
**Esperado**: Solicitud de nombre de cliente
**Enviar**: `Coca Cola`
**Esperado**: Historial de pagos con total

#### Test 3.5: Agenda del Día
**Enviar**: `/agenda hoy`
**Esperado**: Eventos programados para hoy

### 4. PRUEBAS DE FLUJOS MULTI-PASO

#### Test 4.1: Crear Ticket Nuevo
```
Enviar: /ticket nuevo
Esperado: Solicitud de nombre de cliente
Enviar: Coca Cola
Esperado: Confirmación de cliente
Enviar: SI
Esperado: Solicitud de asunto
Enviar: Internet no funciona
Esperado: Resumen y confirmación
Enviar: SI
Esperado: Ticket creado exitosamente
```

#### Test 4.2: Registrar Pago Nuevo
```
Enviar: /pago nuevo
Esperado: Solicitud de cliente
Enviar: Coca Cola
Esperado: Solicitud de monto
Enviar: 1500
Esperado: Solicitud de moneda
Enviar: UYU
Esperado: Resumen y confirmación
Enviar: SI
Esperado: Pago registrado
```

#### Test 4.3: Confirmar Pago Recibido
```
Enviar: /pago confirmado Coca Cola
Esperado: Confirmación de cliente
Enviar: SI
Esperado: Solicitud de monto
Enviar: 1500
Esperado: Solicitud de tipo
Enviar: Transferencia UYU
Esperado: Solicitud de concepto
Enviar: Mensualidad Enero
Esperado: Solicitud de estado (1 o 2)
Enviar: 1
Esperado: Resumen completo
Enviar: SI
Esperado: Pago confirmado y guardado
```

#### Test 4.4: Crear Cliente Nuevo
```
Enviar: /cliente nuevo
Esperado: Solicitud de nombre
Enviar: Test Cliente
Esperado: Solicitud de teléfono
Enviar: 099123456
Esperado: Solicitud de email
Enviar: test@example.com
Esperado: Resumen y confirmación
Enviar: SI
Esperado: Cliente creado con ID
```

#### Test 4.5: Programar Visita
```
Enviar: /agenda visita
Esperado: Solicitud de cliente
Enviar: Coca Cola
Esperado: Lista de técnicos
Enviar: 1
Esperado: Solicitud de fecha
Enviar: 2025-01-15
Esperado: Solicitud de hora
Enviar: 14:00
Esperado: Resumen de visita
Enviar: SI
Esperado: Visita agendada y técnico notificado
```

### 5. PRUEBAS DE CANCELACIÓN

#### Test 5.1: Cancelar Flujo
```
Enviar: /ticket nuevo
Esperado: Inicio de flujo
Enviar: cancelar
Esperado: Flujo cancelado, estado limpiado
```

#### Test 5.2: Timeout de Sesión
```
Enviar: /pago nuevo
Esperado: Inicio de flujo
Esperar: 6 minutos sin responder
Esperado: Mensaje de sesión expirada
```

### 6. PRUEBAS DE MANEJO DE ERRORES

#### Test 6.1: Cliente No Encontrado
**Enviar**: `/pass ClienteInexistente123`
**Esperado**: Mensaje de error claro

#### Test 6.2: Comando Inválido
**Enviar**: `/comandoinvalido`
**Esperado**: Mensaje de ayuda o comando no reconocido

#### Test 6.3: Monto Inválido
```
Enviar: /pago nuevo
Enviar: Coca Cola
Enviar: abc (texto en vez de número)
Esperado: Mensaje de error solicitando número válido
```

### 7. PRUEBAS DE LOGGING

#### Test 7.1: Verificar Logs en UI
- [ ] Enviar varios comandos
- [ ] Abrir http://192.168.99.183:3000/system
- [ ] Ir a pestaña Chatbot
- [ ] Verificar columna "Monitor Live"
- [ ] Confirmar que aparecen eventos inbound y outbound
- [ ] Verificar timestamps correctos
- [ ] Verificar colores diferentes para inbound/outbound

**Resultado Esperado**: ✅ Logs se muestran en tiempo real

### 8. PRUEBAS DE INTEGRACIÓN

#### Test 8.1: Webhook de WAHA
- [ ] Configurar webhook en WAHA: `http://192.168.99.183:5000/api/chatbot/webhook`
- [ ] Enviar mensaje desde WhatsApp
- [ ] Verificar que se recibe en AdminFlow
- [ ] Verificar que se procesa correctamente
- [ ] Verificar que se envía respuesta
- [ ] Verificar que se recibe en WhatsApp

**Resultado Esperado**: ✅ Flujo completo funciona

#### Test 8.2: Múltiples Usuarios Simultáneos
- [ ] Usuario A inicia flujo de ticket
- [ ] Usuario B inicia flujo de pago
- [ ] Usuario A continúa su flujo
- [ ] Usuario B continúa su flujo
- [ ] Verificar que no se cruzan las conversaciones

**Resultado Esperado**: ✅ Cada usuario mantiene su estado independiente

### 9. PRUEBAS DE RENDIMIENTO

#### Test 9.1: Respuesta Rápida
- [ ] Enviar `/ping`
- [ ] Medir tiempo de respuesta
- [ ] Debe ser < 5 segundos (incluyendo delay configurado)

#### Test 9.2: Consulta Compleja
- [ ] Enviar `/resumen`
- [ ] Verificar que responde incluso con muchos tickets
- [ ] Tiempo < 10 segundos

### 10. CHECKLIST FINAL

- [ ] Todos los comandos simples funcionan
- [ ] Todos los flujos multi-paso funcionan
- [ ] Cancelación funciona en todos los flujos
- [ ] Timeout funciona correctamente
- [ ] Logs se registran correctamente
- [ ] Errores se manejan apropiadamente
- [ ] Módulos se pueden activar/desactivar
- [ ] Test de conexión funciona
- [ ] Configuración persiste después de guardar
- [ ] Webhook recibe mensajes de WAHA
- [ ] Respuestas llegan a WhatsApp
- [ ] Múltiples usuarios pueden usar el bot simultáneamente

## 📊 RESULTADOS

### Comandos Probados: __ / 15
### Flujos Probados: __ / 6
### Errores Encontrados: __
### Estado General: ⬜ Pendiente / ✅ Aprobado / ❌ Requiere Correcciones

## 🐛 BUGS ENCONTRADOS

1. **Bug #1**: 
   - Descripción:
   - Pasos para reproducir:
   - Severidad: Alta / Media / Baja
   - Estado: Pendiente / Corregido

2. **Bug #2**:
   - Descripción:
   - Pasos para reproducir:
   - Severidad: Alta / Media / Baja
   - Estado: Pendiente / Corregido

## 💡 MEJORAS SUGERIDAS

1. 
2. 
3. 

## 📝 NOTAS ADICIONALES

- Configuración usada para pruebas:
  - WAHA URL: http://192.168.99.104:3000
  - Sesión: default
  - Delay: 4000ms
  
- Datos de prueba:
  - Cliente: Coca Cola
  - Técnico: [nombre]
  - Fecha de prueba: 2025-12-31
