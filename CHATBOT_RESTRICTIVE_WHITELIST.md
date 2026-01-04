# Sistema de Lista Blanca Restrictiva - Chatbot AdminFlow

## Fecha: 2025-12-31

## 🔒 COMPORTAMIENTO FINAL

### **POLÍTICA RESTRICTIVA POR DEFECTO**

El bot ahora funciona con una política de **seguridad máxima**:

```
❌ Sin números en lista blanca = Bot NO responde a NADIE
✅ Con números en lista blanca = Bot SOLO responde a esos números
```

---

## 📋 LÓGICA IMPLEMENTADA

### **Flujo de Validación**:

```javascript
1. Mensaje llega al webhook
   ↓
2. Extraer número del remitente
   ↓
3. ¿Hay números en la lista blanca?
   │
   ├─ NO → 🔴 BLOQUEAR (sin whitelist configurada)
   │
   └─ SÍ → ¿El número está en la lista?
              │
              ├─ NO → 🔴 BLOQUEAR (no autorizado)
              │
              └─ SÍ → ✅ PERMITIR (procesar mensaje)
```

---

## 💻 CÓDIGO IMPLEMENTADO

### **Backend** (`server/routes/chatbot.js`)

```javascript
// Verificar whitelist de números - RESTRICTIVO POR DEFECTO
const fromNumber = from.replace('@c.us', '').replace('@s.whatsapp.net', '');

if (!allowed_numbers || allowed_numbers.length === 0) {
    // Sin lista blanca configurada = NO responder a nadie
    console.log(`[CHATBOT] Sin lista blanca configurada - Bloqueando: ${fromNumber}`);
    addLog('blocked', `Sin whitelist - Bloqueado: ${fromNumber}`, 'Configure números permitidos');
    return res.json({ status: 'blocked', reason: 'no_whitelist_configured' });
}

// Verificar si el número está en la lista blanca
const isAllowed = allowed_numbers.some(num => {
    const cleanNum = num.replace(/\D/g, '');
    return fromNumber.includes(cleanNum) || cleanNum.includes(fromNumber);
});

if (!isAllowed) {
    console.log(`[CHATBOT] Número no autorizado: ${fromNumber}`);
    addLog('blocked', `Número bloqueado: ${fromNumber}`, 'No está en la whitelist');
    return res.json({ status: 'blocked', reason: 'number_not_allowed' });
}

// Si llegó aquí, el número está autorizado
addLog('inbound', `Mensaje de ${from}`, messageBody);
```

---

## 🎨 INTERFAZ ACTUALIZADA

### **Cambios Visuales**:

**ANTES** (Opcional):
```
🔹 Lista Blanca (Opcional)
   Solo estos números podrán usar el bot. 
   Deja vacío para permitir todos.
```

**AHORA** (Obligatoria):
```
🔴 Lista Blanca (Obligatoria)
   ⚠️ Solo estos números podrán usar el bot. 
   Sin números en la lista, el bot NO responderá a nadie.
```

**Colores**:
- Icono: Rojo (`text-red-500`)
- Título: Rojo (`text-red-600`)
- Fondo: Rojo claro (`bg-red-50/50`)
- Borde: Rojo (`border-red-200`)
- Texto: Rojo oscuro (`text-red-700`)

---

## 📊 EJEMPLOS DE USO

### **Caso 1: Sin Números en Lista Blanca**

```
Configuración:
allowed_numbers: []

Cualquier usuario: "ayuda"
→ 🔴 Bot NO responde
→ Log: "Sin whitelist - Bloqueado: [número]"
→ Razón: "Configure números permitidos"
```

### **Caso 2: Con Números en Lista Blanca**

```
Configuración:
allowed_numbers: ["59899123456", "59898765432"]

Usuario 59899123456: "ayuda"
→ ✅ Bot responde normalmente

Usuario 59898765432: "resumen"
→ ✅ Bot responde normalmente

Usuario 59811111111: "ayuda"
→ 🔴 Bot NO responde
→ Log: "Número bloqueado: 59811111111"
→ Razón: "No está en la whitelist"
```

---

## 🔍 LOGGING Y MONITOREO

### **Tipos de Bloqueo**:

#### **1. Sin Whitelist Configurada**
```json
{
  "type": "blocked",
  "title": "Sin whitelist - Bloqueado: 59899123456",
  "message": "Configure números permitidos",
  "status": "blocked",
  "reason": "no_whitelist_configured"
}
```

#### **2. Número No Autorizado**
```json
{
  "type": "blocked",
  "title": "Número bloqueado: 59811111111",
  "message": "No está en la whitelist",
  "status": "blocked",
  "reason": "number_not_allowed"
}
```

### **Logs en Consola**:
```
[CHATBOT] Sin lista blanca configurada - Bloqueando: 59899123456
[CHATBOT] Número no autorizado: 59811111111
[CHATBOT] Módulos cargados: { clients: true, payments: false, ... }
```

---

## ⚙️ CONFIGURACIÓN RECOMENDADA

### **Paso 1: Agregar Números Permitidos**

1. Ir a: http://192.168.99.183:3000/system
2. Pestaña: "Chatbot"
3. Sección: "Lista Blanca (Obligatoria)"
4. Agregar números uno por uno:
   - Escribir: `59899123456`
   - Click "Agregar" o Enter
   - Repetir para cada número

### **Paso 2: Guardar Configuración**

1. Verificar que los números estén en la lista
2. Click "Aplicar"
3. Verificar toast de confirmación

### **Paso 3: Verificar Funcionamiento**

1. Enviar mensaje desde número permitido → ✅ Debe responder
2. Enviar mensaje desde número NO permitido → 🔴 NO debe responder
3. Revisar logs en "Monitor Live" → Ver eventos bloqueados

---

## 🛡️ SEGURIDAD

### **Niveles de Protección**:

1. **Nivel 1**: Bot deshabilitado
   - `enabled: false`
   - No procesa ningún mensaje

2. **Nivel 2**: Sin whitelist
   - `allowed_numbers: []`
   - Bloquea TODOS los números

3. **Nivel 3**: Whitelist configurada
   - `allowed_numbers: ["59899123456"]`
   - Solo permite números específicos

4. **Nivel 4**: Módulos desactivados
   - `modules.tickets: false`
   - Bloquea comandos específicos

### **Combinación Recomendada**:
```json
{
  "enabled": true,
  "allowed_numbers": ["59899123456", "59898765432"],
  "modules": {
    "clients": true,
    "payments": true,
    "scheduling": true,
    "tickets": true,
    "passwords": false,
    "users": false
  }
}
```

---

## ✅ CHECKLIST DE SEGURIDAD

### **Configuración Inicial**:
- [ ] Bot habilitado (`enabled: true`)
- [ ] Al menos 1 número en whitelist
- [ ] Módulos necesarios activados
- [ ] Módulos sensibles desactivados (passwords, users)
- [ ] Configuración guardada

### **Verificación**:
- [ ] Número permitido puede usar el bot
- [ ] Número NO permitido es bloqueado
- [ ] Sin números en lista = nadie puede usar
- [ ] Logs muestran intentos bloqueados
- [ ] Módulos desactivados no responden

### **Monitoreo**:
- [ ] Revisar logs regularmente
- [ ] Verificar números bloqueados
- [ ] Actualizar whitelist según necesidad
- [ ] Revisar módulos activos

---

## 🎯 DIFERENCIAS ANTES vs AHORA

| Aspecto | ANTES | AHORA |
|---------|-------|-------|
| **Sin whitelist** | ✅ Responde a todos | 🔴 NO responde a nadie |
| **Con whitelist** | ✅ Solo a permitidos | ✅ Solo a permitidos |
| **Interfaz** | "Opcional" (gris) | "Obligatoria" (rojo) |
| **Mensaje** | "Deja vacío..." | "⚠️ Sin números..." |
| **Seguridad** | Permisiva | Restrictiva |
| **Default** | Abierto | Cerrado |

---

## 📝 NOTAS IMPORTANTES

1. **Formato de Números**:
   - Usar código de país: `59899123456`
   - Sin espacios ni guiones
   - Solo números

2. **Validación Flexible**:
   - Compara con y sin prefijos de WhatsApp
   - Usa `includes()` para coincidencias parciales
   - Remueve caracteres no numéricos

3. **Persistencia**:
   - Los números se guardan en la base de datos
   - Persisten entre reinicios del servidor
   - Se cargan automáticamente al iniciar

4. **Límites**:
   - No hay límite de números en la whitelist
   - Scroll automático si hay muchos números
   - Cada número ocupa ~40px de altura

---

## 🚀 RESULTADO FINAL

**SISTEMA COMPLETAMENTE RESTRICTIVO** 🔒

- ✅ Sin whitelist = Nadie puede usar el bot
- ✅ Con whitelist = Solo números autorizados
- ✅ Interfaz clara y advertencias visibles
- ✅ Logging completo de intentos bloqueados
- ✅ Fácil de configurar y mantener

**SEGURIDAD MÁXIMA IMPLEMENTADA** ✅
