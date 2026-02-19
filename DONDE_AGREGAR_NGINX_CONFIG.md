# 📍 Guía: Dónde Agregar la Configuración de Nginx

## 🔍 Ubicación del Archivo

El archivo de configuración de Nginx para `hq.infratec.com.uy` probablemente está en **otro servidor** (el servidor proxy).

Busca el archivo en una de estas ubicaciones:

```bash
# Opción 1: Sites-available (Ubuntu/Debian)
/etc/nginx/sites-available/hq.infratec.com.uy
/etc/nginx/sites-available/default
/etc/nginx/sites-available/infratec

# Opción 2: Conf.d (CentOS/RHEL)
/etc/nginx/conf.d/hq.infratec.com.uy.conf
/etc/nginx/conf.d/default.conf

# Opción 3: Nginx.conf principal
/etc/nginx/nginx.conf
```

Para encontrarlo, ejecuta en el **servidor proxy**:

```bash
# Buscar configuración que mencione hq.infratec.com.uy
grep -r "hq.infratec.com.uy" /etc/nginx/

# O buscar configuración con auth_basic (autenticación)
grep -r "auth_basic" /etc/nginx/
```

---

## 📝 Estructura Actual vs Nueva

### ❌ Configuración Actual (Con Problema)

Tu archivo probablemente se ve así:

```nginx
server {
    listen 443 ssl;
    server_name hq.infratec.com.uy;

    ssl_certificate /ruta/al/certificado.crt;
    ssl_certificate_key /ruta/a/la/llave.key;

    # PROBLEMA: Autenticación aplicada a TODO
    location / {
        auth_basic "Área Restringida";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://192.168.99.84:3000;  # O la IP de tu servidor
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### ✅ Configuración Corregida

Debe quedar así (agrega las nuevas secciones **ANTES** de `location /`):

```nginx
server {
    listen 443 ssl;
    server_name hq.infratec.com.uy;

    ssl_certificate /ruta/al/certificado.crt;
    ssl_certificate_key /ruta/a/la/llave.key;

    # ✨ NUEVO: Permitir acceso público a archivos PWA (sin autenticación)
    location ~ ^/(manifest\.json|sw\.js|clear-cache\.html)$ {
        auth_basic off;  # ← Desactiva autenticación para estos archivos
        proxy_pass http://192.168.99.84:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ✨ NUEVO: Permitir acceso público a archivos estáticos de Next.js
    location /_next/static/ {
        auth_basic off;
        proxy_pass http://192.168.99.84:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # ✨ NUEVO: Permitir acceso público a assets
    location /assets/ {
        auth_basic off;
        proxy_pass http://192.168.99.84:5000;  # Backend server
        proxy_set_header Host $host;
    }

    # Resto de rutas con autenticación (sin cambios)
    location / {
        auth_basic "Área Restringida";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://192.168.99.84:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 Pasos para Aplicar

### 1️⃣ Conectarse al servidor proxy

```bash
# Reemplaza con tu IP/hostname del servidor proxy
ssh usuario@servidor-proxy
```

### 2️⃣ Encontrar el archivo de configuración

```bash
# Buscar el archivo
grep -r "hq.infratec.com.uy" /etc/nginx/

# Ejemplo de salida:
# /etc/nginx/sites-available/hq.infratec.com.uy: server_name hq.infratec.com.uy;
```

### 3️⃣ Editar el archivo

```bash
# Reemplaza con la ruta encontrada en el paso anterior
sudo nano /etc/nginx/sites-available/hq.infratec.com.uy
```

### 4️⃣ Agregar las nuevas secciones

- Copia las secciones marcadas con `# ✨ NUEVO` de arriba
- Pégalas **ANTES** de la sección `location /`
- **IMPORTANTE**: Actualiza las IPs (`192.168.99.84`) con las correctas de tu servidor

### 5️⃣ Verificar la configuración

```bash
# Verificar sintaxis
sudo nginx -t

# Deberías ver:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 6️⃣ Aplicar los cambios

```bash
# Recargar Nginx (sin downtime)
sudo systemctl reload nginx

# O reiniciar si reload no funciona
sudo systemctl restart nginx
```

### 7️⃣ Verificar que funciona

```bash
# Debe devolver 200 OK (no 401)
curl -I https://hq.infratec.com.uy/manifest.json

# Debe devolver 200 OK
curl -I https://hq.infratec.com.uy/sw.js
```

---

## 🎯 Puntos Clave

1. **Orden importa**: Las secciones `location` más específicas deben ir **ANTES** de las genéricas
2. **auth_basic off**: Esto desactiva la autenticación para esas rutas específicas
3. **IPs correctas**: Asegúrate de usar las IPs correctas de tus servidores
4. **Puerto 3000**: Next.js (frontend)
5. **Puerto 5000**: Express (backend/API)

---

## ❓ Si No Tienes Acceso al Servidor Proxy

Si no tienes acceso al servidor donde está Nginx, necesitarás:

1. Contactar al administrador del servidor
2. Enviarle este archivo como referencia
3. Pedirle que aplique los cambios

---

## 📞 Información que Necesitas Saber

Para aplicar estos cambios, necesitas saber:

- ✅ **IP del servidor proxy**: ¿Dónde está corriendo Nginx?
- ✅ **IP de este servidor**: `192.168.99.84` (según conversaciones anteriores)
- ✅ **Puerto del frontend**: `3000` (Next.js)
- ✅ **Puerto del backend**: `5000` (Express)
- ✅ **Credenciales SSH**: Para acceder al servidor proxy

¿Tienes acceso al servidor donde está corriendo Nginx?
