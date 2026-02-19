# 🌐 Configuración de Nginx desde Interfaz Web (Nginx Proxy Manager)

## 📋 Pasos para Configurar desde la Interfaz Web

### 1️⃣ Acceder a tu Proxy Manager

Accede a tu panel web de Nginx (probablemente Nginx Proxy Manager).

---

### 2️⃣ Buscar el Proxy Host para `hq.infratec.com.uy`

1. Ve a **"Proxy Hosts"** o **"Hosts"**
2. Busca el host: `hq.infratec.com.uy`
3. Haz clic en **"Edit"** o **"Editar"** (ícono de lápiz/editar)

---

### 3️⃣ Configurar Ubicaciones Personalizadas (Custom Locations)

En la pestaña **"Custom Locations"** o **"Ubicaciones Personalizadas"**, agrega las siguientes ubicaciones:

#### 📍 Ubicación 1: Archivos PWA

```
Location: ~ ^/(manifest\.json|sw\.js|clear-cache\.html)$
Scheme: http
Forward Hostname/IP: 192.168.99.84
Forward Port: 3000
```

**Configuración Avanzada (Advanced):**
```nginx
auth_basic off;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

#### 📍 Ubicación 2: Archivos Estáticos Next.js

```
Location: /_next/
Scheme: http
Forward Hostname/IP: 192.168.99.84
Forward Port: 3000
```

**Configuración Avanzada:**
```nginx
auth_basic off;
proxy_set_header Host $host;
add_header Cache-Control "public, max-age=31536000, immutable";
```

#### 📍 Ubicación 3: Assets del Backend

```
Location: /assets/
Scheme: http
Forward Hostname/IP: 192.168.99.84
Forward Port: 5000
```

**Configuración Avanzada:**
```nginx
auth_basic off;
proxy_set_header Host $host;
```

#### 📍 Ubicación 4: Uploads

```
Location: /uploads/
Scheme: http
Forward Hostname/IP: 192.168.99.84
Forward Port: 5000
```

**Configuración Avanzada:**
```nginx
auth_basic off;
proxy_set_header Host $host;
```

---

### 4️⃣ Verificar la Ubicación Principal (/)

Asegúrate de que la ubicación principal **"/"** tenga:

```
Location: /
Scheme: http
Forward Hostname/IP: 192.168.99.84
Forward Port: 3000
```

**Si tienes autenticación HTTP básica activada**, déjala solo en esta ubicación principal.

---

### 5️⃣ Orden de las Ubicaciones

**MUY IMPORTANTE**: El orden importa. Las ubicaciones deben estar en este orden:

1. `~ ^/(manifest\.json|sw\.js|clear-cache\.html)$` (sin auth)
2. `/_next/` (sin auth)
3. `/assets/` (sin auth)
4. `/uploads/` (sin auth)
5. `/` (con auth si la tienes)

Si tu interfaz permite reordenar, arrastra las ubicaciones más específicas **ARRIBA** de la ubicación `/`.

---

### 6️⃣ Guardar y Aplicar

1. Haz clic en **"Save"** o **"Guardar"**
2. El proxy debería recargar automáticamente
3. Si hay un botón de **"Reload"** o **"Recargar"**, úsalo

---

## ✅ Verificación

Abre una terminal y verifica:

```bash
curl -I https://hq.infratec.com.uy/manifest.json
```

**Resultado esperado:**
```
HTTP/2 200 OK
content-type: application/json
...
```

**Si ves `401 Unauthorized`**, revisa que hayas agregado `auth_basic off;` en la configuración avanzada.

---

## 🎯 Capturas de Pantalla de Referencia

### Ejemplo de Custom Location:

```
┌─────────────────────────────────────────┐
│ Define Location                         │
├─────────────────────────────────────────┤
│ Location:                               │
│ ~ ^/(manifest\.json|sw\.js)$           │
│                                         │
│ Scheme: http                            │
│ Forward Hostname/IP: 192.168.99.84     │
│ Forward Port: 3000                      │
│                                         │
│ ☑ Advanced                              │
│ ┌─────────────────────────────────────┐ │
│ │ auth_basic off;                     │ │
│ │ proxy_set_header Host $host;        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancel]  [Save]                        │
└─────────────────────────────────────────┘
```

---

## 🔧 Si usas Nginx Proxy Manager (NPM)

### Opción Alternativa: Configuración Avanzada Global

Si prefieres, puedes agregar todo en la pestaña **"Advanced"** del host:

```nginx
# Archivos PWA públicos
location ~ ^/(manifest\.json|sw\.js|clear-cache\.html)$ {
    auth_basic off;
    proxy_pass http://192.168.99.84:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Next.js estáticos
location /_next/ {
    auth_basic off;
    proxy_pass http://192.168.99.84:3000;
    proxy_set_header Host $host;
}

# Assets
location /assets/ {
    auth_basic off;
    proxy_pass http://192.168.99.84:5000;
    proxy_set_header Host $host;
}

# Uploads
location /uploads/ {
    auth_basic off;
    proxy_pass http://192.168.99.84:5000;
    proxy_set_header Host $host;
}
```

**Nota:** Esto debe ir en la sección **"Advanced"** de la configuración del Proxy Host.

---

## 🎬 Video Tutorial (Pasos)

1. **Login** → Accede a tu Nginx Proxy Manager
2. **Proxy Hosts** → Encuentra `hq.infratec.com.uy`
3. **Edit** → Haz clic en editar
4. **Custom Locations** → Agrega las 4 ubicaciones
5. **Save** → Guarda los cambios
6. **Test** → Verifica con `curl`

---

## ❓ Preguntas Frecuentes

**P: ¿Qué es `auth_basic off;`?**  
R: Desactiva la autenticación HTTP básica para esas rutas específicas.

**P: ¿Por qué algunos van al puerto 3000 y otros al 5000?**  
R: 3000 es Next.js (frontend), 5000 es Express (backend/API).

**P: ¿Puedo usar la IP del servidor en lugar de 192.168.99.84?**  
R: Sí, usa la IP correcta de tu servidor donde corre AdminFlow.

**P: ¿Necesito reiniciar Nginx?**  
R: No, Nginx Proxy Manager recarga automáticamente al guardar.

---

## 🆘 Solución de Problemas

### Si sigue dando 401:
1. Verifica que `auth_basic off;` esté en la configuración avanzada
2. Asegúrate de que las ubicaciones específicas estén ANTES de `/`
3. Limpia el cache del navegador: `https://hq.infratec.com.uy/clear-cache.html`

### Si da 502 Bad Gateway:
1. Verifica que la IP `192.168.99.84` sea correcta
2. Verifica que los puertos 3000 y 5000 estén abiertos
3. Verifica que AdminFlow esté corriendo: `pm2 status`

---

**¿Qué interfaz web de Nginx estás usando?** (Nginx Proxy Manager, otro panel, etc.)
