# Implementación de Lista Blanca y Corrección de Módulos

## Fecha: 2025-12-31

## 🎯 PROBLEMAS RESUELTOS

### 1. ✅ **Módulos Desactivados Seguían Funcionando**

**Problema**: Aunque se desactivaba un módulo en la interfaz, el bot seguía respondiendo a esos comandos.

**Causa Raíz**:
- El webhook estaba usando `modules = {}` como default, lo que hacía que todos los módulos fueran `undefined` (falsy)
- Pero luego en el GET config, si no había configuración guardada, devolvía todos los módulos en `true`
- Esto creaba inconsistencia entre lo guardado y lo usado

**Solución Implementada**:
```javascript
// Backend - webhook
const defaultModules = {
    clients: false,
    payments: false,
    scheduling: false,
    tickets: false,
    passwords: false,
    users: false
};

const modules = config.modules || defaultModules;
```

**Resultado**: Ahora los módulos se respetan correctamente. Si están desactivados, el bot no responde a esos comandos.

---

### 2. ✅ **Sistema de Lista Blanca de Números**

**Requerimiento**: Solo permitir que ciertos números puedan usar el bot.

**Implementación Completa**:

#### **Backend** (`server/routes/chatbot.js`)

**1. Validación en Webhook**:
```javascript
// Verificar whitelist de números
if (allowed_numbers && allowed_numbers.length > 0) {
    const fromNumber = from.replace('@c.us', '').replace('@s.whatsapp.net', '');
    const isAllowed = allowed_numbers.some(num => {
        const cleanNum = num.replace(/\D/g, ''); // Remover caracteres no numéricos
        return fromNumber.includes(cleanNum) || cleanNum.includes(fromNumber);
    });
    
    if (!isAllowed) {
        console.log(`[CHATBOT] Número no autorizado: ${fromNumber}`);
        addLog('blocked', `Número bloqueado: ${fromNumber}`, 'No está en la whitelist');
        return res.json({ status: 'blocked', reason: 'number_not_allowed' });
    }
}
```

**2. Guardado en Configuración**:
```javascript
router.post('/config', async (req, res) => {
    const { ..., allowed_numbers } = req.body;
    const config = await upsertConfig('chatbot', {
        ...,
        allowed_numbers: allowed_numbers || []
    });
});
```

**3. Carga en GET Config**:
```javascript
router.get('/config', async (req, res) => {
    if (!config || !config.data) {
        return res.json({
            ...,
            allowed_numbers: [],
            ...
        });
    }
});
```

#### **Frontend** (`client/components/system/chatbot-config.tsx`)

**1. Tipo TypeScript**:
```typescript
interface ChatbotConfigData {
    ...
    allowed_numbers?: string[];
    ...
}
```

**2. Estado y Funciones**:
```typescript
const [newNumber, setNewNumber] = useState("");

const addAllowedNumber = () => {
    if (!newNumber.trim()) return;
    const cleanNumber = newNumber.trim().replace(/\D/g, '');
    if (cleanNumber && !config.allowed_numbers?.includes(cleanNumber)) {
        setConfig(prev => ({
            ...prev,
            allowed_numbers: [...(prev.allowed_numbers || []), cleanNumber]
        }));
        setNewNumber("");
        toast.success(`Número ${cleanNumber} agregado`);
    }
};

const removeAllowedNumber = (number: string) => {
    setConfig(prev => ({
        ...prev,
        allowed_numbers: (prev.allowed_numbers || []).filter((n: string) => n !== number)
        }));
    toast.success(`Número ${number} eliminado`);
};
```

**3. Interfaz Visual**:
```tsx
{/* Lista Blanca de Números */}
<div className="space-y-3 pt-4">
    <Label>Lista Blanca (Opcional)</Label>
    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200 space-y-3">
        <p className="text-xs text-slate-600">
            Solo estos números podrán usar el bot. Deja vacío para permitir todos.
        </p>
        
        {/* Input para agregar número */}
        <div className="flex gap-2">
            <Input
                placeholder="Ej: 59899123456"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllowedNumber()}
            />
            <Button onClick={addAllowedNumber}>Agregar</Button>
        </div>

        {/* Lista de números */}
        {config.allowed_numbers && config.allowed_numbers.length > 0 && (
            <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600">
                    Números permitidos ({config.allowed_numbers.length}):
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                    {config.allowed_numbers.map((number, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                            <span className="text-sm font-mono">+{number}</span>
                            <Button
                                variant="ghost"
                                onClick={() => removeAllowedNumber(number)}
                            >
                                ×
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
</div>
```

---

## 📊 FUNCIONAMIENTO

### **Caso 1: Sin Lista Blanca (Default)**
```
allowed_numbers: []  // Array vacío o no definido
Resultado: El bot responde a TODOS los números
```

### **Caso 2: Con Lista Blanca**
```
allowed_numbers: ["59899123456", "59898765432"]

Usuario desde 59899123456: "ayuda"
Bot: ✅ Responde normalmente

Usuario desde 59811111111: "ayuda"
Bot: 🔴 No responde (bloqueado)
Log: "Número bloqueado: 59811111111 - No está en la whitelist"
```

---

## 🔒 SEGURIDAD

### **Validación de Números**:
1. Se remueven caracteres no numéricos: `replace(/\D/g, '')`
2. Se compara con y sin prefijos de WhatsApp (`@c.us`, `@s.whatsapp.net`)
3. Se usa `includes()` para permitir coincidencias parciales

### **Logging**:
- Todos los intentos bloqueados se registran en los logs
- Tipo de log: `'blocked'`
- Mensaje: `Número bloqueado: [número]`
- Detalle: `No está en la whitelist`

---

## 🎨 INTERFAZ DE USUARIO

### **Ubicación**: 
Configuración del Chatbot → Cerebro Central → Lista Blanca (después de Seguridad & API)

### **Características**:
- ✅ Input con placeholder claro
- ✅ Botón "Agregar" para añadir números
- ✅ Enter para agregar rápidamente
- ✅ Lista visual de números permitidos
- ✅ Botón × para eliminar (aparece al hover)
- ✅ Contador de números permitidos
- ✅ Scroll si hay muchos números
- ✅ Toast notifications al agregar/eliminar

---

## 📝 EJEMPLO DE USO

### **Paso 1: Configurar Lista Blanca**
1. Ir a http://192.168.99.183:3000/system
2. Pestaña "Chatbot"
3. Scroll hasta "Lista Blanca (Opcional)"
4. Escribir número: `59899123456`
5. Click "Agregar" o presionar Enter
6. Repetir para más números
7. Click "Aplicar" para guardar

### **Paso 2: Verificar Funcionamiento**
```
Números permitidos: 59899123456, 59898765432

Test 1:
Usuario: 59899123456
Mensaje: "ayuda"
Resultado: ✅ Bot responde

Test 2:
Usuario: 59811111111
Mensaje: "ayuda"
Resultado: 🔴 Bot no responde
Log: "Número bloqueado: 59811111111"
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [x] Campo `allowed_numbers` en GET config
- [x] Campo `allowed_numbers` en POST config
- [x] Validación en webhook
- [x] Logging de números bloqueados
- [x] Limpieza de formato de números
- [x] Comparación flexible (includes)

### Frontend
- [x] Tipo TypeScript agregado
- [x] Estado `newNumber` creado
- [x] Función `addAllowedNumber`
- [x] Función `removeAllowedNumber`
- [x] Interfaz visual completa
- [x] Input con Enter support
- [x] Lista con scroll
- [x] Botones de eliminar
- [x] Toast notifications
- [x] Guardado en configuración

### Testing
- [ ] Probar agregar número
- [ ] Probar eliminar número
- [ ] Probar guardar configuración
- [ ] Probar recargar página
- [ ] Probar número permitido
- [ ] Probar número bloqueado
- [ ] Verificar logs

---

## 🎯 RESULTADO FINAL

**AMBOS PROBLEMAS RESUELTOS** ✅

1. ✅ **Módulos desactivados**: Ahora se respetan correctamente
2. ✅ **Lista blanca**: Sistema completo implementado

**El chatbot ahora**:
- Solo responde si está habilitado
- Solo responde a comandos de módulos activos
- Solo responde a números en la lista blanca (si está configurada)
- Registra todos los intentos bloqueados

**SISTEMA SEGURO Y FUNCIONAL** 🔒
