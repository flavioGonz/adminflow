#!/bin/bash
# Script para desplegar AdminFlow en producción
# Compila el cliente Next.js y luego inicia el servidor

set -e

echo "======================================="
echo "🚀 AdminFlow Production Deploy"
echo "======================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Compilar cliente Next.js
echo -e "\n${YELLOW}📦 Compilando cliente Next.js...${NC}"
cd client
npm run build
cd ..

if [ ! -d "client/.next" ]; then
    echo -e "${RED}❌ Error: La carpeta .next no se generó${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Cliente compilado exitosamente${NC}"

# 2. Instalar dependencias del servidor si es necesario
echo -e "\n${YELLOW}📦 Verificando dependencias del servidor...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo -e "${GREEN}✅ Dependencias verificadas${NC}"

# 3. Iniciar servidor con PM2
echo -e "\n${YELLOW}🚀 Iniciando servidor con PM2...${NC}"

if command -v pm2 &> /dev/null; then
    cd server
    pm2 stop adminflow || true
    pm2 start index.js --name "adminflow" --instances 1 --env production
    pm2 save
    cd ..
    echo -e "${GREEN}✅ Servidor iniciado con PM2${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 no está instalado. Iniciando con node...${NC}"
    cd server
    node index.js &
    cd ..
fi

echo -e "\n${GREEN}======================================="
echo "🎉 AdminFlow está listo en producción"
echo "=======================================${NC}"
