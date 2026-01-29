const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getMongoDb } = require('../lib/mongoClient');
const { logEvent } = require('../lib/auditService');
const { getMongoFilter, buildClientReferenceFilter } = require('../lib/clientFilters');

const buildRepositoryFilter = async (db, clientId) => {
  const clientDoc = await db.collection('clients').findOne(getMongoFilter(clientId));
  return buildClientReferenceFilter(clientId, clientDoc);
};

// GET /api/clients/:id/repository - Obtener entradas del repositorio para un cliente
router.get('/clients/:id/repository', async (req, res) => {
  try {
    const db = getMongoDb();
    if (!db) return res.json([]);

    const filter = await buildRepositoryFilter(db, req.params.id);
    const entries = await db.collection('repository')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(entries.map(e => ({
      ...e,
      id: e.id || String(e._id),
      content: e.content || '',
      notes: e.notes || '',
      credential: e.credential || '',
      name: e.name || 'Sin título',
      type: e.type || 'Archivo',
      category: e.category || 'Otro',
      format: e.format || '',
      fileName: e.file_name || e.fileName || ''
    })));
  } catch (error) {
    console.error('Error getting repository entries:', error);
    res.status(500).json({ message: 'Error al obtener entradas del repositorio' });
  }
});

// POST /api/clients/:id/repository - Crear entrada en el repositorio
router.post('/clients/:id/repository', async (req, res) => {
  try {
    const db = getMongoDb();
    if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

    const payload = req.body;
    const newEntry = {
      ...payload,
      client_id: req.params.id,
      clientId: req.params.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('repository').insertOne(newEntry);
    res.status(201).json({ ...newEntry, id: String(result.insertedId), _id: result.insertedId });
  } catch (error) {
    console.error('Error creating repository entry:', error);
    res.status(500).json({ message: 'Error al crear entrada en el repositorio' });
  }
});

// PUT /api/repository/:id - Actualizar entrada
router.put('/repository/:id', async (req, res) => {
  try {
    const db = getMongoDb();
    if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

    const entryId = req.params.id;
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    delete updates._id;
    delete updates.id;

    const filter = ObjectId.isValid(entryId) ? { _id: new ObjectId(entryId) } : { id: entryId };
    const result = await db.collection('repository').findOneAndUpdate(
      filter,
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ message: 'Entrada no encontrada' });
    res.json({ ...result, id: String(result._id) });
  } catch (error) {
    console.error('Error updating repository entry:', error);
    res.status(500).json({ message: 'Error al actualizar entrada' });
  }
});

// DELETE /api/repository/:id - Eliminar entrada
router.delete('/repository/:id', async (req, res) => {
  try {
    const db = getMongoDb();
    if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

    const entryId = req.params.id;
    const filter = ObjectId.isValid(entryId) ? { _id: new ObjectId(entryId) } : { id: entryId };
    const result = await db.collection('repository').deleteOne(filter);

    if (result.deletedCount === 0) return res.status(404).json({ message: 'Entrada no encontrada' });
    res.json({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting repository entry:', error);
    res.status(500).json({ message: 'Error al eliminar entrada' });
  }
});

module.exports = router;
