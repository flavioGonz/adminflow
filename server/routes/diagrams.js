const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../lib/mongoClient');
const { logEvent } = require('../lib/auditService');

// GET /api/clients/:id/diagram - Get diagram for a client
router.get('/clients/:id/diagram', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) {
            return res.status(503).json({ message: 'Database not available' });
        }

        const diagram = await db.collection('client_diagrams')
            .findOne({ clientId: req.params.id });

        if (!diagram) {
            return res.json(null); // No diagram yet
        }

        res.json(diagram);
    } catch (error) {
        console.error('Error getting diagram:', error);
        res.status(500).json({ message: 'Error fetching diagram' });
    }
});

// POST /api/clients/:id/diagram - Save diagram
router.post('/clients/:id/diagram', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Database not available' });

        const { elements, appState, files } = req.body;
        const clientId = req.params.id;

        const update = {
            clientId,
            elements,
            appState,
            files,
            updatedAt: new Date()
        };

        const result = await db.collection('client_diagrams').updateOne(
            { clientId },
            {
                $set: update,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        // Audit log
        await logEvent('diagram', 'update', 'client_diagrams', {
            clientId,
            action: result.upsertedCount ? 'created' : 'updated'
        }, req);

        res.json({ message: 'Diagram saved successfully' });
    } catch (error) {
        console.error('Error saving diagram:', error);
        res.status(500).json({ message: 'Error saving diagram' });
    }
});

module.exports = router;
