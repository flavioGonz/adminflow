// server/lib/autoInitMongo.js
// Auto-inicialización de MongoDB al arrancar el servidor

const { initializeMongoDB, testMongoConnection } = require('./mongoInit');
const { determineDbEngine } = require('./dbChoice');
const fs = require('fs');
const path = require('path');

/**
 * Verifica si MongoDB ya está inicializado
 */
async function isMongoInitialized() {
    try {
        // 🔥 PRIORIDAD 1: Usar mongoServerManager si está disponible
        try {
            const { getMongoServerManager } = require('./mongoServerManager');
            const serverManager = getMongoServerManager();
            
            if (serverManager && serverManager.getServers && serverManager.getServers().size > 0) {
                // Buscar servidor primario
                const servers = Array.from(serverManager.getServers().values());
                const primaryServer = servers.find(s => s.role === 'primary');
                const currentServer = serverManager.getCurrentServer();
                const selectedServer = primaryServer || currentServer;
                
                if (selectedServer) {
                    const { MongoClient } = require('mongodb');
                    const client = new MongoClient(selectedServer.uri);
                    await client.connect();
                    const db = client.db(selectedServer.database || 'adminflow');
                    const collections = await db.listCollections({ name: 'users' }).toArray();
                    await client.close();
                    return collections.length > 0;
                }
            }
        } catch (err) {
            console.warn(`⚠️  No se pudo usar mongoServerManager: ${err.message}`);
        }
        
        // Fallback: usar determineDbEngine
        const config = determineDbEngine();

        if (!config.mongoUri) {
            return false;
        }

        const { MongoClient } = require('mongodb');
        const client = new MongoClient(config.mongoUri);

        await client.connect();
        const db = client.db(config.mongoDb || 'adminflow');

        // Verificar si existe la colección users (indicador de inicialización)
        const collections = await db.listCollections({ name: 'users' }).toArray();
        await client.close();

        return collections.length > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Crea el archivo .selected-db.json si no existe
 */
function ensureDbConfig() {
    const configPath = path.join(__dirname, '../.selected-db.json');

    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            engine: 'mongodb',
            mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
            mongoDb: process.env.MONGODB_DB || 'adminflow',
            sqlitePath: 'database/database.sqlite'
        };

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('✅ Archivo .selected-db.json creado con configuración por defecto');
        return defaultConfig;
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Auto-inicializa MongoDB si es necesario
 * Se ejecuta automáticamente al arrancar el servidor
 */
async function autoInitMongo() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         AdminFlow - Verificación de MongoDB           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
        // 🔥 PRIORIDAD 1: Verificar si existe configuración de servidores múltiples
        const { getMongoServerManager } = require('./mongoServerManager');
        const serverManager = getMongoServerManager();
        
        console.log(`🔍 mongoServerManager disponible: ${!!serverManager}`);
        if (serverManager) {
            const servers = serverManager.getServers();
            console.log(`🔍 Cantidad de servidores en manager: ${Array.isArray(servers) ? servers.length : 0}`);
        }
        
        let config;
        
        // Si existe configuración de servidores, usar el servidor primario
        if (serverManager) {
            const servers = serverManager.getServers();
            if (Array.isArray(servers) && servers.length > 0) {
                console.log('🎯 Usando configuración de servidores múltiples...');

                // Buscar el servidor marcado como primario
                const primaryServer = servers.find(s => s.role === 'primary');
                const currentServer = serverManager.getCurrentServer();
                
                // Usar primario si existe, sino el servidor actual
                const selectedServer = primaryServer || currentServer;
                
                if (selectedServer) {
                    config = {
                        mongoUri: selectedServer.uri,
                        mongoDb: selectedServer.database || 'adminflow',
                        engine: 'mongodb'
                    };
                    
                    console.log(`✅ Servidor seleccionado: ${selectedServer.name} (${selectedServer.role || 'actual'})`);
                    console.log(`   URI: ${selectedServer.uri}`);
                    
                    // Actualizar .selected-db.json para mantener sincronización
                    const configPath = path.join(__dirname, '../.selected-db.json');
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    console.log('✅ Archivo .selected-db.json sincronizado\n');
                }
            }
        }
        
        // Si no hay configuración de servidores, usar el método tradicional
        if (!config) {
            const configPath = path.join(__dirname, '../.selected-db.json');

            if (!fs.existsSync(configPath)) {
                console.log('⚠️  No se encontró configuración de MongoDB\n');
                console.log('🎯 Iniciando instalador interactivo...\n');

                // Ejecutar instalador interactivo
                const { interactiveMongoSetup } = require('./interactiveMongoSetup');
                config = await interactiveMongoSetup();

                if (!config) {
                    console.log('❌ Instalación cancelada\n');
                    return { success: false, initialized: false, error: 'Instalación cancelada por el usuario' };
                }

                // Recargar configuración después del instalador
                return { success: true, initialized: true, wasAlreadyInitialized: false };
            }

            // Asegurar que existe la configuración
            config = ensureDbConfig();
        }

        console.log(`📡 MongoDB URI: ${config.mongoUri}`);
        console.log(`🗄️  Base de datos: ${config.mongoDb}\n`);

        // Probar conexión
        console.log('🔍 Probando conexión a MongoDB...');
        const connectionTest = await testMongoConnection(config.mongoUri, config.mongoDb);

        if (!connectionTest.success) {
            console.error(`❌ Error de conexión: ${connectionTest.message}`);
            console.log('\n⚠️  MongoDB no está disponible. Opciones:');
            console.log('   1. Asegúrate de que MongoDB esté ejecutándose');
            console.log('   2. Verifica la URI en .selected-db.json');
            console.log('   3. Si usas MongoDB Atlas, verifica tu conexión a internet');
            console.log('   4. Ejecuta: npm run setup-mongo para reconfigurar\n');
            console.log('⏭️  El servidor continuará, pero las operaciones de BD fallarán.\n');
            return { success: false, initialized: false, error: connectionTest.message };
        }

        console.log('✅ Conexión exitosa\n');

        // Verificar si ya está inicializado
        console.log('🔍 Verificando estado de la base de datos...');
        const isInitialized = await isMongoInitialized();

        if (isInitialized) {
            console.log('✅ MongoDB ya está inicializado\n');

            // Establecer conexión persistente
            console.log('🔗 Estableciendo conexión persistente...');
            const { initMongo } = require('./mongoClient');
            await initMongo({ uri: config.mongoUri, dbName: config.mongoDb });
            console.log('✅ Conexión persistente establecida\n');

            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║              ✅ MONGODB LISTO                          ║');
            console.log('╚════════════════════════════════════════════════════════╝\n');
            return { success: true, initialized: true, wasAlreadyInitialized: true };
        }

        // Inicializar MongoDB
        console.log('⚠️  MongoDB no está inicializado');
        console.log('🚀 Iniciando auto-inicialización...\n');

        const result = await initializeMongoDB(config.mongoUri, config.mongoDb);

        if (result.success) {
            console.log('\n╔════════════════════════════════════════════════════════╗');
            console.log('║         ✅ AUTO-INICIALIZACIÓN EXITOSA                 ║');
            console.log('╚════════════════════════════════════════════════════════╝\n');
            console.log(`📊 Colecciones creadas: ${result.collections.length}`);
            console.log(`📋 Total de colecciones: ${result.totalCollections}`);
            console.log('\n🎉 MongoDB está listo para usar!\n');
            console.log('💡 Credenciales por defecto:');
            console.log('   Email: admin@adminflow.uy');
            console.log('   Password: admin\n');

            // Establecer conexión persistente
            console.log('🔗 Estableciendo conexión persistente...');
            const { initMongo } = require('./mongoClient');
            await initMongo({ uri: config.mongoUri, dbName: config.mongoDb });
            console.log('✅ Conexión persistente establecida\n');

            return { success: true, initialized: true, wasAlreadyInitialized: false };
        } else {
            console.error('\n❌ Error en la auto-inicialización:', result.message);
            console.log('\n⚠️  El servidor continuará, pero las operaciones de BD fallarán.\n');
            return { success: false, initialized: false, error: result.message };
        }

    } catch (error) {
        console.error('\n❌ Error fatal en auto-inicialización:', error.message);
        console.log('\n⚠️  El servidor continuará, pero las operaciones de BD fallarán.\n');
        return { success: false, initialized: false, error: error.message };
    }
}

/**
 * Middleware para verificar que MongoDB está inicializado
 * Retorna 503 si MongoDB no está disponible
 */
function requireMongoInitialized(req, res, next) {
    if (!global.mongoInitialized) {
        return res.status(503).json({
            error: 'Base de datos no disponible',
            message: 'MongoDB no está inicializado. Verifica la configuración y reinicia el servidor.',
            details: global.mongoInitError || 'Error desconocido'
        });
    }
    next();
}

module.exports = {
    autoInitMongo,
    isMongoInitialized,
    ensureDbConfig,
    requireMongoInitialized
};
