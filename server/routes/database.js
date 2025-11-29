const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../lib/mongoClient');
const fs = require('fs');
const path = require('path');

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

module.exports = router;
