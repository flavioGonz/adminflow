#!/bin/bash
# deploy-fix-production.sh
# Script para corregir la instalación en producción remota

REMOTE_HOST="${REMOTE_HOST:-crm.infratec.com.uy}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/root/adminflow}"
MONGO_URI="${MONGO_URI:-mongodb://crm.infratec.com.uy:29999}"
MONGO_DB="${MONGO_DB:-adminflow}"

echo "🔧 Corrigiendo instalación en producción..."
echo ""

# Crear archivos temporales
TEMP_INSTALL=$(mktemp)
TEMP_DB=$(mktemp)

# Crear configuración de instalación
cat > "$TEMP_INSTALL" << EOF
{
  "installedAt": "$(date -Iseconds)",
  "version": "1.0.0",
  "environment": "production",
  "note": "Sistema configurado para producción"
}
EOF

# Crear configuración de base de datos
cat > "$TEMP_DB" << EOF
{
  "engine": "mongodb",
  "mongoUri": "$MONGO_URI",
  "mongoDb": "$MONGO_DB",
  "sqlitePath": "database/database.sqlite"
}
EOF

echo "📦 Archivos de configuración creados"
echo ""
echo "📤 Subiendo archivos al servidor..."

# Subir archivos
if scp "$TEMP_INSTALL" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/server/.installed" && \
   scp "$TEMP_DB" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/server/.selected-db.json"; then
    
    echo "✅ Archivos subidos correctamente"
    echo ""
    echo "🔍 Verificando instalación remota..."
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH}/server && ls -la .installed .selected-db.json"
    
    echo ""
    echo "🔄 Reiniciando servicio..."
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH} && pm2 restart adminflow || pm2 start server/index.js --name adminflow"
    
    echo ""
    echo "🎉 Sistema configurado correctamente!"
    echo "📝 El servidor ya no debería redirigir al instalador"
    
else
    echo ""
    echo "❌ Error al subir archivos"
    echo ""
    echo "💡 Solución alternativa:"
    echo "1. Conéctate al servidor: ssh ${REMOTE_USER}@${REMOTE_HOST}"
    echo "2. Ve al directorio: cd ${REMOTE_PATH}/server"
    echo "3. Ejecuta: node fix-production-install.js"
    echo "4. Reinicia: pm2 restart adminflow"
fi

# Limpiar archivos temporales
rm -f "$TEMP_INSTALL" "$TEMP_DB"
