# Solución para Error 401 en manifest.json

## Problema
El navegador está recibiendo un error 401 (No autorizado) al intentar cargar:
- `https://hq.infratec.com.uy/manifest.json`
- Posiblemente otros archivos públicos

Esto está causando errores en las notificaciones de escritorio y el Service Worker.

## Causa
Nginx está configurado con autenticación HTTP básica que está bloqueando el acceso a archivos públicos que deberían ser accesibles sin autenticación.

## Solución

### Opción 1: Configurar Nginx para permitir acceso público a archivos específicos

Edita tu configuración de Nginx (probablemente en `/etc/nginx/sites-available/hq.infratec.com.uy` o similar):

```nginx
server {
    server_name hq.infratec.com.uy;
    
    # Permitir acceso público a archivos PWA y Service Worker
    location ~ ^/(manifest\.json|sw\.js|favicon\.ico|robots\.txt)$ {
        auth_basic off;  # Desactivar autenticación para estos archivos
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Permitir acceso público a archivos estáticos de Next.js
    location /_next/static/ {
        auth_basic off;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Permitir acceso público a assets
    location /assets/ {
        auth_basic off;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }
    
    # Resto de la configuración con autenticación
    location / {
        auth_basic "Área Restringida";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SSL configuration
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### Opción 2: Remover autenticación HTTP básica

Si no necesitas autenticación HTTP básica (porque la aplicación ya tiene su propio sistema de login), puedes removerla completamente:

```nginx
server {
    server_name hq.infratec.com.uy;
    
    location / {
        # Remover estas líneas:
        # auth_basic "Área Restringida";
        # auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Pasos para aplicar los cambios

1. Edita la configuración de Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/hq.infratec.com.uy
   ```

2. Verifica que la configuración sea válida:
   ```bash
   sudo nginx -t
   ```

3. Si la configuración es válida, recarga Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

4. Limpia el cache del navegador y del Service Worker:
   - Visita: `https://hq.infratec.com.uy/clear-cache.html`
   - Haz clic en "Limpiar Todo"
   - Recarga la página

## Verificación

Después de aplicar los cambios, verifica que el manifest.json sea accesible:

```bash
curl -I https://hq.infratec.com.uy/manifest.json
```

Deberías ver un código de respuesta `200 OK` en lugar de `401 Unauthorized`.

## Cambios realizados en el código

1. **Service Worker actualizado** (`/opt/adminflow/client/public/sw.js`):
   - Versión del cache actualizada a `adminflow-v4`
   - Removido `manifest.json` de la lista de archivos a cachear
   - Mejorado el manejo de errores para no cachear respuestas fallidas (401, 404, etc.)
   - Separado el manejo de peticiones API de las peticiones de archivos estáticos

2. **Página de utilidad creada** (`/opt/adminflow/client/public/clear-cache.html`):
   - Herramienta para limpiar el cache del Service Worker
   - Útil para diagnosticar problemas de cache

## Notas adicionales

- El error 401 NO es un problema del código de la aplicación, sino de la configuración de Nginx
- Las notificaciones de escritorio requieren que `manifest.json` y `sw.js` sean accesibles públicamente
- Si usas autenticación HTTP básica, asegúrate de excluir los archivos PWA de esta autenticación
