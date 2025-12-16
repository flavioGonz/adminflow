// check-installation-status.js
// Script para verificar el estado de instalación del sistema

const fs = require('fs');
const path = require('path');

const SERVER_DIR = path.join(__dirname, 'server');
const INSTALL_LOCK_FILE = path.join(SERVER_DIR, '.installed');
const DB_CONFIG_FILE = path.join(SERVER_DIR, '.selected-db.json');

console.log('🔍 Verificando estado de instalación...\n');

// Verificar .installed
console.log('1. Archivo .installed:');
if (fs.existsSync(INSTALL_LOCK_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(INSTALL_LOCK_FILE, 'utf-8'));
        console.log('   ✅ Existe');
        console.log('   📅 Instalado el:', data.installedAt);
        console.log('   📦 Versión:', data.version);
    } catch (error) {
        console.log('   ⚠️  Existe pero no se puede leer:', error.message);
    }
} else {
    console.log('   ❌ NO existe');
    console.log(`   Path esperado: ${INSTALL_LOCK_FILE}`);
}

console.log('\n2. Archivo .selected-db.json:');
if (fs.existsSync(DB_CONFIG_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf-8'));
        console.log('   ✅ Existe');
        console.log('   🗄️  Engine:', data.engine);
        if (data.engine === 'mongodb') {
            console.log('   🔗 MongoDB URI:', data.mongoUri);
            console.log('   📦 MongoDB DB:', data.mongoDb);
        } else {
            console.log('   📁 SQLite Path:', data.sqlitePath);
        }
    } catch (error) {
        console.log('   ⚠️  Existe pero no se puede leer:', error.message);
    }
} else {
    console.log('   ❌ NO existe');
    console.log(`   Path esperado: ${DB_CONFIG_FILE}`);
}

// Verificar variables de entorno
console.log('\n3. Variables de entorno:');
console.log('   DB_ENGINE:', process.env.DB_ENGINE || '(no definida)');
console.log('   MONGO_URI:', process.env.MONGO_URI || '(no definida)');
console.log('   MONGO_DB:', process.env.MONGO_DB || '(no definida)');

// Conclusión
console.log('\n' + '='.repeat(60));
const isInstalled = fs.existsSync(INSTALL_LOCK_FILE);
const hasDbConfig = fs.existsSync(DB_CONFIG_FILE);

if (isInstalled && hasDbConfig) {
    console.log('✅ El sistema está correctamente configurado');
} else if (!isInstalled && !hasDbConfig) {
    console.log('❌ El sistema NO está instalado');
    console.log('   Ejecuta: node server/fix-production-install.js');
} else if (!isInstalled) {
    console.log('⚠️  Falta el archivo .installed');
    console.log('   Ejecuta: node server/fix-production-install.js');
} else {
    console.log('⚠️  Falta el archivo .selected-db.json');
    console.log('   Ejecuta: node server/fix-production-install.js');
}
console.log('='.repeat(60) + '\n');
