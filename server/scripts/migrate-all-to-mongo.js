const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Leer configuración de MongoDB
const configPath = path.resolve(__dirname, '..', '.selected-db.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const MONGO_URI = config.mongoUri;
const MONGO_DB = config.mongoDb;
const SQLITE_PATH = path.resolve(__dirname, '..', 'database', 'database.sqlite');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     Migración Completa: SQLite → MongoDB              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function migrateAllData() {
    const sqliteDb = new sqlite3.Database(SQLITE_PATH);
    let mongoClient;
    let mongoDb;

    try {
        // Conectar a MongoDB
        console.log('📡 Conectando a MongoDB...');
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        mongoDb = mongoClient.db(MONGO_DB);
        console.log('✅ Conectado a MongoDB\n');

        // Tablas a migrar
        const tables = [
            'clients',
            'tickets',
            'contracts',
            'products',
            'budgets',
            'budget_items',
            'payments',
            'repository',
            'calendar_events'
        ];

        const stats = {};

        for (const table of tables) {
            console.log(`\n📦 Migrando tabla: ${table}`);

            try {
                // Obtener datos de SQLite
                const rows = await new Promise((resolve, reject) => {
                    sqliteDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });

                if (rows.length === 0) {
                    console.log(`   ⚠️  Tabla vacía, saltando...`);
                    stats[table] = 0;
                    continue;
                }

                // Transformar datos según la tabla
                const documents = rows.map(row => {
                    const doc = { ...row };

                    // Convertir id de SQLite a sqliteId
                    if (doc.id) {
                        doc.sqliteId = doc.id;
                        delete doc.id;
                    }

                    // Parsear campos JSON
                    if (table === 'tickets') {
                        if (doc.annotations && typeof doc.annotations === 'string') {
                            try { doc.annotations = JSON.parse(doc.annotations); } catch (e) { doc.annotations = []; }
                        }
                        if (doc.attachments && typeof doc.attachments === 'string') {
                            try { doc.attachments = JSON.parse(doc.attachments); } catch (e) { doc.attachments = []; }
                        }
                        if (doc.audioNotes && typeof doc.audioNotes === 'string') {
                            try { doc.audioNotes = JSON.parse(doc.audioNotes); } catch (e) { doc.audioNotes = []; }
                        }
                    }

                    if (table === 'budgets' && doc.sections && typeof doc.sections === 'string') {
                        try { doc.sections = JSON.parse(doc.sections); } catch (e) { doc.sections = []; }
                    }

                    // Convertir fechas
                    if (doc.createdAt && typeof doc.createdAt === 'string') {
                        doc.createdAt = new Date(doc.createdAt);
                    }
                    if (doc.updatedAt && typeof doc.updatedAt === 'string') {
                        doc.updatedAt = new Date(doc.updatedAt);
                    }

                    return doc;
                });

                // Insertar en MongoDB (usando insertMany con ordered: false para continuar en caso de duplicados)
                try {
                    const result = await mongoDb.collection(table).insertMany(documents, { ordered: false });
                    stats[table] = result.insertedCount;
                    console.log(`   ✅ Migrados ${result.insertedCount} registros`);
                } catch (bulkError) {
                    // Si hay duplicados, contar los insertados exitosamente
                    if (bulkError.code === 11000 || bulkError.writeErrors) {
                        const inserted = bulkError.result?.nInserted || 0;
                        stats[table] = inserted;
                        console.log(`   ⚠️  ${inserted} registros migrados (algunos ya existían)`);
                    } else {
                        throw bulkError;
                    }
                }

            } catch (tableError) {
                console.error(`   ❌ Error migrando ${table}:`, tableError.message);
                stats[table] = 0;
            }
        }

        // Resumen
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║              📊 RESUMEN DE MIGRACIÓN                  ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        let total = 0;
        for (const [table, count] of Object.entries(stats)) {
            console.log(`   ${table.padEnd(20)} → ${count} registros`);
            total += count;
        }

        console.log(`\n   ${'TOTAL'.padEnd(20)} → ${total} registros\n`);
        console.log('✅ Migración completada!\n');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        throw error;
    } finally {
        // Cerrar conexiones
        if (sqliteDb) {
            sqliteDb.close();
        }
        if (mongoClient) {
            await mongoClient.close();
        }
    }
}

// Ejecutar migración
migrateAllData()
    .then(() => {
        console.log('🎉 Proceso completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
