// server/lib/serverStart.js
// Maneja el inicio del servidor con verificación de instalación

const fs = require('fs');
const path = require('path');
const { initDB } = require('../db');
const { ensureTicketSchema } = require('./ticketSchema');
const { ensureBudgetSchema } = require('./budgetSchema');
const { ensureProductSchema } = require('./productSchema');
const { ensureSupplierSchema } = require('./supplierSchema');
const { ensureDefaultGroups } = require('./groupService');

const INSTALL_LOCK_FILE = path.join(__dirname, '../.installed');

function isInstalled() {
    return fs.existsSync(INSTALL_LOCK_FILE);
}

async function startServer(app, PORT) {
    console.log('\n🚀 Iniciando AdminFlow Server...\n');

    // Verificar si el sistema está instalado
    if (!isInstalled()) {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║          ⚠️  SISTEMA NO INSTALADO                     ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('\n📋 Por favor completa la instalación:');
        console.log('   1. Abre tu navegador');
        console.log('   2. Ve a: http://localhost:3000/install');
        console.log('   3. Sigue el wizard de instalación\n');
        console.log('⏭️  El servidor está listo, esperando instalación...\n');

        // Iniciar servidor sin inicializar BD
        app.listen(PORT, '0.0.0.0', () => {
            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║              🎉 SERVIDOR INICIADO                      ║');
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log(`\n🌐 Servidor corriendo en: http://0.0.0.0:${PORT}`);
            console.log(`📦 Estado: Esperando instalación`);
            console.log(`🔧 Instalador: http://localhost:3000/install\n`);
        });
        return;
    }

    // Sistema instalado, proceder con inicialización normal
    console.log('✅ Sistema instalado, inicializando...\n');

    // Auto-inicializar MongoDB PRIMERO
    const { autoInitMongo } = require('./autoInitMongo');
    const { determineDbEngine } = require('./dbChoice');

    const mongoStatus = await autoInitMongo();

    // Guardar estado global para middleware
    global.mongoInitialized = mongoStatus.success && mongoStatus.initialized;
    global.mongoInitError = mongoStatus.error || null;

    if (!global.mongoInitialized) {
        console.warn('⚠️  ADVERTENCIA: MongoDB no está disponible');
        console.warn('   Las operaciones de base de datos fallarán');
        console.warn('   Verifica la configuración y reinicia el servidor\n');
    }

    try {
        // Inicializar DB (ahora solo verifica admin en MongoDB)
        await initDB();
        console.log('✅ Base de datos inicializada');
    } catch (dbError) {
        console.error('❌ Error inicializando base de datos:', dbError);
    }

    try {
        await ensureTicketSchema();
        console.log('╨Yo. Esquema de tickets asegurado');
    } catch (schemaError) {
        console.error('╨?O Error asegurando la columna assigned_group en tickets:', schemaError);
    }

    try {
        await ensureBudgetSchema();
        console.log('╨Yo. Esquema de presupuestos asegurado');
    } catch (schemaError) {
        console.error('╨?O Error asegurando el esquema de presupuestos:', schemaError);
    }

    try {
        await ensureProductSchema();
        console.log('Esquema de productos asegurado');
    } catch (schemaError) {
        console.error('Error asegurando el esquema de productos:', schemaError);
    }

    try {
        await ensureSupplierSchema();
        console.log('Esquema de proveedores asegurado');
    } catch (schemaError) {
        console.error('Error asegurando el esquema de proveedores:', schemaError);
    }

    try {
        await ensureDefaultGroups();
        console.log('╨Yo. Grupos predeterminados verificados');
    } catch (groupError) {
        console.error('╨?O Error asegurando los grupos predeterminados:', groupError);
    }

    // Determinar motor de BD
    const engine = await determineDbEngine();
    console.log(`🗄️  Motor de BD: ${engine}\n`);

    // Iniciar servidor HTTP
    app.listen(PORT, '0.0.0.0', () => {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║              🎉 SERVIDOR INICIADO                      ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log(`\n🌐 Servidor corriendo en: http://0.0.0.0:${PORT}`);
        console.log(`📊 MongoDB: ${global.mongoInitialized ? '✅ Conectado' : '❌ No disponible'}`);
        console.log(`🔐 Credenciales por defecto: admin@adminflow.uy / admin\n`);
    });
}

module.exports = { startServer, isInstalled };
