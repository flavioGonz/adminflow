#!/bin/bash
# Deploy Support Module to Production
# Copia los archivos del módulo Ayuda y soporte directamente al servidor de producción

SERVER="root@192.168.1.120"
REMOTE_PATH="/root/adminflow"  # Ajusta esta ruta según dónde esté instalado en prod

echo "🚀 Desplegando módulo Ayuda y soporte a producción..."
echo ""

# Archivos a copiar (relativos al root del proyecto)
files=(
    "client/components/layout/sidebar.tsx"
    "client/app/support/documentacion/page.tsx"
    "client/app/support/centro/page.tsx"
    "client/app/support/estado/page.tsx"
    "server/routes/status.js"
    "server/index.js"
)

# Verificar que los archivos existen localmente
echo "📋 Verificando archivos locales..."
missing=0
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "  ❌ No encontrado: $file"
        missing=1
    else
        echo "  ✓ $file"
    fi
done

if [ $missing -eq 1 ]; then
    echo ""
    echo "❌ Faltan archivos. Abortando."
    exit 1
fi

echo ""
echo "📤 Copiando archivos al servidor $SERVER..."
echo ""

success=0
failed=0

for file in "${files[@]}"; do
    remoteDest="$SERVER:$REMOTE_PATH/$file"
    
    echo "  → $file"
    
    # Crear directorio remoto si no existe
    remoteDir=$(dirname "$file")
    ssh "$SERVER" "mkdir -p $REMOTE_PATH/$remoteDir" 2>/dev/null
    
    # Copiar archivo
    if scp "$file" "$remoteDest"; then
        echo "    ✓ Copiado correctamente"
        ((success++))
    else
        echo "    ❌ Error al copiar"
        ((failed++))
    fi
    
    echo ""
done

echo ""
echo "═══════════════════════════════════════════════"
echo "📊 Resumen: $success exitosos, $failed fallidos"
echo "═══════════════════════════════════════════════"
echo ""

if [ $failed -eq 0 ]; then
    echo "🎉 Todos los archivos copiados correctamente!"
    echo ""
    echo "🔄 Ahora debes reiniciar los servicios en producción:"
    echo ""
    echo "   Backend (API):"
    echo "   ssh $SERVER"
    echo "   cd $REMOTE_PATH/server"
    echo "   pm2 restart adminflow"
    echo ""
    echo "   Frontend (Next):"
    echo "   cd $REMOTE_PATH/client"
    echo "   npm run build"
    echo "   pm2 restart adminflow-frontend"
    echo ""
else
    echo "⚠️  Algunos archivos fallaron. Revisa los errores arriba."
    exit 1
fi
