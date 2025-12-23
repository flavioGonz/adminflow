const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../lib/mongoClient');
const { getMongoServerManager } = require('../lib/mongoServerManager');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const SYNC_CONFIG_PATH = path.join(__dirname, '../.sync-schedule.json');

// Get MongoDB overview
router.get('/overview', async (req, res) => {
    try {
        const mongoDb = getMongoDb();

        if (!mongoDb) {
            return res.json({
                collections: [],
                totalSize: 0,
                dbName: '',
                connected: false,
                error: 'MongoDB no está conectado'
            });
        }

        // Get all collections
        const collections = await mongoDb.listCollections().toArray();

        // Get stats for each collection
        const collectionsWithStats = await Promise.all(
            collections.map(async (col) => {
                try {
                    const stats = await mongoDb.collection(col.name).stats();
                    return {
                        name: col.name,
                        count: stats.count || 0,
                        size: stats.size || 0
                    };
                } catch (error) {
                    return {
                        name: col.name,
                        count: 0,
                        size: 0
                    };
                }
            })
        );

        // Calculate total size
        const totalSize = collectionsWithStats.reduce((sum, col) => sum + col.size, 0);

        // Get database name
        const dbName = mongoDb.databaseName;

        // Get MongoDB URI from config
        const configPath = path.resolve(__dirname, '../.selected-db.json');
        let mongoUri = '';
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            mongoUri = config.mongoUri || '';
        }

        console.log(`[DB OVERVIEW] Using DB: ${dbName} URI: ${mongoUri}`);
        res.json({
            collections: collectionsWithStats,
            totalSize,
            dbName,
            mongoUri,
            connected: true
        });
    } catch (error) {
        console.error('Error getting MongoDB overview:', error);
        res.json({
            collections: [],
            totalSize: 0,
            dbName: '',
            connected: false,
            error: error.message
        });
    }
});

// Verify MongoDB connection
router.post('/verify', async (req, res) => {
    const { mongoUri, mongoDb: dbName } = req.body;

    if (!mongoUri) {
        return res.status(400).json({ message: 'URI de MongoDB es requerida' });
    }

    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(mongoUri);

        await client.connect();
        const db = client.db(dbName || 'adminflow');

        // Test the connection
        await db.admin().ping();

        await client.close();

        res.json({
            success: true,
            message: 'Conexión exitosa a MongoDB',
            info: `Conectado a ${dbName || 'adminflow'}`
        });
    } catch (error) {
        console.error('Error verifying MongoDB connection:', error);
        res.status(500).json({
            success: false,
            message: 'Error al conectar con MongoDB',
            error: error.message
        });
    }
});

// Export collection as JSON
router.get('/export/:collection', async (req, res) => {
    const { collection } = req.params;

    try {
        const mongoDb = getMongoDb();

        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        // Get all documents from collection
        const documents = await mongoDb.collection(collection).find({}).toArray();

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${collection}_${new Date().toISOString().split('T')[0]}.json"`);

        res.json(documents);
    } catch (error) {
        console.error(`Error exporting collection ${collection}:`, error);
        res.status(500).json({ message: 'Error al exportar colección', error: error.message });
    }
});

// Drop collection
router.delete('/collections/:collection', async (req, res) => {
    const { collection } = req.params;

    try {
        const mongoDb = getMongoDb();

        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        // Drop the collection
        await mongoDb.collection(collection).drop();

        res.json({
            success: true,
            message: `Colección ${collection} eliminada correctamente`
        });
    } catch (error) {
        console.error(`Error dropping collection ${collection}:`, error);
        res.status(500).json({ message: 'Error al eliminar colección', error: error.message });
    }
});

// Get documents from collection (paginated)
router.get('/collections/:collection/documents', async (req, res) => {
    const { collection } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const total = await mongoDb.collection(collection).countDocuments();
        const documents = await mongoDb.collection(collection)
            .find({})
            .skip(skip)
            .limit(limit)
            .toArray();

        res.json({
            documents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(`Error getting documents for ${collection}:`, error);
        res.status(500).json({ message: 'Error al obtener documentos', error: error.message });
    }
});

// Get collections from specific database
router.post('/collections', async (req, res) => {
    const { uri } = req.body;

    try {
        const { MongoClient } = require('mongodb');
        const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/adminflow';
        const dbName = 'adminflow';
        
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);

        // Get all collections
        const collections = await db.listCollections().toArray();

        // Get stats for each collection
        const collectionsWithStats = await Promise.all(
            collections.map(async (col) => {
                try {
                    const stats = await db.collection(col.name).stats();
                    return {
                        name: col.name,
                        count: stats.count || 0,
                        size: stats.size || 0
                    };
                } catch (error) {
                    return {
                        name: col.name,
                        count: 0,
                        size: 0
                    };
                }
            })
        );

        await client.close();

        res.json({
            collections: collectionsWithStats
        });
    } catch (error) {
        console.error('Error getting collections:', error);
        res.status(500).json({ 
            message: 'Error al obtener colecciones', 
            error: error.message 
        });
    }
});

// Switch database connection
router.post('/switch', async (req, res) => {
    const { uri } = req.body;

    if (!uri) {
        return res.status(400).json({ message: 'URI de MongoDB es requerida' });
    }

    try {
        const { MongoClient } = require('mongodb');
        const dbName = 'adminflow';
        
        // Test the connection
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        await db.admin().ping();

        // Save current URI
        const configPath = path.resolve(__dirname, '../.selected-db.json');
        fs.writeFileSync(configPath, JSON.stringify({ 
            mongoUri: uri, 
            selectedAt: new Date().toISOString() 
        }, null, 2));

        // Get existing collections
        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map(c => c.name);

        // Define required collections
        const requiredCollections = [
            'users', 'tickets', 'clients', 'contracts', 'products',
            'groups', 'notifications', 'audit_logs', 'system_settings'
        ];

        // Find missing collections
        const missingCollections = requiredCollections.filter(
            col => !existingNames.includes(col)
        );

        await client.close();

        res.json({
            success: true,
            message: 'Conexión cambiada correctamente',
            missingCollections,
            uri
        });
    } catch (error) {
        console.error('Error switching database:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al cambiar base de datos', 
            error: error.message 
        });
    }
});

// Deploy missing collections
router.post('/deploy-collections', async (req, res) => {
    const { collections: collectionsToCreate } = req.body;

    if (!collectionsToCreate || !Array.isArray(collectionsToCreate)) {
        return res.status(400).json({ message: 'Lista de colecciones es requerida' });
    }

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const createdCollections = [];

        for (const collectionName of collectionsToCreate) {
            try {
                // Create empty collection by inserting and then deleting a document
                await mongoDb.collection(collectionName).insertOne({ _temp: true });
                await mongoDb.collection(collectionName).deleteOne({ _temp: true });
                createdCollections.push(collectionName);
            } catch (error) {
                console.error(`Error creating collection ${collectionName}:`, error);
            }
        }

        res.json({
            success: true,
            message: `${createdCollections.length} colecciones creadas`,
            createdCollections
        });
    } catch (error) {
        console.error('Error deploying collections:', error);
        res.status(500).json({ 
            message: 'Error al desplegar colecciones', 
            error: error.message 
        });
    }
});

// Create backup
router.post('/backup/create', async (req, res) => {
    try {
        console.log('\n📡 [DB BACKUP] Iniciando creación de respaldo...');
        const { createBackup } = require('../lib/backupServiceNative');
        const result = await createBackup();
        console.log('✅ [DB BACKUP] Respaldo creado exitosamente');
        res.json(result);
    } catch (error) {
        console.error('❌ [DB BACKUP] Error:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Error al crear respaldo',
            error: error.message 
        });
    }
});

// List backups
router.get('/backup/list', async (req, res) => {
    try {
        const { listBackups } = require('../lib/backupServiceNative');
        const backups = await listBackups();
        res.json({
            success: true,
            backups
        });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al listar respaldos',
            error: error.message 
        });
    }
});

// Restore backup
router.post('/backup/restore', async (req, res) => {
    const { backupName } = req.body;

    if (!backupName) {
        return res.status(400).json({ message: 'backupName es requerido' });
    }

    try {
        const { restoreBackup } = require('../lib/backupServiceNative');
        const result = await restoreBackup(backupName);
        res.json(result);
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al restaurar respaldo',
            error: error.message 
        });
    }
});

// Download backup
router.get('/backup/download/:backupName', async (req, res) => {
    const { backupName } = req.params;

    try {
        const { BACKUP_ROOT } = require('../lib/backupServiceNative');
        const backupPath = path.join(BACKUP_ROOT, backupName);

        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ message: 'El respaldo no existe' });
        }

        // Create a zip file
        const archiver = require('archiver');
        const output = res;

        output.on('close', () => {
            console.log(`Backup ${backupName} downloaded (${archiver.getTotalBytesSynchronously()} bytes)`);
        });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${backupName}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            res.status(500).json({ message: 'Error comprimiendo respaldo' });
        });

        archive.pipe(output);
        archive.directory(backupPath, backupName);
        archive.finalize();
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({ 
            message: 'Error al descargar respaldo',
            error: error.message 
        });
    }
});

// Delete backup
router.delete('/backup/delete/:backupName', async (req, res) => {
    const { backupName } = req.params;

    try {
        const { BACKUP_ROOT } = require('../lib/backupServiceNative');
        const backupPath = path.join(BACKUP_ROOT, backupName);

        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ message: 'El respaldo no existe' });
        }

        // Delete the backup directory
        fs.rmSync(backupPath, { recursive: true });

        res.json({
            success: true,
            message: `Respaldo ${backupName} eliminado correctamente`
        });
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al eliminar respaldo',
            error: error.message 
        });
    }
});

// Shared sync helper
const performSync = async ({ sourceId, targetIds, collections, dropBeforeInsert = true }) => {
    const manager = getMongoServerManager();
    const sourceServer = sourceId ? manager.getServer(sourceId) : manager.getCurrentServer();
    if (!sourceServer) {
        throw new Error('Servidor origen no encontrado');
    }

    const targetServers = (targetIds || [])
        .map((id) => manager.getServer(id))
        .filter(Boolean);

    if (!targetServers.length) {
        throw new Error('No se encontraron servidores destino');
    }

    console.log(`[DB SYNC] Source: ${sourceServer.id} URI: ${sourceServer.uri} Targets: ${targetIds && targetIds.join(', ')}`);
    const sourceClient = new MongoClient(sourceServer.uri, { serverSelectionTimeoutMS: 15000 });
    await sourceClient.connect();
    const sourceDb = sourceClient.db(sourceServer.database);

    let collectionNames = collections;
    if (!collectionNames || !collectionNames.length) {
        const colList = await sourceDb.listCollections().toArray();
        collectionNames = colList.map((c) => c.name);
    }

    const report = [];

    for (const target of targetServers) {
        const targetClient = new MongoClient(target.uri, { serverSelectionTimeoutMS: 15000 });
        const targetLog = { target: target.id, ok: true, details: [] };

        try {
            await targetClient.connect();
            const targetDb = targetClient.db(target.database);

            for (const col of collectionNames) {
                try {
                    const docs = await sourceDb.collection(col).find({}).toArray();
                    if (dropBeforeInsert) {
                        await targetDb.collection(col).deleteMany({});
                    }
                    if (docs.length > 0) {
                        await targetDb.collection(col).insertMany(docs, { ordered: false });
                    }
                    targetLog.details.push({ collection: col, count: docs.length });
                } catch (err) {
                    targetLog.ok = false;
                    targetLog.details.push({ collection: col, error: err.message });
                }
            }
        } catch (err) {
            targetLog.ok = false;
            targetLog.error = err.message;
        } finally {
            await targetClient.close().catch(() => {});
            report.push(targetLog);
        }
    }

    await sourceClient.close();
    return { success: true, source: sourceServer.id, report };
};

let syncScheduleTimer = null;
let syncScheduleTimeout = null;
let syncScheduleConfig = {
    enabled: false,
    intervalMinutes: 60,
    startAt: null,
    sourceId: null,
    targetIds: [],
    dropBeforeInsert: true,
};

// Load schedule from disk on startup
const loadSyncSchedule = () => {
    try {
        if (fs.existsSync(SYNC_CONFIG_PATH)) {
            const data = fs.readFileSync(SYNC_CONFIG_PATH, 'utf8');
            syncScheduleConfig = JSON.parse(data);
            console.log('📅 [SYNC SCHEDULE] Loaded from disk:', syncScheduleConfig);
        }
    } catch (err) {
        console.error('❌ [SYNC SCHEDULE] Failed to load:', err.message);
    }
};

// Save schedule to disk
const saveSyncSchedule = () => {
    try {
        fs.writeFileSync(SYNC_CONFIG_PATH, JSON.stringify(syncScheduleConfig, null, 2), 'utf8');
        console.log('💾 [SYNC SCHEDULE] Saved to disk');
    } catch (err) {
        console.error('❌ [SYNC SCHEDULE] Failed to save:', err.message);
    }
};

const stopSyncSchedule = () => {
    if (syncScheduleTimer) {
        clearInterval(syncScheduleTimer);
        syncScheduleTimer = null;
    }
    if (syncScheduleTimeout) {
        clearTimeout(syncScheduleTimeout);
        syncScheduleTimeout = null;
    }
};

const startSyncSchedule = () => {
    stopSyncSchedule();
    if (!syncScheduleConfig.enabled) return;
    if (!syncScheduleConfig.targetIds || !syncScheduleConfig.targetIds.length) return;

    const runSync = async () => {
        try {
            await performSync({
                sourceId: syncScheduleConfig.sourceId,
                targetIds: syncScheduleConfig.targetIds,
                dropBeforeInsert: syncScheduleConfig.dropBeforeInsert,
            });
            console.log('✅ Sync programada ejecutada');
        } catch (err) {
            console.error('❌ Error en sync programada:', err.message);
        }
    };

    const intervalMs = Math.max(5, syncScheduleConfig.intervalMinutes || 60) * 60 * 1000;
    const startAt = syncScheduleConfig.startAt ? new Date(syncScheduleConfig.startAt) : null;

    if (startAt && startAt.getTime() > Date.now()) {
        syncScheduleTimeout = setTimeout(() => {
            runSync();
            syncScheduleTimer = setInterval(runSync, intervalMs);
        }, startAt.getTime() - Date.now());
    } else {
        runSync();
        syncScheduleTimer = setInterval(runSync, intervalMs);
    }
};

// Initialize on module load
loadSyncSchedule();
if (syncScheduleConfig.enabled) {
    startSyncSchedule();
}

router.get('/sync/schedule', (req, res) => {
    res.json({ success: true, ...syncScheduleConfig });
});

/**
 * POST /api/database/sync
 * Copia colecciones desde la base primaria (o sourceId) hacia una o más secundarias
 */
router.post('/sync', async (req, res) => {
    const { sourceId, targetIds, collections, dropBeforeInsert = true } = req.body || {};

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
        return res.status(400).json({ success: false, error: 'targetIds es requerido' });
    }

    try {
        const result = await performSync({ sourceId, targetIds, collections, dropBeforeInsert });
        res.json(result);
    } catch (error) {
        console.error('Error syncing databases:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Programar sincronización recurrente
router.post('/sync/schedule', (req, res) => {
    const { enabled, intervalMinutes, startAt, sourceId, targetIds, dropBeforeInsert = true } = req.body || {};

    if (enabled && (!Array.isArray(targetIds) || !targetIds.length)) {
        return res.status(400).json({ success: false, error: 'Selecciona al menos un servidor destino' });
    }

    syncScheduleConfig = {
        enabled: Boolean(enabled),
        intervalMinutes: Number(intervalMinutes) || 60,
        startAt: startAt || null,
        sourceId: sourceId || null,
        targetIds: targetIds || [],
        dropBeforeInsert: dropBeforeInsert !== false,
    };

    saveSyncSchedule();
    startSyncSchedule();

    res.json({ success: true, message: syncScheduleConfig.enabled ? 'Programación activada' : 'Programación desactivada', config: syncScheduleConfig });
});

module.exports = router;
