const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../lib/mongoClient');
const { logEvent } = require('../lib/auditService');

// GET /api/clients/:id/implementation - Get implementation data (patch panel) for a client
router.get('/clients/:id/implementation', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) {
            return res.status(503).json({ message: 'Database not available' });
        }

        const implementation = await db.collection('client_implementations')
            .findOne({ clientId: req.params.id });

        if (!implementation) {
            return res.json(null); // No implementation data yet
        }

        res.json(implementation);
    } catch (error) {
        console.error('Error getting implementation data:', error);
        res.status(500).json({ message: 'Error fetching implementation data' });
    }
});

// GET /api/clients/implementation-indicators - List clients with saved implementation
router.get('/clients/implementation-indicators', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) {
            return res.status(503).json({ message: 'Database not available' });
        }

        const implementations = await db
            .collection('client_implementations')
            .find({}, { projection: { clientId: 1 } })
            .toArray();

        const clientIds = implementations
            .map((item) => item?.clientId)
            .filter((id) => id !== undefined && id !== null);

        res.json(clientIds);
    } catch (error) {
        console.error('Error fetching implementation indicators:', error);
        res.status(500).json({ message: 'Error fetching implementation indicators' });
    }
});

// POST /api/clients/:id/implementation - Save implementation data
router.post('/clients/:id/implementation', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Database not available' });

        const { appData, currentPanelName, currentFilter } = req.body;
        const clientId = req.params.id;

        const update = {
            clientId,
            appData,
            currentPanelName,
            currentFilter,
            updatedAt: new Date()
        };

        const result = await db.collection('client_implementations').updateOne(
            { clientId },
            {
                $set: update,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        // Audit log
        await logEvent('implementation', 'update', 'client_implementations', {
            clientId,
            action: result.upsertedCount ? 'created' : 'updated'
        }, req);

        res.json({ message: 'Implementation data saved successfully' });
    } catch (error) {
        console.error('Error saving implementation data:', error);
        res.status(500).json({ message: 'Error saving implementation data' });
    }
});

module.exports = router;
