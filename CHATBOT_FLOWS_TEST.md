# Test de Flujos del Chatbot

## Flujo 1: CONFIRMAR PAGO (/pago confirmado)

### Pasos:
```
1. Usuario: /pago confirmado Coca Cola.
   Bot: ✨ He encontrado a: *Coca Cola*
        ¿Es correcto? (*SI* / *NO*)

2. Usuario: SI
   Bot: 💵 *PASO 2/4:* ¿Cuál es el *monto* recibido?

3. Usuario: 1500
   Bot: 💱 *PASO 3/4:* ¿Moneda y forma de pago?
        _(Ej: Efectivo UYU, Transferencia USD)_

4. Usuario: Transferencia UYU
   Bot: 📝 *PASO 4/4:* ¿Concepto del pago?
        _(Ej: Mensualidad Enero)_

5. Usuario: Mensualidad Enero
   Bot: 🤔 *¿Cómo clasificar este registro?*
        1️⃣ Ya fue realizado (Cobro en mano/banco).
        2️⃣ Solo registro de pago pendiente.
        _Responde 1 o 2._

6. Usuario: 1
   Bot: 💎 *RESUMEN DE OPERACIÓN*
        ━━━━━━━━━━━━━━━━━━
        👤 Cliente: Coca Cola
        💰 Monto: 1500
        💳 Tipo: Transferencia UYU
        📝 Concepto: Mensualidad Enero
        📌 Estado: PAGADO
        
        ¿Confirmas el registro? (*SI* / *cancelar*)

7. Usuario: SI
   Bot: ✅ *REGISTRO EXITOSO*
        La operación ha sido guardada y el balance del cliente actualizado.
```

### Estado Esperado:
- ✅ Pago creado en DB
- ✅ Status: "Pagado"
- ✅ Method: "Transferencia UYU"
- ✅ Concept: "Mensualidad Enero"
- ✅ Currency: "UYU"
- ✅ Amount: 1500

---

## Flujo 2: NUEVO PAGO (/pago nuevo)

### Pasos:
```
1. Usuario: /pago nuevo
   Bot: 💳 *REGISTRO DE PAGO*
        ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
        1️⃣ Escribe el nombre del cliente.
        2️⃣ Indica el monto.
        3️⃣ Selecciona moneda.
        4️⃣ Confirmación final.
        
        👤 ¿Para qué cliente?

2. Usuario: Coca Cola.
   Bot: 💵 *PASO 2/4:* ¿Monto para *Coca Cola*?
        _(Ejemplo: 1500)_

3. Usuario: 2000
   Bot: 💱 *PASO 3/4:* ¿Moneda?
        _(UYU, USD, ARS)_

4. Usuario: USD
   Bot: 📝 *RESUMEN DE PAGO*
        ━━━━━━━━━━━━━━━━━━
        👤 Cliente: Coca Cola
        💰 Monto: 2000 USD
        
        ¿Registrar este pago como pendiente? (*SI* / *cancelar*)

5. Usuario: SI
   Bot: ✅ *OPERACIÓN COMPLETADA*
        El pago pendiente ha sido registrado en la ficha del cliente.
```

### Estado Esperado:
- ✅ Pago creado en DB
- ✅ Status: "Pendiente"
- ✅ Currency: "USD"
- ✅ Amount: 2000

---

## Flujo 3: NUEVO TICKET (/ticket nuevo)

### Pasos:
```
1. Usuario: /ticket nuevo
   Bot: 🎫 *APERTURA DE TICKET*
        ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
        1️⃣ Busca al cliente.
        2️⃣ Define el asunto.
        3️⃣ Revisión de contrato.
        4️⃣ Notificación técnica.
        
        👤 ¿Quién reporta el problema?

2. Usuario: Coca Cola.
   Bot: 📝 *PASO 2/4:* Asunto del ticket para *Coca Cola*?

3. Usuario: Internet no funciona
   Bot: 🎫 *RESUMEN DE TICKET*
        ━━━━━━━━━━━━━━━━━━
        👤 Cliente: Coca Cola
        📝 Asunto: Internet no funciona
        📜 Contrato activo: ✅
        
        ¿Crear este ticket ahora? (*SI* / *cancelar*)

4. Usuario: SI
   Bot: ✅ *TICKET ABIERTO*
        El equipo técnico ha sido notificado.
```

### Estado Esperado:
- ✅ Ticket creado en DB
- ✅ Title: "Internet no funciona"
- ✅ Status: "Nuevo"
- ✅ Priority: "medium"

---

## Flujo 4: NUEVO CLIENTE (/cliente nuevo)

### Pasos:
```
1. Usuario: /cliente nuevo
   Bot: 👤 *ALTA DE CLIENTE*
        ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
        1️⃣ Nombre completo.
        2️⃣ WhatsApp/Teléfono.
        3️⃣ Email de contacto.
        4️⃣ Registro oficial.
        
        🏷 ¿Cómo se llama el nuevo cliente?

2. Usuario: Test Cliente
   Bot: 📱 ¿Número de teléfono?

3. Usuario: 099123456
   Bot: 📧 ¿Correo electrónico?

4. Usuario: test@example.com
   Bot: 👤 *RESUMEN DE CLIENTE*
        ━━━━━━━━━━━━━━━━━━
        📌 Nombre: Test Cliente
        📱 Tel: 099123456
        📧 Email: test@example.com
        
        ¿Confirmas el registro? (*SI* / *cancelar*)

5. Usuario: SI
   Bot: ✅ *CLIENTE CREADO*
        Nombre: Test Cliente
        ID: [ID generado]
```

### Estado Esperado:
- ✅ Cliente creado en DB
- ✅ Name: "Test Cliente"
- ✅ Phone: "099123456"
- ✅ Email: "test@example.com"

---

## Flujo 5: PROGRAMAR VISITA (/agenda visita)

### Pasos:
```
1. Usuario: /agenda visita
   Bot: 📅 *NUEVA VISITA*
        ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
        👤 ¿Para qué cliente?

2. Usuario: Coca Cola.
   Bot: 👤 *ASIGNAR A:*
        ━━━━━━━━━━━━━━━━━━
        1️⃣ Flavio González
        2️⃣ [Otro técnico]
        
        _Responde con el número._

3. Usuario: 1
   Bot: 📅 ¿Qué día? (Ej: 2025-01-15)

4. Usuario: 2025-01-15
   Bot: ⏰ ¿A qué hora? (Ej: 14:00)

5. Usuario: 14:00
   Bot: 📍 *CONFIRMAR VISITA*
        ━━━━━━━━━━━━━━━━━━
        👤 Cliente: Coca Cola
        👷 Asignado: Flavio González
        📅 Fecha: 2025-01-15
        ⏰ Hora: 14:00
        
        ¿Correcto? (*SI* / *cancelar*)

6. Usuario: SI
   Bot: ✅ *VISITA AGENDADA*
        El evento ha sido creado y se ha notificado a *Flavio González* via WhatsApp.
```

### Estado Esperado:
- ✅ Evento creado en calendar_events
- ✅ Cliente asociado
- ✅ Técnico asignado
- ✅ Fecha y hora correctas

---

## PROBLEMAS CONOCIDOS CORREGIDOS:

1. ✅ **createPaymentForClient** - Ahora usa data.status y data.method
2. ✅ **Validación de módulos** - Todos los comandos verifican módulos
3. ✅ **Toggle de módulos** - Guarda automáticamente
4. ✅ **Persistencia** - Estado se mantiene al recargar

---

## PRUEBAS PENDIENTES:

- [ ] Probar flujo completo de pago confirmado
- [ ] Probar flujo de pago nuevo
- [ ] Probar flujo de ticket nuevo
- [ ] Probar flujo de cliente nuevo
- [ ] Probar flujo de agenda visita
- [ ] Verificar que los datos se guardan correctamente en DB
- [ ] Verificar que el estado se limpia después de completar
- [ ] Verificar timeout de 5 minutos
- [ ] Verificar comando "cancelar" en medio del flujo
