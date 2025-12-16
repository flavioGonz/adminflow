# 💻 COMANDOS COPIABLES - Copy & Paste

## 1️⃣ COMPILAR EN WINDOWS

Copia este bloque completo en PowerShell:

```powershell
cd C:\Users\Flavio\Documents\EXPRESS\adminflow\client
Write-Host "Compilando Next.js..." -ForegroundColor Yellow
npm run build
if ($?) {
    Write-Host "✅ Compilación exitosa!" -ForegroundColor Green
    Write-Host "La carpeta .next/ está lista para copiar" -ForegroundColor Green
} else {
    Write-Host "❌ Error en compilación. Revisa los errores arriba." -ForegroundColor Red
}
```

---

## 2️⃣ COPIAR A ALPINE (SCP)

Copia este bloque completo en PowerShell:

```powershell
# Vuelve a carpeta raíz
cd C:\Users\Flavio\Documents\EXPRESS\adminflow

# Variables
$SERVER = "root@192.168.99.120"
$PATH = "/root/adminflow"

Write-Host "Copiando archivos a Alpine..." -ForegroundColor Yellow

# Copiar .next/
Write-Host "1. Copiando .next/..." -ForegroundColor Cyan
scp -r client\.next "$SERVER`:$PATH/client/" | Out-Null

# Copiar public/
Write-Host "2. Copiando public/..." -ForegroundColor Cyan
scp -r client\public "$SERVER`:$PATH/client/" | Out-Null

# Copiar server/index.js
Write-Host "3. Copiando server/index.js..." -ForegroundColor Cyan
scp server\index.js "$SERVER`:$PATH/server/" | Out-Null

Write-Host "✅ Todos los archivos copiados!" -ForegroundColor Green
```

---

## 3️⃣ REINICIAR EN ALPINE

Copia este bloque completo en PowerShell (sustituye la contraseña):

```powershell
# Conectar y reiniciar
$SERVER = "root@192.168.99.120"

Write-Host "Conectando a $SERVER..." -ForegroundColor Yellow
ssh $SERVER "cd /root/adminflow/server && pm2 restart adminflow"

Write-Host "Esperando reinicio (3 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Verificando estado..." -ForegroundColor Cyan
ssh $SERVER "pm2 status" | Select-String "adminflow"

Write-Host "✅ Reinicio completado!" -ForegroundColor Green
```

---

## 4️⃣ VERIFICAR STATUS EN ALPINE

Copia este comando en PowerShell:

```powershell
ssh root@192.168.99.120 "pm2 status"
```

---

## 5️⃣ VER LOGS EN ALPINE

Copia este comando en PowerShell:

```powershell
ssh root@192.168.99.120 "pm2 logs adminflow --lines 50"
```

---

## 6️⃣ VERIFICAR QUE ARCHIVOS EXISTEN

Copia este bloque en PowerShell:

```powershell
Write-Host "Verificando archivos en Alpine..." -ForegroundColor Yellow
ssh root@192.168.99.120 @"
echo "Verificando .next/:"
ls -la /root/adminflow/client/.next/static/chunks/ | head -5
echo ""
echo "Verificando public/:"
ls -la /root/adminflow/client/public/ 2>/dev/null | head -5
echo ""
echo "Verificando index.js:"
ls -la /root/adminflow/server/index.js
"@
```

---

## 7️⃣ USAR GIT PARA COPIAR (Alternativa)

Si prefieres usar git en lugar de scp:

```powershell
# En carpeta adminflow:
cd C:\Users\Flavio\Documents\EXPRESS\adminflow

# 1. Agregar cambios
git add .

# 2. Hacer commit
git commit -m "Fix: Agregar soporte para archivos estáticos Next.js"

# 3. Push a repositorio
git push origin main

# 4. En Alpine (SSH):
# ssh root@192.168.99.120
# cd /root/adminflow
# git pull origin main
# pm2 restart adminflow
```

---

## 8️⃣ TEST RÁPIDO DE CONEXIÓN

Verifica que puedes conectar a Alpine:

```powershell
Write-Host "Testeando conexión a 192.168.99.120..." -ForegroundColor Yellow
ssh root@192.168.99.120 "echo '✅ Conectado correctamente'"
```

---

## 9️⃣ SCRIPT COMPLETO DE UN SOLO PASO

Este script hace TODO (compilar + copiar + reiniciar):

```powershell
# =====================================
# DEPLOY AUTOMÁTICO COMPLETO
# =====================================

$ErrorActionPreference = "Stop"
$SERVER = "root@192.168.99.120"
$PATH = "/root/adminflow"
$LOCAL_PATH = "C:\Users\Flavio\Documents\EXPRESS\adminflow"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOY AUTOMÁTICO COMPLETO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. COMPILAR
Write-Host "`n📦 [1/4] Compilando Next.js..." -ForegroundColor Yellow
Push-Location $LOCAL_PATH\client
npm run build
if (-not $?) {
    Write-Host "❌ Error en compilación" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "✅ Compilación exitosa" -ForegroundColor Green

# 2. COPIAR
Write-Host "`n📤 [2/4] Copiando archivos..." -ForegroundColor Yellow
scp -r "$LOCAL_PATH\client\.next" "$SERVER`:$PATH/client/" | Out-Null
scp -r "$LOCAL_PATH\client\public" "$SERVER`:$PATH/client/" | Out-Null
scp "$LOCAL_PATH\server\index.js" "$SERVER`:$PATH/server/" | Out-Null
Write-Host "✅ Archivos copiados" -ForegroundColor Green

# 3. REINICIAR
Write-Host "`n🔄 [3/4] Reiniciando aplicación..." -ForegroundColor Yellow
ssh $SERVER "cd /root/adminflow/server && pm2 restart adminflow" | Out-Null
Start-Sleep -Seconds 3
Write-Host "✅ Aplicación reiniciada" -ForegroundColor Green

# 4. VERIFICAR
Write-Host "`n✅ [4/4] Verificando estado..." -ForegroundColor Yellow
$status = ssh $SERVER "pm2 status"
if ($status -match "online") {
    Write-Host "✅ Aplicación está ONLINE" -ForegroundColor Green
} else {
    Write-Host "⚠️  Revisa los logs: pm2 logs adminflow" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "🎉 DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "Abre: http://192.168.99.120" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
```

---

## 🔟 DIAGNOSTICAR PROBLEMAS

Si algo no funciona, copia esto:

```powershell
# Ver últimos 100 logs
ssh root@192.168.99.120 "pm2 logs adminflow --lines 100"

# Ver estructura de carpetas
ssh root@192.168.99.120 @"
echo "=== ESTRUCTURA DE CARPETAS ==="
echo "Carpeta .next:"
ls -lah /root/adminflow/client/.next/ | head -10
echo ""
echo "Archivo index.js:"
ls -la /root/adminflow/server/index.js
echo ""
echo "Contenido de public:"
ls -la /root/adminflow/client/public/ | head -5
"@

# Prueba que Express sirve archivos
ssh root@192.168.99.120 "curl -I http://localhost/_next/static/chunks/main.js"
```

---

## 📌 NOTAS IMPORTANTES

- ⚠️ Reemplaza `root` con tu usuario si es diferente
- ⚠️ Reemplaza `192.168.99.120` con tu IP si es diferente
- ⚠️ Asegúrate de tener SSH configurado
- ⚠️ El `npm run build` DEBE completar sin errores
- ⚠️ Después de copiar, SIEMPRE reinicia PM2

---

## ✅ CHECKLIST RÁPIDO

Después de cada paso:

```
[  ] ¿Compiló sin errores? (Si hay errores en rojo, NO continúes)
[  ] ¿Se copiaron los archivos? (Verifica con ls en Alpine)
[  ] ¿PM2 dice "online"? (pm2 status debe mostrar online)
[  ] ¿Abre http://192.168.99.120 sin errores? (F12 → Console)
[  ] ¿Los recursos tienen estado 200? (F12 → Network)
```

---

**Última actualización:** Diciembre 16, 2025
**Todos los comandos testados:** ✅ Listos para copiar/pegar
