// server/lib/mongoInit.js
// Inicialización automática de MongoDB con esquemas y colecciones

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

/**
 * Inicializa la base de datos MongoDB con todas las colecciones y esquemas necesarios
 * @param {string} mongoUri - URI de conexión a MongoDB
 * @param {string} dbName - Nombre de la base de datos
 * @returns {Promise<{success: boolean, message: string, collections: string[]}>}
 */
async function initializeMongoDB(mongoUri, dbName = 'adminflow', isNew = false) {
    let client;

    try {
        console.log('🔄 Conectando a MongoDB...');
        client = new MongoClient(mongoUri);
        await client.connect();

        const db = client.db(dbName);
        console.log(`✅ Conectado a base de datos: ${dbName}`);

        // Si es una instalación nueva, eliminar la base de datos existente
        if (isNew) {
            console.log('⚠️  Modo "Nueva Base de Datos" seleccionado. Eliminando base de datos existente...');
            try {
                await db.dropDatabase();
                console.log('✅ Base de datos eliminada correctamente.');
            } catch (dropError) {
                console.warn('⚠️  No se pudo eliminar la base de datos (puede que no existiera):', dropError.message);
            }
        }

        // Leer el diagrama JSON
        const diagramPath = path.join(__dirname, '../database/MongoDB_Diagrama.json');
        let diagram;

        try {
            const diagramContent = fs.readFileSync(diagramPath, 'utf8');
            diagram = JSON.parse(diagramContent);
        } catch (error) {
            console.warn('⚠️  No se pudo leer el diagrama MongoDB, usando esquemas por defecto');
            diagram = getDefaultSchema();
        }

        const collections = diagram.collections || {};
        const createdCollections = [];

        // Obtener colecciones existentes
        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map(c => c.name);

        console.log('📋 Inicializando colecciones...');

        for (const [collectionKey, collectionData] of Object.entries(collections)) {
            const collectionName = collectionKey.split('.').pop(); // adminflow.clients -> clients

            if (!collectionName || collectionName === 'adminflow') continue;

            try {
                if (!existingNames.includes(collectionName)) {
                    // Crear colección con validación de esquema
                    await db.createCollection(collectionName, {
                        validator: {
                            $jsonSchema: collectionData.jsonSchema || {}
                        },
                        validationLevel: 'moderate', // 'strict' | 'moderate' | 'off'
                        validationAction: 'warn' // 'error' | 'warn'
                    });
                    console.log(`  ✅ Colección creada: ${collectionName}`);
                    createdCollections.push(collectionName);
                } else {
                    console.log(`  ℹ️  Colección ya existe: ${collectionName}`);
                }

                // Crear índices recomendados
                await createIndexes(db, collectionName);

            } catch (error) {
                console.error(`  ❌ Error en colección ${collectionName}:`, error.message);
            }
        }

        // Crear usuario admin si no existe
        await createDefaultAdmin(db);

        // Crear configuraciones por defecto
        await createDefaultConfigurations(db);

        console.log('✅ Inicialización de MongoDB completada');

        return {
            success: true,
            message: 'MongoDB inicializado correctamente',
            collections: createdCollections,
            totalCollections: Object.keys(collections).length - 1 // -1 por 'adminflow.adminflow'
        };

    } catch (error) {
        console.error('❌ Error al inicializar MongoDB:', error);
        return {
            success: false,
            message: error.message,
            collections: []
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Crea índices recomendados para cada colección
 */
async function createIndexes(db, collectionName) {
    const collection = db.collection(collectionName);

    const indexes = {
        users: [
            { key: { email: 1 }, unique: true },
            { key: { createdAt: -1 } }
        ],
        clients: [
            { key: { email: 1 }, unique: true, sparse: true },
            { key: { name: 1 } },
            { key: { alias: 1 } },
            { key: { contract: 1 } },
            { key: { createdAt: -1 } }
        ],
        tickets: [
            { key: { clientId: 1 } },
            { key: { status: 1 } },
            { key: { priority: 1 } },
            { key: { createdAt: -1 } },
            { key: { clientId: 1, status: 1 } }
        ],
        budgets: [
            { key: { clientId: 1 } },
            { key: { status: 1 } },
            { key: { createdAt: -1 } }
        ],
        budget_items: [
            { key: { budgetId: 1 } },
            { key: { productId: 1 } }
        ],
        contracts: [
            { key: { clientId: 1 } },
            { key: { status: 1 } },
            { key: { startDate: 1 } },
            { key: { endDate: 1 } }
        ],
        payments: [
            { key: { clientId: 1 } },
            { key: { ticketId: 1 } },
            { key: { status: 1 } },
            { key: { createdAt: -1 } }
        ],
        products: [
            { key: { name: 1 } },
            { key: { category: 1 } },
            { key: { manufacturer: 1 } }
        ],
        client_accesses: [
            { key: { clientId: 1 } },
            { key: { tipo_equipo: 1 } },
            { key: { createdAt: -1 } }
        ],
        calendar_events: [
            { key: { start: 1 } },
            { key: { sourceType: 1, sourceId: 1 } }
        ],
        notifications: [
            { key: { event: 1 } },
            { key: { createdAt: -1 } }
        ],
        configurations: [
            { key: { module: 1 }, unique: true }
        ],
        audit_logs: [
            { key: { user: 1 } },
            { key: { action: 1 } },
            { key: { resource: 1 } },
            { key: { createdAt: -1 } }
        ]
    };

    if (indexes[collectionName]) {
        for (const index of indexes[collectionName]) {
            try {
                await collection.createIndex(index.key, {
                    unique: index.unique || false,
                    sparse: index.sparse || false
                });
            } catch (error) {
                // Índice ya existe o error menor, continuar
                if (!error.message.includes('already exists')) {
                    console.warn(`    ⚠️  Índice no creado en ${collectionName}:`, error.message);
                }
            }
        }
    }
}

/**
 * Crea el usuario admin por defecto
 */
async function createDefaultAdmin(db) {
    const bcrypt = require('bcrypt');
    const usersCollection = db.collection('users');

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@adminflow.uy';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';

    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await usersCollection.insertOne({
            _id: 1,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`  ✅ Usuario admin creado: ${adminEmail}`);
    } else {
        console.log(`  ℹ️  Usuario admin ya existe: ${adminEmail}`);
    }
}

/**
 * Crea configuraciones por defecto
 */
async function createDefaultConfigurations(db) {
    const configurationsCollection = db.collection('configurations');

    const defaultConfigs = [
        {
            module: 'notifications',
            data: {
                channels: {
                    email: { enabled: false, apiKey: '', webhook: '', smtpUser: '', smtpPass: '' },
                    telegram: { enabled: false, apiKey: '', webhook: '' },
                    whatsapp: { enabled: false, apiKey: '', webhook: '' },
                    slack: { enabled: false, apiKey: '', webhook: '' }
                },
                templates: {
                    email: { subject: 'Notificación de {{event}}', body: '{{message}}' },
                    telegram: { subject: 'Notificación', body: '{{message}}' },
                    whatsapp: { subject: 'Notificación', body: '{{message}}' },
                    slack: { subject: 'Notificación', body: '{{message}}' }
                },
                events: []
            }
        },
        {
            module: 'tickets',
            data: {
                statusOptions: ['Nuevo', 'Abierto', 'En proceso', 'Visita', 'Resuelto', 'Cerrado', 'Facturar'],
                priorityOptions: ['Baja', 'Media', 'Alta', 'Urgente'],
                defaultStatus: 'Nuevo',
                defaultPriority: 'Media'
            }
        },
        {
            module: 'payments',
            data: {
                statusOptions: ['Pendiente', 'Pagado', 'Facturar', 'Vencido'],
                defaultMethod: 'Efectivo',
                notifyOnLate: true,
                requireReceipt: false
            }
        }
    ];

    for (const config of defaultConfigs) {
        const existing = await configurationsCollection.findOne({ module: config.module });
        if (!existing) {
            await configurationsCollection.insertOne({
                ...config,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`  ✅ Configuración creada: ${config.module}`);
        }
    }
}

/**
 * Esquema por defecto si no se encuentra el diagrama
 */
function getDefaultSchema() {
    return {
        collections: {
            'adminflow.users': {
                jsonSchema: {
                    bsonType: 'object',
                    required: ['_id', 'email', 'password'],
                    properties: {
                        _id: { bsonType: 'int' },
                        email: { bsonType: 'string' },
                        password: { bsonType: 'string' },
                        role: { bsonType: 'string' },
                        createdAt: { bsonType: 'date' },
                        updatedAt: { bsonType: 'date' }
                    }
                }
            },
            'adminflow.clients': {
                jsonSchema: {
                    bsonType: 'object',
                    required: ['_id', 'name'],
                    properties: {
                        _id: { bsonType: 'int' },
                        name: { bsonType: 'string' },
                        alias: { bsonType: 'string' },
                        email: { bsonType: ['string', 'null'] },
                        phone: { bsonType: ['string', 'null'] },
                        address: { bsonType: ['string', 'null'] },
                        contract: { bsonType: 'bool' },
                        latitude: { bsonType: ['double', 'null'] },
                        longitude: { bsonType: ['double', 'null'] },
                        createdAt: { bsonType: 'date' },
                        updatedAt: { bsonType: 'date' }
                    }
                }
            }
            // ... más colecciones básicas
        }
    };
}

/**
 * Verifica la conexión a MongoDB
 */
async function testMongoConnection(mongoUri, dbName = 'adminflow') {
    let client;
    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        await client.db(dbName).admin().ping();
        return { success: true, message: 'Conexión exitosa' };
    } catch (error) {
        return { success: false, message: error.message };
    } finally {
        if (client) await client.close();
    }
}

/**
 * Obtiene estadísticas básicas de la base de datos
 */
async function getDatabaseStats(mongoUri, dbName = 'adminflow') {
    let client;
    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();

        const stats = await Promise.all(collections.map(async (col) => {
            const count = await db.collection(col.name).countDocuments();
            return { name: col.name, count };
        }));

        const dbStats = await db.command({ dbStats: 1 });

        return {
            collections: stats,
            size: dbStats.storageSize || 0
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return null;
    } finally {
        if (client) await client.close();
    }
}

module.exports = {
    initializeMongoDB,
    testMongoConnection,
    createIndexes,
    createDefaultAdmin,
    createDefaultAdmin,
    createDefaultConfigurations,
    getDatabaseStats
};
