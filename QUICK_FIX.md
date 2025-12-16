# 🚨 ACCIONES INMEDIATAS - Fijar Error de Archivos Estáticos

## El Problema
Tu servidor Alpine no está sirviendo los archivos `.css` y `.js` compilados de Next.js → errores 404 y 400.

## La Solución (3 pasos)

### PASO 1: Compilar el cliente en tu PC local ⚡
Abre PowerShell en tu Windows y ejecuta:

```powershell
cd C:\Users\Flavio\Documents\EXPRESS\adminflow
cd client
npm run build
cd ..
```

⏱️ Esto toma 2-5 minutos. Espera a que termine.

**Verifica que se creó:** Debe existir `client\.next\` con archivos compilados.

---

### PASO 2: Copiar archivos compilados a Alpine 📤

**Opción A: Si tienes acceso SSH**
```powershell
# En PowerShell, desde la carpeta adminflow:
scp -r client\.next root@192.168.99.120:/root/adminflow/client/
scp -r client\public root@192.168.99.120:/root/adminflow/client/
scp server\index.js root@192.168.99.120:/root/adminflow/server/
```

**Opción B: Si uses git**
```powershell
git add .
git commit -m "Fix: Agregar soporte para archivos estáticos Next.js"
git push origin main
# Luego en Alpine: git pull origin main
```

---

### PASO 3: Reiniciar la aplicación en Alpine 🔄

**SSH a tu servidor Alpine:**
```bash
ssh root@192.168.99.120
cd /root/adminflow/server
pm2 stop adminflow
pm2 start index.js --name "adminflow" --env production
pm2 save
```

**O simplemente:**
```bash
pm2 restart adminflow
```

---

## ✅ Verificar que funciona

1. Abre en tu navegador: `http://192.168.99.120`
2. Abre la consola del navegador (F12)
3. Deberías ver la página cargando **SIN errores 404 o 400**

---

## 🔍 Si todavía hay errores

**Ejecuta este comando en Alpine para diagnosticar:**
```bash
# Ver los últimos logs
pm2 logs adminflow --lines 50

# Ver estructura de carpetas
ls -la /root/adminflow/client/.next/ | head -20

# Verificar que Express está sirviendo los archivos
curl -I http://localhost:80/_next/static/chunks/main.js
# Debería responder con 200, no 404
```

---

## 📋 Summary

| Paso | Comando | Tiempo |
|------|---------|--------|
| 1 | `npm run build` en carpeta client | 2-5 min |
| 2 | Copiar `.next` y `public` a Alpine | 1-2 min |
| 3 | `pm2 restart adminflow` | < 1 min |

**Total: ~5 minutos para fijar el problema**

---

## 💡 Por qué pasó esto

Cuando creas una aplicación con Next.js + Express:
1. Next.js compila el código en una carpeta `.next/`
2. Express debe SERVIR esa carpeta como archivos estáticos
3. Sin eso, el navegador no puede descargar CSS/JS

**Lo que faltaba:** El middleware de Express que sirve los archivos `.next/` ← ✅ Ya está hecho

**Qué falta ahora:** Compilar y copiar la carpeta `.next/` a producción ← 👈 Esto es lo que debes hacer

---

**Preguntas?** Revisa `STATIC_FILES_FIX.md` para más detalles
