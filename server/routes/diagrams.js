const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../lib/mongoClient');
const { logEvent } = require('../lib/auditService');
const { getMongoFilter, buildClientReferenceFilter } = require('../lib/clientFilters');

const buildDiagramFilter = async (db, clientId) => {
  const clientDoc = await db.collection('clients').findOne(getMongoFilter(clientId));
  return buildClientReferenceFilter(clientId, clientDoc);
};

// GET /api/clients/:id/diagram - Get diagram for a client
router.get('/clients/:id/diagram', async (req, res) => {
  try {
    const db = getMongoDb();
    if (!db) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const filter = await buildDiagramFilter(db, req.params.id);
    const diagram = await db.collection('client_diagrams').findOne(filter);

    if (!diagram) {
      return res.json(null);
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
      updatedAt: new Date(),
    };

    const filter = await buildDiagramFilter(db, clientId);
    const result = await db.collection('client_diagrams').updateOne(
      filter,
      {
        $set: update,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    await logEvent('diagram', 'update', 'client_diagrams', {
      clientId,
      action: result.upsertedCount ? 'created' : 'updated',
    }, req);

    res.json({ message: 'Diagram saved successfully' });
  } catch (error) {
    console.error('Error saving diagram:', error);
    res.status(500).json({ message: 'Error saving diagram' });
  }
});

module.exports = router;
