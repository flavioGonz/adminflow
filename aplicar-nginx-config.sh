#!/bin/bash

# Script para aplicar la configuración de Nginx
# Ejecutar en el servidor donde está corriendo Nginx

echo "================================================"
echo "  Configuración de Nginx para AdminFlow"
echo "  Dominio: hq.infratec.com.uy"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script debe ejecutarse como root (usa sudo)${NC}"
    exit 1
fi

# Verificar si Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Nginx está instalado${NC}"

# Buscar el archivo de configuración actual
echo ""
echo "🔍 Buscando configuración actual..."
CONFIG_FILE=$(grep -r "hq.infratec.com.uy" /etc/nginx/ 2>/dev/null | grep "server_name" | head -1 | cut -d: -f1)

if [ -z "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  No se encontró configuración existente${NC}"
    echo "¿Dónde quieres crear el archivo de configuración?"
    echo "1) /etc/nginx/sites-available/hq.infratec.com.uy"
    echo "2) /etc/nginx/conf.d/hq.infratec.com.uy.conf"
    read -p "Selecciona (1 o 2): " choice
    
    if [ "$choice" == "1" ]; then
        CONFIG_FILE="/etc/nginx/sites-available/hq.infratec.com.uy"
    else
        CONFIG_FILE="/etc/nginx/conf.d/hq.infratec.com.uy.conf"
    fi
    
    echo -e "${YELLOW}📝 Se creará: $CONFIG_FILE${NC}"
else
    echo -e "${GREEN}✓ Encontrado: $CONFIG_FILE${NC}"
fi

# Hacer backup del archivo actual si existe
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo ""
    echo "💾 Creando backup..."
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup creado: $BACKUP_FILE${NC}"
fi

# Mostrar opciones
echo ""
echo "¿Qué deseas hacer?"
echo "1) Ver la configuración actual"
echo "2) Agregar solo las rutas públicas (recomendado)"
echo "3) Reemplazar con configuración completa"
echo "4) Salir"
read -p "Selecciona (1-4): " action

case $action in
    1)
        echo ""
        echo "📄 Configuración actual:"
        echo "----------------------------------------"
        cat "$CONFIG_FILE"
        echo "----------------------------------------"
        ;;
    2)
        echo ""
        echo "📝 Agregando rutas públicas..."
        
        # Verificar si ya tiene auth_basic
        if grep -q "auth_basic" "$CONFIG_FILE"; then
            echo -e "${YELLOW}⚠️  El archivo ya tiene configuración de autenticación${NC}"
            echo "Debes editar manualmente el archivo y agregar ANTES de 'location /':"
            echo ""
            echo "    # Archivos PWA públicos"
            echo "    location ~ ^/(manifest\.json|sw\.js|clear-cache\.html)$ {"
            echo "        auth_basic off;"
            echo "        proxy_pass http://192.168.99.84:3000;"
            echo "        proxy_set_header Host \$host;"
            echo "        proxy_set_header X-Real-IP \$remote_addr;"
            echo "    }"
            echo ""
            read -p "¿Quieres abrir el archivo para editarlo? (s/n): " edit
            if [ "$edit" == "s" ]; then
                nano "$CONFIG_FILE"
            fi
        else
            echo -e "${RED}❌ No se encontró configuración de autenticación${NC}"
            echo "El archivo no parece tener auth_basic configurado"
        fi
        ;;
    3)
        echo ""
        echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto reemplazará toda la configuración${NC}"
        read -p "¿Estás seguro? (escribe 'SI' para confirmar): " confirm
        
        if [ "$confirm" == "SI" ]; then
            echo "📝 Reemplazando configuración..."
            
            # Aquí deberías tener el archivo nginx-hq.infratec.com.uy.conf
            if [ -f "./nginx-hq.infratec.com.uy.conf" ]; then
                cp ./nginx-hq.infratec.com.uy.conf "$CONFIG_FILE"
                echo -e "${GREEN}✓ Configuración reemplazada${NC}"
            else
                echo -e "${RED}❌ No se encontró nginx-hq.infratec.com.uy.conf en el directorio actual${NC}"
                exit 1
            fi
        else
            echo "Operación cancelada"
            exit 0
        fi
        ;;
    4)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

# Verificar configuración
echo ""
echo "🔍 Verificando configuración de Nginx..."
if nginx -t; then
    echo -e "${GREEN}✓ Configuración válida${NC}"
    
    read -p "¿Quieres recargar Nginx ahora? (s/n): " reload
    if [ "$reload" == "s" ]; then
        echo "🔄 Recargando Nginx..."
        systemctl reload nginx
        echo -e "${GREEN}✓ Nginx recargado${NC}"
        
        echo ""
        echo "🎉 ¡Listo! Ahora verifica que funcione:"
        echo "   curl -I https://hq.infratec.com.uy/manifest.json"
        echo ""
        echo "Deberías ver: HTTP/2 200"
    fi
else
    echo -e "${RED}❌ Error en la configuración de Nginx${NC}"
    echo "Revisa los errores arriba y corrige el archivo"
    echo "Archivo: $CONFIG_FILE"
    echo "Backup: $BACKUP_FILE"
fi
