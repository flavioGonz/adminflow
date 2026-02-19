# 🎯 RESUMEN: Solución Error 401 en Notificaciones

## 📋 Archivos Creados

He creado varios archivos para ayudarte a solucionar el problema:

### 1. 📖 Documentación
- **`SOLUCION_ERROR_401_MANIFEST.md`** - Explicación completa del problema
- **`DONDE_AGREGAR_NGINX_CONFIG.md`** - Guía visual paso a paso

### 2. 🔧 Archivos de Configuración
- **`nginx-hq.infratec.com.uy.conf`** - Configuración completa de Nginx lista para usar
- **`aplicar-nginx-config.sh`** - Script interactivo para aplicar los cambios

### 3. 🛠️ Herramientas
- **`client/public/clear-cache.html`** - Página para limpiar cache del navegador

---

## 🚀 Pasos Rápidos

### Opción A: Si tienes acceso al servidor Nginx

1. **Copia los archivos al servidor proxy:**
   ```bash
   scp nginx-hq.infratec.com.uy.conf usuario@servidor-proxy:/tmp/
   scp aplicar-nginx-config.sh usuario@servidor-proxy:/tmp/
   ```

2. **Conéctate al servidor proxy:**
   ```bash
   ssh usuario@servidor-proxy
   ```

3. **Ejecuta el script:**
   ```bash
   cd /tmp
   sudo bash aplicar-nginx-config.sh
   ```

4. **Verifica que funcione:**
   ```bash
   curl -I https://hq.infratec.com.uy/manifest.json
   # Debe devolver: HTTP/2 200
   ```

### Opción B: Edición Manual

Si prefieres editar manualmente, agrega esto **ANTES** de `location /` en tu configuración de Nginx:

```nginx
# Archivos PWA públicos (sin autenticación)
location ~ ^/(manifest\.json|sw\.js|clear-cache\.html)$ {
    auth_basic off;
    proxy_pass http://192.168.99.84:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Archivos estáticos de Next.js
location /_next/ {
    auth_basic off;
    proxy_pass http://192.168.99.84:3000;
    proxy_set_header Host $host;
}

# Assets del backend
location /assets/ {
    auth_basic off;
    proxy_pass http://192.168.99.84:5000;
    proxy_set_header Host $host;
}
```

Luego:
```bash
sudo nginx -t              # Verificar
sudo systemctl reload nginx # Aplicar
```

---

## ✅ Verificación Final

Después de aplicar los cambios:

1. **Verifica manifest.json:**
   ```bash
   curl -I https://hq.infratec.com.uy/manifest.json
   # Esperado: HTTP/2 200 OK
   ```

2. **Verifica sw.js:**
   ```bash
   curl -I https://hq.infratec.com.uy/sw.js
   # Esperado: HTTP/2 200 OK
   ```

3. **Limpia el cache del navegador:**
   - Visita: `https://hq.infratec.com.uy/clear-cache.html`
   - Haz clic en "Limpiar Todo"
   - Recarga la página principal

4. **Prueba las notificaciones:**
   - Ve a: `https://hq.infratec.com.uy/notifications`
   - Activa las notificaciones de escritorio
   - Envía una notificación de prueba

---

## 🔍 Información Importante

### IPs y Puertos (según tu configuración)
- **Servidor aplicación**: `192.168.99.84`
- **Puerto frontend (Next.js)**: `3000`
- **Puerto backend (Express)**: `5000`
- **Dominio**: `hq.infratec.com.uy`

### ⚠️ Nota Importante
**El error 401 NO es un bug del código**, es una configuración de infraestructura. 

El código de la aplicación ya está corregido:
- ✅ Service Worker mejorado (v4)
- ✅ Manejo correcto de errores de cache
- ✅ Manifest.json removido del cache automático

Solo falta configurar Nginx para permitir acceso público a los archivos PWA.

---

## 📞 ¿Necesitas Ayuda?

Si no tienes acceso al servidor Nginx:
1. Envía los archivos `nginx-hq.infratec.com.uy.conf` y `DONDE_AGREGAR_NGINX_CONFIG.md` al administrador del servidor
2. Pídele que aplique los cambios siguiendo la guía

Si tienes algún error al aplicar los cambios, revisa los logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 Resultado Esperado

Una vez aplicados los cambios:
- ✅ No más errores 401 en manifest.json
- ✅ Service Worker funcionando correctamente
- ✅ Notificaciones de escritorio operativas
- ✅ PWA completamente funcional

---

**Última actualización**: 2026-02-04
