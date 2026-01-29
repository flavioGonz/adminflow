const fs = require('fs');
const path = require('path');
const { initDB } = require('../db');
const { ensureTicketSchema } = require('./ticketSchema');
const { ensureBudgetSchema } = require('./budgetSchema');
const { ensureProductSchema } = require('./productSchema');
const { ensureSupplierSchema } = require('./supplierSchema');
const { ensureClientSchema } = require('./clientSchema');
const { ensureDefaultGroups } = require('./groupService');
const recurringPaymentService = require('./recurringPaymentService');

const INSTALL_LOCK_FILE = path.join(__dirname, '../.installed');

function isInstalled() {
    return fs.existsSync(INSTALL_LOCK_FILE);
}

async function startServer(app, PORT) {
    console.log('\n🚀 Iniciando AdminFlow Server...\n');

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

    try { await initDB(); } catch (e) { console.error('Error initDB:', e.message); }
    try { await ensureTicketSchema(); } catch (e) { console.error('Error ticketSchema:', e.message); }
    try { await ensureBudgetSchema(); } catch (e) { console.error('Error budgetSchema:', e.message); }
    try { await ensureProductSchema(); } catch (e) { console.error('Error productSchema:', e.message); }
    try { await ensureSupplierSchema(); } catch (e) { console.error('Error supplierSchema:', e.message); }
    try { await ensureClientSchema(); } catch (e) { console.error('Error clientSchema:', e.message); }
    try { await ensureDefaultGroups(); } catch (e) { console.error('Error defaultGroups:', e.message); }

    const engine = await determineDbEngine();
    console.log('🗄️  Motor de BD: ' + engine);

    // Activar sistema de pagos recurrentes
    recurringPaymentService.start();

    app.listen(PORT, '0.0.0.0', () => {
        console.log('🌐 Servidor corriendo en: http://0.0.0.0:' + PORT);
        console.log('📊 MongoDB: ' + (global.mongoInitialized ? '✅ Conectado' : '❌ No disponible'));
    });
}

module.exports = { startServer, isInstalled };
