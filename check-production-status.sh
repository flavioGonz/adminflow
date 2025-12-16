#!/bin/bash
# Script para verificar el estado de la instalación en el servidor Alpine

echo "========================================"
echo "🔍 AdminFlow Production Check"
echo "========================================"

BASE_PATH="/root/adminflow"  # Ajusta esto a tu ruta

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Función para verificar que un archivo/carpeta existe
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - NO ENCONTRADO${NC}"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - NO ENCONTRADO${NC}"
        return 1
    fi
}

echo -e "\n${YELLOW}📁 Verificando estructura de carpetas...${NC}"
check_dir "$BASE_PATH/client/.next"
check_dir "$BASE_PATH/client/public"
check_dir "$BASE_PATH/server/node_modules"
check_file "$BASE_PATH/server/index.js"
check_file "$BASE_PATH/server/.installed"

echo -e "\n${YELLOW}🔐 Verificando permisos...${NC}"
if [ -w "$BASE_PATH/server" ]; then
    echo -e "${GREEN}✅ Permisos de escritura en server${NC}"
else
    echo -e "${RED}❌ Sin permisos de escritura en server${NC}"
fi

echo -e "\n${YELLOW}🚀 Estado de PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 status | grep adminflow
    echo -e "${GREEN}✅ PM2 disponible${NC}"
else
    echo -e "${RED}❌ PM2 no está instalado${NC}"
fi

echo -e "\n${YELLOW}🌐 Verificando puerto...${NC}"
if netstat -tulpn 2>/dev/null | grep -q ':80 \|:3000 \|:5000 '; then
    echo -e "${GREEN}✅ Puerto disponible${NC}"
else
    echo -e "${YELLOW}⚠️  No hay servicio escuchando${NC}"
fi

echo -e "\n${YELLOW}📊 Espacio en disco...${NC}"
df -h "$BASE_PATH" | tail -1

echo -e "\n${YELLOW}📝 Últimas líneas del log...${NC}"
if [ -f "$BASE_PATH/server/.pm2/logs/adminflow-out.log" ]; then
    tail -10 "$BASE_PATH/server/.pm2/logs/adminflow-out.log"
fi

echo -e "\n${YELLOW}📦 Archivos Next.js principales...${NC}"
echo "Total archivos en .next:"
find "$BASE_PATH/client/.next" -type f | wc -l
echo ""
find "$BASE_PATH/client/.next/static" -type f | head -5

echo -e "\n========================================"
echo -e "${GREEN}✅ Verificación completada${NC}"
echo "========================================"
