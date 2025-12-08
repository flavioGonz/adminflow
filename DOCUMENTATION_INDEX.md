# 📚 Índice de Documentación de AdminFlow

Guía completa de toda la documentación disponible del proyecto.

---

## 📖 Documentación Principal

### **[README.md](./README.md)**
Documentación principal del proyecto que incluye:
- Descripción general del sistema
- Características principales
- Stack tecnológico completo
- Arquitectura del sistema
- Instalación rápida
- Configuración
- Módulos del sistema
- Estructura del proyecto

**Audiencia**: Desarrolladores, administradores de sistema, usuarios técnicos

---

## 🚀 Guías de Instalación

### **[INSTALL_GUIDE.md](./INSTALL_GUIDE.md)** ⭐ NUEVO
Guía paso a paso para instalar AdminFlow en un nuevo PC:
- Prerrequisitos detallados
- Instalación de dependencias
- Configuración de variables de entorno
- Configuración de MongoDB (local y cloud)
- Inicialización del sistema
- Verificación de la instalación
- Troubleshooting completo
- Instalación en producción

**Audiencia**: Nuevos usuarios, administradores de sistema

### **[INSTALLER.md](./INSTALLER.md)**
Documentación del instalador web interactivo:
- Características del wizard
- Flujo de instalación
- Selección de base de datos
- Configuración de notificaciones
- API endpoints del instalador
- Reinstalación

**Audiencia**: Usuarios finales, administradores

---

## 🗄️ Base de Datos

### **[db.md](./db.md)**
Arquitectura de base de datos:
- Estructura MongoDB-First
- Colecciones principales
- Esquemas y validaciones
- Índices optimizados
- Configuración
- Scripts disponibles
- Ventajas de MongoDB

**Audiencia**: Desarrolladores, DBAs

### **[DATABASE_PAGE.md](./DATABASE_PAGE.md)** ⭐ NUEVO
Guía completa de la página de gestión de base de datos (`/database`):
- Panel de información
- Configuración de conexión
- Explorador de colecciones
- Visor de documentos
- Sistema de respaldos
- Flujos de uso
- Troubleshooting
- Métricas y monitoreo

**Audiencia**: Administradores, usuarios avanzados

### **[server/MIGRATION_MONGODB.md](./server/MIGRATION_MONGODB.md)**
Guía de migración de SQLite a MongoDB:
- Proceso de migración
- Scripts disponibles
- Verificación de datos
- Rollback

**Audiencia**: Administradores de sistema, desarrolladores

---

## 🔌 API y Desarrollo

### **[Apis.md](./Apis.md)** ⭐ ACTUALIZADO
Referencia completa de todos los endpoints de la API:
- Autenticación
- Usuarios
- Clientes
- Tickets
- Presupuestos
- Contratos
- Pagos
- Productos
- Calendario
- Notificaciones
- **Gestión de Base de Datos** (NUEVO)
- **Respaldos** (NUEVO)
- Accesos y credenciales
- Diagramas de red

**Audiencia**: Desarrolladores, integradores

---

## 📝 Changelog y Actualizaciones

### **[CHANGELOG.md](./CHANGELOG.md)** ⭐ ACTUALIZADO
Registro completo de cambios y mejoras:
- **v2.1.0** (2025-12-01): Gestión avanzada de base de datos
- **v2.0.0** (2025-11-30): Migración a MongoDB
- **v1.5.0** (2025-11-27): Sistema de avatares
- **v1.4.0** (2025-11-26): Mejoras en tickets
- **v1.3.0** (2025-11-25): Notificaciones automáticas
- **v1.2.0** (2025-11-24): Instalador web
- **v1.1.0** (2025-11-22): Dashboard y widgets
- **v1.0.0** (2025-11-20): Lanzamiento inicial

**Audiencia**: Todos los usuarios

---

## 🎨 Documentación de Funcionalidades

### **[AVATAR_UPLOAD_IMPLEMENTATION.md](./AVATAR_UPLOAD_IMPLEMENTATION.md)**
Implementación del sistema de avatares:
- Upload de avatares de usuarios
- Almacenamiento
- Visualización en UI
- API endpoints

**Audiencia**: Desarrolladores

### **[COMMAND_PALETTE.md](./COMMAND_PALETTE.md)**
Paleta de comandos del sistema:
- Atajos de teclado
- Comandos disponibles
- Navegación rápida

**Audiencia**: Usuarios finales

### **[DIAGRAMS.md](./DIAGRAMS.md)**
Sistema de diagramas de red:
- Integración con Excalidraw
- Gestión de diagramas por cliente
- Almacenamiento

**Audiencia**: Usuarios técnicos, administradores de red

### **[PAYMENTS_IMPLEMENTATION_PLAN.md](./PAYMENTS_IMPLEMENTATION_PLAN.md)**
Plan de implementación del módulo de pagos:
- Arquitectura
- Funcionalidades
- Integraciones

**Audiencia**: Desarrolladores, product managers

---

## 🌐 Instalación Remota

### **[INSTALL_REMOTE.md](./INSTALL_REMOTE.md)**
Guía para instalación en servidores remotos:
- Configuración de VPS
- Deployment
- Nginx/Apache
- SSL/HTTPS
- PM2

**Audiencia**: DevOps, administradores de sistema

---

## 📁 Estructura de Archivos

```
adminflow/
├── 📄 README.md                          # Documentación principal
├── 📄 INSTALL_GUIDE.md                   # ⭐ Guía de instalación
├── 📄 INSTALLER.md                       # Instalador web
├── 📄 INSTALL_REMOTE.md                  # Instalación remota
├── 📄 Apis.md                            # ⭐ API Reference
├── 📄 db.md                              # Arquitectura de BD
├── 📄 DATABASE_PAGE.md                   # ⭐ Página de database
├── 📄 CHANGELOG.md                       # ⭐ Registro de cambios
├── 📄 AVATAR_UPLOAD_IMPLEMENTATION.md    # Avatares
├── 📄 COMMAND_PALETTE.md                 # Paleta de comandos
├── 📄 DIAGRAMS.md                        # Diagramas de red
├── 📄 PAYMENTS_IMPLEMENTATION_PLAN.md    # Plan de pagos
├── 📄 .gitignore                         # ⭐ Git ignore actualizado
│
├── client/                               # Frontend Next.js
│   ├── app/                              # Páginas y rutas
│   ├── components/                       # Componentes React
│   ├── lib/                              # Utilidades
│   └── public/                           # Assets estáticos
│
└── server/                               # Backend Express
    ├── routes/                           # Rutas de API
    ├── lib/                              # Servicios y utilidades
    ├── middleware/                       # Middlewares
    ├── database/                         # Configuración de BD
    ├── uploads/                          # Archivos subidos
    ├── backup/                           # Respaldos de BD
    └── mongodb-tools/                    # Herramientas MongoDB
```

---

## 🎯 Guías Rápidas por Rol

### **Para Nuevos Usuarios**
1. [INSTALL_GUIDE.md](./INSTALL_GUIDE.md) - Instalación completa
2. [README.md](./README.md) - Visión general
3. [INSTALLER.md](./INSTALLER.md) - Wizard de instalación

### **Para Administradores**
1. [DATABASE_PAGE.md](./DATABASE_PAGE.md) - Gestión de BD
2. [db.md](./db.md) - Arquitectura de datos
3. [INSTALL_REMOTE.md](./INSTALL_REMOTE.md) - Deployment

### **Para Desarrolladores**
1. [Apis.md](./Apis.md) - API completa
2. [README.md](./README.md) - Arquitectura
3. [CHANGELOG.md](./CHANGELOG.md) - Cambios recientes

### **Para DevOps**
1. [INSTALL_REMOTE.md](./INSTALL_REMOTE.md) - Producción
2. [INSTALL_GUIDE.md](./INSTALL_GUIDE.md) - Setup inicial
3. [DATABASE_PAGE.md](./DATABASE_PAGE.md) - Respaldos

---

## 🔄 Actualizaciones Recientes (2025-12-01)

### ⭐ Nuevos Archivos
- `INSTALL_GUIDE.md` - Guía completa de instalación
- `DATABASE_PAGE.md` - Documentación de página de database
- Este archivo (`DOCUMENTATION_INDEX.md`)

### 📝 Archivos Actualizados
- `README.md` - Sección de Database actualizada
- `Apis.md` - Nuevos endpoints de database y respaldos
- `CHANGELOG.md` - Versión 2.1.0 documentada
- `.gitignore` - Exclusión de respaldos y temporales

### 🗄️ Nuevas Funcionalidades Documentadas
- Visor de documentos con paginación
- Sistema de respaldos mejorado
- Explorador de colecciones
- Gestión avanzada de MongoDB

---

## 📞 Soporte y Contribución

### **Reportar Problemas**
- Revisa la documentación relevante
- Consulta el [CHANGELOG.md](./CHANGELOG.md)
- Crea un issue en GitHub con detalles

### **Contribuir**
- Lee el [README.md](./README.md)
- Revisa el [CHANGELOG.md](./CHANGELOG.md)
- Sigue las convenciones del proyecto

---

## 🔍 Búsqueda Rápida

**¿Necesitas...?**

- **Instalar el sistema**: [INSTALL_GUIDE.md](./INSTALL_GUIDE.md)
- **Configurar MongoDB**: [db.md](./db.md)
- **Ver endpoints de API**: [Apis.md](./Apis.md)
- **Gestionar respaldos**: [DATABASE_PAGE.md](./DATABASE_PAGE.md)
- **Deployment en producción**: [INSTALL_REMOTE.md](./INSTALL_REMOTE.md)
- **Ver cambios recientes**: [CHANGELOG.md](./CHANGELOG.md)
- **Entender la arquitectura**: [README.md](./README.md)

---

**Última actualización**: 2025-12-01

**Versión de AdminFlow**: 2.1.0
