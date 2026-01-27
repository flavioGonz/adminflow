// fix-production-install.js
// Script para marcar el sistema como instalado en producción

const fs = require('fs');
const path = require('path');

const INSTALL_LOCK_FILE = path.join(__dirname, '.installed');
const DB_CONFIG_FILE = path.join(__dirname, '.selected-db.json');

console.log('🔧 Configurando instalación para producción...\n');

// 1. Crear archivo .installed
const installData = {
    installedAt: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    note: 'Sistema configurado manualmente para producción'
};

try {
    fs.writeFileSync(INSTALL_LOCK_FILE, JSON.stringify(installData, null, 2));
    console.log('✅ Archivo .installed creado');
    console.log(`   Path: ${INSTALL_LOCK_FILE}`);
} catch (error) {
    console.error('❌ Error creando .installed:', error.message);
    process.exit(1);
}

// 2. Crear/actualizar archivo .selected-db.json
const dbConfig = {
    engine: 'mongodb',
    mongoUri: process.env.MONGO_URI || 'mongodb://crm.infratec.com.uy:29999',
    mongoDb: process.env.MONGO_DB || 'adminflow',
    sqlitePath: 'database/database.sqlite'
};

try {
    fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(dbConfig, null, 2));
    console.log('✅ Archivo .selected-db.json creado');
    console.log(`   Path: ${DB_CONFIG_FILE}`);
    console.log(`   Engine: ${dbConfig.engine}`);
    console.log(`   MongoDB URI: ${dbConfig.mongoUri}`);
    console.log(`   MongoDB DB: ${dbConfig.mongoDb}`);
} catch (error) {
    console.error('❌ Error creando .selected-db.json:', error.message);
    process.exit(1);
}

console.log('\n🎉 Sistema configurado correctamente para producción');
console.log('📝 Ahora puedes iniciar el servidor sin que se active el instalador\n');
