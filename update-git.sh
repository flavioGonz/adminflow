#!/bin/bash

# 🚀 Script de Actualización Git para AdminFlow
# Este script prepara y sube todos los cambios al repositorio

echo "================================================"
echo "  AdminFlow - Actualización de Repositorio Git"
echo "================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo "❌ Error: No se encontró el repositorio Git"
    echo "   Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo "📂 Directorio actual:"
echo "   $(pwd)"
echo ""

# Mostrar estado actual
echo "📊 Estado actual del repositorio:"
git status --short
echo ""

# Preguntar al usuario si desea continuar
read -p "¿Deseas continuar con la actualización? (S/N): " continue
if [ "$continue" != "S" ] && [ "$continue" != "s" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "🔍 Verificando archivos modificados..."

# Agregar archivos específicos importantes
echo ""
echo "📝 Agregando documentación actualizada..."
git add README.md
git add INSTALL_GUIDE.md
git add DATABASE_PAGE.md
git add DOCUMENTATION_INDEX.md
git add CHANGELOG.md
git add Apis.md
git add .gitignore

echo "✅ Documentación agregada"

# Agregar cambios en el servidor
echo ""
echo "🔧 Agregando cambios del servidor..."
git add server/lib/backupService.js
git add server/routes/database.js
git add server/routes/system-backup.js

echo "✅ Cambios del servidor agregados"

# Agregar cambios en el cliente
echo ""
echo "🎨 Agregando cambios del cliente..."
git add client/app/database/page.tsx
git add client/components/database/collection-viewer-dialog.tsx
git add client/components/database/import-backup-dialog.tsx

echo "✅ Cambios del cliente agregados"

# Mostrar resumen de cambios
echo ""
echo "📋 Resumen de cambios a commitear:"
git status --short
echo ""

# Crear commit
echo "💾 Creando commit..."
git commit -m "feat: Sistema avanzado de gestión de base de datos v2.1.0

🗄️ Nuevas Características:
- Visor de documentos con paginación y modos Tabla/JSON
- Sistema de respaldos mejorado con análisis previo
- Explorador de colecciones con búsqueda y filtros
- Respaldo selectivo (solo base de datos de la app)
- Modal de importación paso a paso con comparación visual

🔧 Mejoras Técnicas:
- Endpoint GET /api/database/collections/:collection/documents
- Uso de execFile para mayor seguridad en Windows
- Parámetro --db en mongodump para respaldo selectivo
- Manejo mejorado de errores en operaciones de respaldo
- Auto-refresh cada 30 segundos

📚 Documentación:
- Nuevo: INSTALL_GUIDE.md - Guía completa de instalación
- Nuevo: DATABASE_PAGE.md - Documentación de página de database
- Nuevo: DOCUMENTATION_INDEX.md - Índice de toda la documentación
- Actualizado: README.md - Sección de Database
- Actualizado: Apis.md - Endpoints de gestión de database
- Actualizado: CHANGELOG.md - Versión 2.1.0
- Actualizado: .gitignore - Exclusión de respaldos y temporales

🎯 Archivos Modificados:
- server/lib/backupService.js
- server/routes/database.js
- server/routes/system-backup.js
- client/app/database/page.tsx
- client/components/database/collection-viewer-dialog.tsx
- client/components/database/import-backup-dialog.tsx

Versión: 2.1.0
Fecha: 2025-12-01"

if [ $? -eq 0 ]; then
    echo "✅ Commit creado exitosamente"
else
    echo "❌ Error al crear el commit"
    exit 1
fi

# Preguntar si desea hacer push
echo ""
read -p "¿Deseas hacer push al repositorio remoto? (S/N): " push
if [ "$push" == "S" ] || [ "$push" == "s" ]; then
    echo ""
    echo "🚀 Subiendo cambios al repositorio remoto..."
    
    # Obtener la rama actual
    branch=$(git rev-parse --abbrev-ref HEAD)
    echo "   Rama: $branch"
    
    git push origin $branch
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "================================================"
        echo "  ✅ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE"
        echo "================================================"
        echo ""
        echo "📦 Cambios subidos a: origin/$branch"
        echo "🎉 El repositorio está actualizado"
    else
        echo ""
        echo "❌ Error al hacer push"
        echo "   Verifica tu conexión y permisos"
        exit 1
    fi
else
    echo ""
    echo "ℹ️  Commit creado localmente"
    echo "   Puedes hacer push más tarde con: git push origin $branch"
fi

echo ""
echo "📊 Estado final:"
git status --short
echo ""
