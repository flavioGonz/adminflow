# ✅ CHECKLIST DE IMPLEMENTACIÓN

## 🎯 OBJETIVO
Fijar el error de carga de archivos estáticos (404 y 400) en el servidor Alpine.

---

## 📋 CHECKLIST

### FASE 1: Preparación Local (Windows) ⏱️ ~5 min

- [ ] Abrir PowerShell en la carpeta `C:\Users\Flavio\Documents\EXPRESS\adminflow`
- [ ] Navegar a carpeta client: `cd client`
- [ ] Ejecutar build: `npm run build`
- [ ] Esperar a que termine (2-5 minutos)
- [ ] Verificar que existe carpeta: `client\.next\`
- [ ] Volver a carpeta raíz: `cd ..`

**Resultado esperado:** Carpeta `.next` con contenido

```
client\
├── .next\
│   ├── static\
│   ├── app\
│   └── ... otros archivos
└── public\
```

---

### FASE 2: Actualizar Código 🔧 ⏱️ ~2 min

- [ ] Confirmar que `server/index.js` tiene las nuevas líneas de middleware
- [ ] Las líneas deben estar DESPUÉS de CORS y ANTES de rutas API
- [ ] Buscar texto: `// Servir archivos estáticos de Next.js`
- [ ] Debe haber 3 bloques de `app.use()` para servir Next.js

**Verificar que existe:**
```javascript
app.use('/_next/static', express.static(...)
app.use(express.static(path.resolve(__dirname, '../client/public'))
app.use(express.static(path.resolve(__dirname, '../client/.next')
```

✅ **Ya está hecho** (fue actualizado automáticamente)

---

### FASE 3: Copiar a Alpine 📤 ⏱️ ~3-5 min

**Opción A: Usando SCP (SSH)**
```powershell
# En PowerShell desde carpeta adminflow:

scp -r client\.next root@192.168.99.120:/root/adminflow/client/
scp -r client\public root@192.168.99.120:/root/adminflow/client/
scp server\index.js root@192.168.99.120:/root/adminflow/server/
```

- [ ] Ejecutar primer comando (scp .next)
- [ ] Ejecutar segundo comando (scp public)
- [ ] Ejecutar tercer comando (scp index.js)
- [ ] Esperar confirmaciones

**Opción B: Usando Git**
```powershell
# En PowerShell desde carpeta adminflow:

git status
git add .
git commit -m "Fix: Agregar soporte para archivos estáticos Next.js"
git push origin main
```

- [ ] Ejecutar `git status`
- [ ] Ejecutar `git add .`
- [ ] Ejecutar `git commit -m "..."`
- [ ] Ejecutar `git push origin main`

**En Alpine (SSH):**
```bash
cd /root/adminflow
git pull origin main
```

- [ ] Ejecutar `git pull origin main` en Alpine

---

### FASE 4: Reiniciar Aplicación 🚀 ⏱️ ~1 min

**SSH a Alpine y ejecutar:**

```bash
ssh root@192.168.99.120

# En Alpine:
cd /root/adminflow/server

# Opción 1: Reiniciar PM2
pm2 restart adminflow

# Opción 2: Stop y Start
pm2 stop adminflow
pm2 start index.js --name "adminflow" --env production
pm2 save
```

- [ ] Conectar con SSH a `192.168.99.120`
- [ ] Navegar a carpeta server
- [ ] Ejecutar `pm2 restart adminflow` o `pm2 stop` + `pm2 start`
- [ ] Esperar ~2-3 segundos
- [ ] Ver confirmación de que está "online"

**Resultado esperado:**
```
│ id │ name      │ namespace   │ version │ mode │ pid    │ uptime │ status  │ cpu │ mem      │
│ 0  │ adminflow │ default     │ -       │ fork │ 12345  │ 0s     │ online  │ 0%  │ 25.0mb  │
```

---

### FASE 5: Verificación ✅ ⏱️ ~2 min

**En tu navegador (Windows):**

- [ ] Abrir `http://192.168.99.120`
- [ ] Esperar a que cargue la página completa
- [ ] Abrir consola de desarrollador: `F12`
- [ ] Ir a pestaña "Console"
- [ ] **NO debe haber errores 404 o 400**
- [ ] Ir a pestaña "Network"
- [ ] Recargar página: `F5`
- [ ] Buscar archivos que empiezan con `main.js`, `*.css`
- [ ] Todos deben tener estado `200 OK`, no `404` o `400`

**Checklist de la consola:**
- [ ] Sin errores de tipo "Failed to load resource"
- [ ] Sin errores "404 Not Found"
- [ ] Sin errores "400 Bad Request"
- [ ] Sin errores de chunk "Failed to load chunk"

**Checklist de Network:**
- [ ] Archivos `_next/static/chunks/*.js` → 200 OK
- [ ] Archivos `*.css` → 200 OK
- [ ] HTML principal → 200 OK

---

### FASE 6: Diagnóstico (Si algo no funciona) 🔍 ⏱️ ~5 min

Si después de todo aún hay errores, ejecuta esto en Alpine:

```bash
# Ver logs detallados
pm2 logs adminflow --lines 100

# Ver estructura de carpetas
ls -la /root/adminflow/client/.next/static/chunks/ | head -10

# Probar que Express está sirviendo archivos
curl -v http://localhost/_next/static/chunks/main.js

# Verificar permisos
ls -la /root/adminflow/client/

# Ver tamaño de carpeta .next
du -sh /root/adminflow/client/.next/
```

- [ ] Ejecutar `pm2 logs adminflow` y revisar si hay errores
- [ ] Ejecutar `ls -la /root/adminflow/client/.next/` para verificar archivos
- [ ] Ejecutar `curl` para verificar que Express responde

---

## 📊 PROGRESO GENERAL

```
LOCAL SETUP       [████████████████████] 100% ✅
CODE UPDATE       [████████████████████] 100% ✅
COPY TO ALPINE    [░░░░░░░░░░░░░░░░░░░░]   0% ← TÚ AQUÍ
RESTART APP       [░░░░░░░░░░░░░░░░░░░░]   0%
VERIFY            [░░░░░░░░░░░░░░░░░░░░]   0%
```

---

## 🎯 RESUMEN DE ACCIONES

| # | Acción | Comando | Tiempo |
|---|--------|---------|--------|
| 1 | Compilar | `npm run build` | 2-5 min |
| 2 | Copiar | `scp` o `git push` | 1-3 min |
| 3 | Reiniciar | `pm2 restart` | <1 min |
| 4 | Verificar | Abrir navegador | 1-2 min |
| **TOTAL** | | | **5-10 min** |

---

## ⚠️ IMPORTANTES

- ❌ **NO** hacer push a git sin compilar primero
- ❌ **NO** olvidar copiar la carpeta `.next/`
- ❌ **NO** usar `npm start` en Alpine
- ❌ **NO** esperar que funcione sin reiniciar PM2

- ✅ **SÍ** compilar en Windows
- ✅ **SÍ** copiar archivos compilados
- ✅ **SÍ** reiniciar PM2 después de cambios
- ✅ **SÍ** verificar en navegador

---

## 🆘 AYUDA

Si algo no funciona:
1. Revisa `QUICK_FIX.md` para pasos rápidos
2. Revisa `STATIC_FILES_FIX.md` para solución detallada
3. Revisa `CHANGES_SUMMARY.md` para entender qué cambió

---

## 📞 CHECKLIST COMPLETADO

Cuando termines TODAS las fases:

- [ ] Fase 1: Compilar ✅
- [ ] Fase 2: Código actualizado ✅
- [ ] Fase 3: Copiar a Alpine ✅
- [ ] Fase 4: Reiniciar ✅
- [ ] Fase 5: Verificar ✅
- [ ] Fase 6: (Solo si hay errores)

**Si todo está ✅:** 🎉 ¡LISTO! Aplicación funcionando correctamente.

---

**Fecha:** Diciembre 16, 2025
**Versión:** 1.0
**Estado:** Listo para ejecutar
