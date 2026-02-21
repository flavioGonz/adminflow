const fs = require('fs');
const path = require('path');
// initDB y esquemas de SQLite ya no son necesarios en el arranque principal de Mongo
const { ensureDefaultGroups } = require('./groupService');
const recurringPaymentService = require('./recurringPaymentService');

const INSTALL_LOCK_FILE = path.join(__dirname, '../.installed');

function isInstalled() {
    return fs.existsSync(INSTALL_LOCK_FILE);
}

async function startServer(app, PORT) {
    console.log('\n🚀 Iniciando AdminFlow Server (Exclusivo MongoDB)...\n');

    if (!isInstalled()) {
        console.log('⚠️  SISTEMA NO INSTALADO');
        app.listen(PORT, '0.0.0.0', () => {
            console.log('🌐 Servidor corriendo en: http://0.0.0.0:' + PORT + ' (Esperando instalación)');
        });
        return;
    }

    const { autoInitMongo } = require('./autoInitMongo');
    const { determineDbEngine } = require('./dbChoice');

    const mongoStatus = await autoInitMongo();
    global.mongoInitialized = mongoStatus.success && mongoStatus.initialized;

    // Solo inicializamos grupos por defecto en Mongo
    try { await ensureDefaultGroups(); } catch (e) { console.error('Error defaultGroups:', e.message); }

    const engine = await determineDbEngine();
    console.log('🗄️  Motor de BD activo: ' + engine);

    // Activar sistema de pagos recurrentes
    // recurringPaymentService.start();

    app.listen(PORT, '0.0.0.0', () => {
        console.log('🌐 Servidor corriendo en: http://0.0.0.0:' + PORT);
        console.log('📊 MongoDB Status: ' + (global.mongoInitialized ? '✅ Conectado' : '❌ No disponible'));
    });
}

module.exports = { startServer, isInstalled };
