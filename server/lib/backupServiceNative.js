const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { getMongoDb, mongoClient } = require('./mongoClient');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const BACKUP_ROOT = path.resolve(__dirname, '..', 'backup');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
}

const getConfig = () => {
    const configPath = path.resolve(__dirname, '..', '.selected-db.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('No se encontró configuración de base de datos (.selected-db.json)');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
};

/**
 * Create backup using native MongoDB driver
 * Exports all collections as JSON files
 */
const createBackup = async () => {
    const db = getMongoDb();
    if (!db) {
        throw new Error('No hay conexión a MongoDB');
    }

    const config = getConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${db.databaseName || 'adminflow'}_${timestamp}`;
    const backupDir = path.join(BACKUP_ROOT, backupName);

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
        console.log(`💾 [BACKUP] Iniciando respaldo en: ${backupDir}`);
        console.log(`📡 [BACKUP] Conectado a: ${config.mongoUri}`);

        // Get all collections
        const collections = await db.listCollections().toArray();
        console.log(`📋 [BACKUP] Encontradas ${collections.length} colecciones`);

        const backupMetadata = {
            timestamp: new Date().toISOString(),
            database: db.databaseName || 'adminflow',
            collections: {}
        };

        // Export each collection
        for (const col of collections) {
            try {
                const collectionName = col.name;
                console.log(`📦 [BACKUP] Respaldando colección: ${collectionName}`);

                const collection = db.collection(collectionName);
                const docs = await collection.find({}).toArray();

                const collectionPath = path.join(backupDir, `${collectionName}.json`);
                fs.writeFileSync(collectionPath, JSON.stringify(docs, null, 2), 'utf8');

                backupMetadata.collections[collectionName] = {
                    documents: docs.length,
                    sizeBytes: fs.statSync(collectionPath).size
                };

                console.log(`✅ [BACKUP] Colección: ${collectionName} (${docs.length} documentos)`);
            } catch (err) {
                console.warn(`⚠️  [BACKUP] Error respaldando ${col.name}: ${err.message}`);
                backupMetadata.collections[col.name] = {
                    error: err.message
                };
            }
        }

        // Write metadata file
        const metadataPath = path.join(backupDir, '_metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(backupMetadata, null, 2), 'utf8');

        console.log(`✅ [BACKUP] Respaldo completado: ${backupName}`);

        return {
            success: true,
            backupName,
            path: backupDir,
            timestamp: backupMetadata.timestamp,
            collections: backupMetadata.collections
        };
    } catch (error) {
        console.error(`❌ [BACKUP] Error: ${error.message}`);
        // Try to clean up the backup directory if it was created
        try {
            if (fs.existsSync(backupDir)) {
                fs.rmSync(backupDir, { recursive: true });
            }
        } catch (cleanupErr) {
            console.warn(`⚠️  [BACKUP] No se pudo limpiar directorio: ${cleanupErr.message}`);
        }
        throw new Error(`Error al crear respaldo: ${error.message}`);
    }
};

/**
 * List all available backups
 */
const listBackups = async () => {
    try {
        const files = await readdir(BACKUP_ROOT);
        const backups = [];

        for (const file of files) {
            const filePath = path.join(BACKUP_ROOT, file);
            const stats = await stat(filePath);
            if (stats.isDirectory()) {
                // Try to read metadata
                let metadata = null;
                try {
                    const metadataPath = path.join(filePath, '_metadata.json');
                    if (fs.existsSync(metadataPath)) {
                        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    }
                } catch (err) {
                    console.warn(`Could not read metadata for ${file}:`, err.message);
                }

                backups.push({
                    name: file,
                    createdAt: stats.birthtimeMs ? new Date(stats.birthtimeMs) : stats.birthtime,
                    metadata
                });
            }
        }

        // Sort by date desc
        return backups.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error in listBackups:', error);
        throw new Error(`Error al listar respaldos: ${error.message}`);
    }
};

/**
 * Restore backup using native MongoDB driver
 * Imports all JSON files back into the database
 */
const restoreBackup = async (backupName) => {
    const db = getMongoDb();
    if (!db) {
        throw new Error('No hay conexión a MongoDB');
    }

    const backupDir = path.join(BACKUP_ROOT, backupName);
    if (!fs.existsSync(backupDir)) {
        throw new Error(`El respaldo ${backupName} no existe`);
    }

    try {
        console.log(`Starting restore from: ${backupDir}`);

        const files = fs.readdirSync(backupDir);
        const restoreMetadata = {
            timestamp: new Date().toISOString(),
            originalBackup: backupName,
            collections: {}
        };

        // Restore each collection
        for (const file of files) {
            // Skip metadata file
            if (file === '_metadata.json') continue;

            if (!file.endsWith('.json')) continue;

            const collectionName = file.replace('.json', '');
            console.log(`Restoring collection: ${collectionName}`);

            try {
                const filePath = path.join(backupDir, file);
                const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                const collection = db.collection(collectionName);

                // Drop existing collection if it exists
                try {
                    await collection.drop();
                } catch (err) {
                    // Collection might not exist, that's ok
                }

                if (Array.isArray(jsonData) && jsonData.length > 0) {
                    const result = await collection.insertMany(jsonData);
                    restoreMetadata.collections[collectionName] = {
                        documentsInserted: result.insertedCount
                    };
                    console.log(`✓ Restored ${collectionName}: ${result.insertedCount} documents`);
                } else {
                    console.log(`⚠ No documents to restore in ${collectionName}`);
                    restoreMetadata.collections[collectionName] = {
                        documentsInserted: 0
                    };
                }
            } catch (err) {
                console.warn(`⚠ Error restoring collection ${collectionName}:`, err.message);
                restoreMetadata.collections[collectionName] = {
                    error: err.message
                };
            }
        }

        console.log(`✓ Restore completed from: ${backupName}`);

        return {
            success: true,
            message: 'Restauración completada',
            restoredFrom: backupName,
            collections: restoreMetadata.collections
        };
    } catch (error) {
        console.error('Restore failed:', error);
        throw new Error(`Error al restaurar respaldo: ${error.message}`);
    }
};

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    BACKUP_ROOT
};
