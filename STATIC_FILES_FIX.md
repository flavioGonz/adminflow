# 🚀 Solución: Error de Carga de Archivos Estáticos en Producción

## Problema
Al acceder a `http://192.168.99.120`, ves estos errores:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 400 (Bad Request)
Uncaught Error: Failed to load chunk /_next/static/chunks/...
```

## Causa Raíz
El servidor Express no estaba sirviendo los archivos compilados de Next.js (carpeta `.next`). El navegador no podía descargar los archivos CSS y JavaScript necesarios.

## Solución Implementada

### 1. ✅ Configurar Express para servir archivos estáticos
Se agregaron estas líneas al archivo `server/index.js`:

```javascript
// Servir archivos estáticos de Next.js
app.use('/_next/static', express.static(path.resolve(__dirname, '../client/.next/static'), {
    maxAge: '365d', // Cache los archivos estáticos por 1 año
    immutable: true,
}));

// Servir archivos públicos
app.use(express.static(path.resolve(__dirname, '../client/public')));

// Servir archivos de Next.js (*.js, *.css, etc.)
app.use(express.static(path.resolve(__dirname, '../client/.next'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.json') || path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Content-Type', path.endsWith('.json') ? 'application/json' : 
                          path.endsWith('.js') ? 'application/javascript' : 'text/css');
        }
    },
}));
```

### 2. 📦 Compilar el cliente Next.js

Antes de desplegar en producción, SIEMPRE debes compilar el cliente:

**En tu máquina local (Windows):**
```powershell
cd client
npm run build
```

Esto genera la carpeta `.next/` con todos los archivos compilados y optimizados.

### 3. 🔄 Pasos para desplegar en tu servidor Alpine

#### Opción A: Usando el script de deploy (Recomendado)
```bash
# En tu servidor Alpine
cd /path/to/adminflow
./deploy-production.sh
```

O si prefieres manualmente:

#### Opción B: Pasos manuales

1. **En tu máquina local, compila el cliente:**
   ```powershell
   cd client
   npm run build
   cd ..
   ```

2. **Sincroniza los cambios con tu servidor Alpine:**
   ```bash
   # Usa rsync, scp o git push
   scp -r client/.next root@192.168.99.120:/path/to/adminflow/client/
   scp -r client/public root@192.168.99.120:/path/to/adminflow/client/
   scp server/index.js root@192.168.99.120:/path/to/adminflow/server/
   ```

3. **En el servidor Alpine, reinicia la aplicación:**
   ```bash
   cd /path/to/adminflow/server
   pm2 restart adminflow
   # o
   pm2 stop adminflow
   pm2 start index.js --name "adminflow"
   ```

4. **Verifica los logs:**
   ```bash
   pm2 logs adminflow
   ```

## 🔍 Verificación

Después de desplegar, verifica que:

1. ✅ La aplicación carga en `http://192.168.99.120`
2. ✅ Los archivos CSS y JS se cargan sin errores (revisar consola del navegador)
3. ✅ No hay errores 404 o 400 en los recursos estáticos

## 📋 Checklist de Deploy

- [ ] Compilar cliente: `npm run build` en carpeta `client/`
- [ ] Verificar que existe carpeta `client/.next/`
- [ ] Verificar que existe carpeta `client/public/`
- [ ] Actualizar `server/index.js` con los cambios (ya hecho ✅)
- [ ] Copiar archivos a servidor Alpine
- [ ] Reiniciar proceso pm2
- [ ] Verificar logs
- [ ] Acceder a la URL y probar

## 🆘 Troubleshooting

### Si aún ves errores 404 después de desplegar:

1. **Verifica que el cliente está compilado:**
   ```bash
   ls -la /path/to/adminflow/client/.next/
   ```

2. **Verifica los permisos:**
   ```bash
   chmod -R 755 /path/to/adminflow/client/.next/
   chmod -R 755 /path/to/adminflow/client/public/
   ```

3. **Verifica los logs del servidor:**
   ```bash
   pm2 logs adminflow --lines 100
   ```

4. **Prueba la ruta directa en el navegador:**
   ```
   http://192.168.99.120/_next/static/chunks/main.js
   ```
   Debería descargar el archivo, no mostrar 404.

### Si ves errores 400:

- Podría haber un problema con la configuración de rewrites en Next.js
- Verifica `client/next.config.ts`
- Asegúrate que `NEXT_PUBLIC_API_URL` está configurada correctamente

## 📝 Notas Importantes

1. **BUILD es obligatorio**: Cada cambio en el cliente requiere correr `npm run build`
2. **SYNC es importante**: Debes sincronizar la carpeta `.next` a producción
3. **RESTART es necesario**: Después de cambios, reinicia con pm2
4. **CACHE**: Los archivos estáticos se cachean por 365 días (configurable)

## 🔐 Variables de Entorno

Asegúrate que tu servidor tiene estas variables configuradas:

```bash
# En .env o en la configuración de pm2
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://192.168.99.120/api
MONGODB_URI=mongodb://...
PORT=80  # o el puerto que uses
```

## 💡 Optimizaciones Futuras

1. Usar un CDN para servir archivos estáticos
2. Habilitar gzip compression
3. Usar un reverse proxy (nginx) frente a Express
4. Implementar health checks

---
**Actualizado:** Diciembre 16, 2025
