# 🚀 Instrucciones de Instalación - PC Remoto

## ⚠️ IMPORTANTE: Pasos para Primera Instalación

### **Paso 1: Limpiar Configuración Anterior**

En el PC remoto, ejecuta estos comandos:

```bash
cd C:\Users\soporte-win11\Desktop\node\adminflow\server

# Eliminar archivos de configuración antigua
del .selected-db.json
del .installed

# Si existe, también eliminar la base de datos SQLite antigua
del database\database.sqlite
```

### **Paso 2: Actualizar Código**

```bash
cd C:\Users\soporte-win11\Desktop\node\adminflow
git pull origin main
```

### **Paso 3: Instalar Dependencias**

```bash
# En el servidor
cd server
npm install

# En el cliente (otra terminal)
cd client
npm install
```

### **Paso 4: Iniciar Servidores**

**Terminal 1 - Servidor:**
```bash
cd C:\Users\soporte-win11\Desktop\node\adminflow\server
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════════════════════╗
║          ⚠️  SISTEMA NO INSTALADO                     ║
╚════════════════════════════════════════════════════════╝

📋 Por favor completa la instalación:
   1. Abre tu navegador
   2. Ve a: http://localhost:3000/install
   3. Sigue el wizard de instalación

⏭️  El servidor está listo, esperando instalación...

╔════════════════════════════════════════════════════════╗
║              🎉 SERVIDOR INICIADO                      ║
╚════════════════════════════════════════════════════════╝

🌐 Servidor corriendo en: http://localhost:5000
📦 Estado: Esperando instalación
🔧 Instalador: http://localhost:3000/install
```

**Terminal 2 - Cliente:**
```bash
cd C:\Users\Flavio\Documents\EXPRESS\adminflow\client
npm run dev
```

### **Paso 5: Completar Instalación Web**

1. Abre tu navegador
2. Ve a: `http://localhost:3000/install`
3. Completa el wizard:

#### **Paso 1/4: Información de la Empresa**
- Nombre de la empresa *
- Dirección
- Teléfono
- Email *

#### **Paso 2/4: Base de Datos**

**Opcion A - MongoDB (recomendado produccion):**
- Selecciona "MongoDB"
- MongoDB URI:
  - Sin auth: `mongodb://crm.infratec.com.uy:29999`
  - Con auth: `mongodb://usuario:password@crm.infratec.com.uy:29999`
  - Sin `/adminflow` al final (el nombre va en el campo BD)
- Nombre de BD: `adminflow` (o el que prefieras)
- Para respaldo existente: `mongorestore --uri="<uri>" --db=<nombre> <ruta_dump>`
- Click en "Probar Conexion" y espera el ok

**Opcion B - SQLite (simple, local):**
- Selecciona "SQLite"
- Elegir modo:
  - Crear nueva base de datos: borra datos previos y arranca limpia
  - Usar base de datos existente: apunta al archivo ya creado
- Para respaldo: copia tu `.sqlite` al `server/database/database.sqlite` o al `sqlitePath` elegido

**Opcion C - PostgreSQL (planificado en el instalador):**
- Selecciona "PostgreSQL" cuando aparezca
- Crea BD/usuario o restaura backup: `pg_restore -d adminflow <ruta.dump>` o `psql adminflow < backup.sql`
- Pasa la URL `postgres://usuario:pass@host:5432/adminflow`

**Opcion D - MySQL (planificado en el instalador):**
- Selecciona "MySQL" cuando aparezca
- Crea BD/usuario o importa respaldo: `mysql -u adminflow -p adminflow < backup.sql`
- Pasa la URL `mysql://usuario:pass@host:3306/adminflow`

#### **Paso 3/4: Notificaciones (Opcional)**
- Configura canales si quieres
- Puedes saltarlo y configurar después

#### **Paso 4/4: Finalización**
- Revisa el resumen
- Click en "Finalizar Instalación"
- Espera a que se complete
- Serás redirigido al login

### **Paso 6: Primer Login**

Credenciales por defecto:
```
Email: admin@adminflow.uy
Password: admin
```

⚠️ **Cámbialas inmediatamente después del primer login!**

---

## 🔍 Troubleshooting

### **Error: "connect ECONNREFUSED"**

Si ves este error al probar MongoDB:
```
❌ Error de conexión: connect ECONNREFUSED 167.57.34.193:29999
```

**Soluciones:**
1. Verifica que MongoDB esté corriendo en el servidor remoto
2. Verifica que el puerto 29999 esté abierto
3. Verifica la IP/hostname: `crm.infratec.com.uy`
4. Prueba con la IP directa: `mongodb://167.57.34.193:29999`
5. Verifica firewall y reglas de red

### **El servidor sigue intentando conectar a MongoDB**

Si el servidor sigue mostrando el error de MongoDB al iniciar:
1. Detén el servidor (Ctrl+C)
2. Elimina `.selected-db.json` y `.installed`
3. Reinicia el servidor
4. Ve a `/install` y completa el wizard

### **SQLite: "No se pudieron cargar los contratos"**

Si seleccionaste SQLite y ves este error:
1. El instalador debería crear la BD automáticamente
2. Si no funciona, verifica que existe `server/database/database.sqlite`
3. Reinicia el servidor después de la instalación

### **Error: "ENOTEMPTY" o "EPERM" al hacer npm install**

Si ves errores como `npm error ENOTEMPTY` o `npm error EPERM` en Windows:
1. **Detén todos los procesos de Node:**
   ```cmd
   taskkill /F /IM node.exe
   ```
2. **Borra la carpeta node_modules manualmente:**
   ```cmd
   cd server
   rmdir /s /q node_modules
   del package-lock.json
   ```
3. **Instala de nuevo:**
   ```cmd
   npm install
   ```

---

## ✅ Verificación Post-Instalación

Después de completar la instalación:

1. **Verifica archivos creados:**
   ```bash
   # Debe existir:
   server/.installed
   server/.selected-db.json
   
   # Si usaste SQLite:
   server/database/database.sqlite
   ```

2. **Verifica logs del servidor:**
   - Debe mostrar "✅ Sistema instalado"
   - Debe mostrar conexión a BD exitosa

3. **Prueba el login:**
   - Ve a `http://localhost:3000`
   - Login con admin@adminflow.uy / admin
   - Deberías ver el dashboard

---

## 📝 Notas Importantes

1. **Primera vez:** El instalador solo aparece si NO existe `.installed`
2. **Reinstalar:** Elimina `.installed` y `.selected-db.json` para volver a instalar
3. **MongoDB:** La URI NO debe incluir el nombre de la base de datos
4. **SQLite:** Se crea automáticamente con tablas y usuario admin
5. **Logs:** Revisa siempre los logs del servidor para debugging

---

**¿Problemas?** Revisa los logs del servidor y comparte el error exacto.
