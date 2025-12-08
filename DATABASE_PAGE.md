# 🗄️ Página de Gestión de Base de Datos

## Descripción

La página `/database` es el centro de control completo para la gestión de la base de datos MongoDB de AdminFlow. Proporciona una interfaz visual premium para monitorear, administrar, respaldar y restaurar la base de datos.

---

## 🎯 Características Principales

### 📊 **Panel de Información**
- **Estado de Conexión**: Indicador visual en tiempo real del estado de MongoDB
- **Latencia**: Medición de tiempo de respuesta de la conexión
- **Estadísticas Generales**:
  - Número total de colecciones
  - Cantidad total de documentos
  - Tamaño total de la base de datos

### 🔧 **Configuración de Conexión**
- **URI de MongoDB**: Campo editable para la cadena de conexión
- **Nombre de Base de Datos**: Selección de la base de datos activa
- **Prueba de Conexión**: Botón para verificar la conectividad antes de guardar

### 📁 **Explorador de Colecciones**
- **Lista Completa**: Visualización de todas las colecciones con:
  - Nombre de la colección
  - Cantidad de documentos
  - Tamaño en bytes (formateado)
- **Búsqueda**: Filtro en tiempo real por nombre de colección
- **Acciones por Colección**:
  - 👁️ **Ver Documentos**: Abre el visor de documentos
  - 📥 **Exportar**: Descarga la colección como JSON
  - 🗑️ **Eliminar**: Borra la colección completa (con confirmación)

### 👁️ **Visor de Documentos**
Modal interactivo para inspeccionar documentos de cualquier colección:

**Características:**
- **Dos Modos de Vista**:
  - **Tabla**: Vista tabular con columnas principales
  - **JSON**: Vista completa del documento en formato JSON
- **Paginación**: Navegación por páginas de 10 documentos
- **Panel de Detalles**: Sidebar con el JSON completo del documento seleccionado
- **Copiar JSON**: Botón para copiar cualquier documento al portapapeles
- **Renderizado Inteligente**:
  - Objetos anidados se muestran como `{...}`
  - Arrays se muestran como `Array(n)`
  - Valores booleanos con badges de colores
  - Valores null/undefined claramente identificados

### 💾 **Sistema de Respaldos**

#### **Crear Respaldo**
- Botón "Crear" que genera un respaldo completo de la base de datos
- Solo respalda la base de datos específica de AdminFlow (no otras bases del servidor)
- Utiliza `mongodump` con el parámetro `--db` para respaldo selectivo
- Formato: `adminflow_YYYY-MM-DDTHH-mm-ss-sssZ`

#### **Importar Respaldo**
Modal paso a paso con 4 etapas:

1. **Subir Archivo**:
   - Drag & drop o selector de archivos
   - Acepta archivos `.tar.gz`
   - Validación de formato

2. **Análisis**:
   - Extracción y análisis del contenido
   - Identificación de colecciones
   - Cálculo de tamaños

3. **Comparación**:
   - Gráfico de barras comparativo (Recharts)
   - Datos actuales vs. datos del respaldo
   - Vista clara de qué se va a sobrescribir

4. **Restauración**:
   - Checkbox de confirmación explícita
   - Advertencia de sobrescritura
   - Barra de progreso durante la restauración
   - Mensaje de éxito al completar

#### **Lista de Respaldos**
- Visualización de todos los respaldos disponibles
- Información mostrada:
  - Fecha y hora de creación
  - Tamaño del archivo
- **Acciones** (aparecen al hover):
  - 📥 **Descargar**: Descarga el archivo `.tar.gz`
  - 🔄 **Restaurar**: Restaura desde el respaldo local
  - 🗑️ **Eliminar**: Borra el respaldo del servidor

---

## 🎨 Diseño

### **Paleta de Colores**
- **Primario**: Emerald/Teal (conexión, éxito)
- **Secundario**: Sky Blue (respaldos, información)
- **Advertencia**: Amber (restauración, precaución)
- **Error**: Rose (eliminación, errores)

### **Layout Responsivo**
- **Desktop (XL)**: 4 columnas
  - Columna 1: Estado + Configuración
  - Columnas 2-3: Colecciones
  - Columna 4: Respaldos
- **Tablet/Mobile**: Layout apilado con stats en grid 2x1

### **Animaciones**
- Transiciones suaves en hover
- Spinners animados durante carga
- Efectos de glassmorphism en tarjetas
- Animaciones de entrada/salida en modales

---

## 🔐 Seguridad

### **Validaciones**
- Confirmación requerida para acciones destructivas
- Validación de formato de archivos de respaldo
- Verificación de conexión antes de guardar configuración

### **Permisos**
- Solo usuarios autenticados pueden acceder
- Todas las operaciones requieren sesión activa
- Logs de auditoría para cambios críticos

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **Next.js 16**: Framework React
- **TypeScript**: Type safety
- **Tailwind CSS**: Estilos
- **Shadcn/ui**: Componentes base
- **Recharts**: Gráficos de comparación
- **React Dropzone**: Upload de archivos
- **Sonner**: Notificaciones toast
- **Lucide React**: Iconografía

### **Backend**
- **Express.js**: API REST
- **MongoDB Native Driver**: Conexión a MongoDB
- **Mongodump/Mongorestore**: Herramientas de respaldo
- **Archiver**: Compresión de respaldos
- **Tar**: Extracción de respaldos
- **Multer**: Upload de archivos

---

## 📋 Flujos de Uso

### **Verificar Estado de la Base de Datos**
1. Navegar a `/database`
2. Revisar el indicador de conexión (verde = conectado)
3. Ver estadísticas en las tarjetas superiores
4. Revisar la lista de colecciones

### **Explorar Documentos**
1. Buscar la colección deseada en la lista
2. Hacer clic en el icono del ojo (👁️)
3. Navegar entre páginas si hay muchos documentos
4. Cambiar entre vista Tabla y JSON según necesidad
5. Hacer clic en una fila para ver detalles completos
6. Copiar JSON si es necesario

### **Crear un Respaldo**
1. Ir a la sección de Respaldos (columna derecha)
2. Hacer clic en "Crear"
3. Esperar a que se complete el proceso
4. El nuevo respaldo aparecerá en la lista

### **Restaurar desde Respaldo Local**
1. Localizar el respaldo en la lista
2. Hacer hover sobre la tarjeta
3. Hacer clic en el botón de restaurar (🔄)
4. Confirmar la acción en el modal
5. Esperar a que se complete la restauración

### **Importar Respaldo Externo**
1. Hacer clic en "Importar"
2. Arrastrar o seleccionar el archivo `.tar.gz`
3. Esperar el análisis automático
4. Revisar el gráfico de comparación
5. Marcar el checkbox de confirmación
6. Hacer clic en "Restaurar Base de Datos"
7. Esperar a que se complete el proceso

### **Exportar una Colección**
1. Buscar la colección en la lista
2. Hacer hover sobre la fila
3. Hacer clic en el botón de descarga (📥)
4. El archivo JSON se descargará automáticamente

### **Eliminar una Colección**
1. Buscar la colección en la lista
2. Hacer hover sobre la fila
3. Hacer clic en el botón de eliminar (🗑️)
4. Confirmar la acción en el diálogo
5. La colección se eliminará permanentemente

---

## ⚠️ Advertencias Importantes

### **Respaldos**
- Los respaldos solo incluyen la base de datos de AdminFlow
- No se respaldan otras bases de datos del servidor MongoDB
- Los respaldos se almacenan en `server/backup/`
- Asegúrate de tener espacio suficiente en disco

### **Restauración**
- La restauración **sobrescribe** todos los datos actuales
- No hay forma de deshacer una restauración
- Siempre crea un respaldo antes de restaurar
- Verifica el contenido del respaldo antes de restaurar

### **Eliminación de Colecciones**
- La eliminación es **permanente** e **irreversible**
- Se eliminarán todos los documentos de la colección
- Crea un respaldo antes de eliminar colecciones importantes

---

## 🐛 Troubleshooting

### **Error: "Error al cargar respaldos"**
**Causa**: El servidor no puede acceder al directorio de respaldos.

**Solución**:
```bash
# Crear el directorio de respaldos si no existe
mkdir -p server/backup
chmod 755 server/backup
```

### **Error: "MongoDB no está conectado"**
**Causa**: La conexión a MongoDB falló.

**Solución**:
1. Verificar que MongoDB esté ejecutándose
2. Revisar la URI en la configuración
3. Hacer clic en "Probar Conexión"
4. Revisar los logs del servidor

### **Error al crear respaldo**
**Causa**: `mongodump` no está disponible o falló.

**Solución**:
1. Verificar que las herramientas de MongoDB estén en `server/mongodb-tools/`
2. Revisar permisos de ejecución
3. Verificar espacio en disco
4. Revisar logs del servidor para detalles

### **Error al importar respaldo**
**Causa**: El archivo no es un respaldo válido de MongoDB.

**Solución**:
1. Verificar que el archivo sea `.tar.gz`
2. Verificar que contenga archivos `.bson`
3. Asegurarse de que sea un respaldo de `mongodump`

---

## 📊 Métricas y Monitoreo

### **Auto-refresh**
- La página se actualiza automáticamente cada 30 segundos
- Puedes forzar una actualización con el botón "Refrescar"

### **Indicadores Visuales**
- **Verde**: Conexión exitosa, operación completada
- **Amarillo**: Advertencia, requiere atención
- **Rojo**: Error, acción fallida
- **Azul**: Información, estado neutral

---

## 🔄 Actualizaciones Futuras

### **Planificadas**
- [ ] Respaldos programados (cron)
- [ ] Compresión mejorada de respaldos
- [ ] Restauración selectiva de colecciones
- [ ] Comparación detallada de esquemas
- [ ] Exportación a otros formatos (CSV, Excel)
- [ ] Búsqueda avanzada en documentos
- [ ] Edición inline de documentos
- [ ] Historial de cambios en documentos

---

**Última actualización**: 2025-12-01
