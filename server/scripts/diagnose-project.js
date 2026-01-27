const { getInstallationReport } = require('../lib/installationValidator');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function run() {
    console.log('Iniciando diagnóstico del proyecto...');

    // 1. Validar instalación existente
    console.log('\n--- DIAGNÓSTICO DE INSTALACIÓN ---');
    try {
        const report = await getInstallationReport();
        console.log(report);
    } catch (e) {
        console.error('Error al ejecutar validador:', e);
    }

    // 2. Verificar estructura de directorios
    console.log('\n--- DIAGNÓSTICO DE ESTRUCTURA ---');
    const rootDir = path.resolve(__dirname, '../../');
    const clientDir = path.join(rootDir, 'client');
    const serverDir = path.join(rootDir, 'server');

    if (fs.existsSync(path.join(rootDir, 'package.json'))) {
        console.log('⚠️  ALERTA: package.json encontrado en raíz. Esto puede causar conflictos si no es un workspace configurado.');
    }
    if (fs.existsSync(path.join(rootDir, 'node_modules'))) {
        console.log('⚠️  ALERTA: node_modules encontrado en raíz.');
    }

    // 3. Verificar dependencias
    console.log('\n--- VERIFICACIÓN DE DEPENDENCIAS ---');
    try {
        console.log('Client dependencias:');
        if (fs.existsSync(path.join(clientDir, 'node_modules'))) {
            console.log('✅ client/node_modules existe.');
        } else {
            console.log('❌ client/node_modules NO existe. Se requiere npm install.');
        }

        console.log('Server dependencias:');
        if (fs.existsSync(path.join(serverDir, 'node_modules'))) {
            console.log('✅ server/node_modules existe.');
        } else {
            console.log('❌ server/node_modules NO existe. Se requiere npm install.');
        }
    } catch (e) {
        console.error('Error verificando dependencias:', e);
    }

    console.log('\n--- DIAGNÓSTICO FINALIZADO ---');
}

run();
