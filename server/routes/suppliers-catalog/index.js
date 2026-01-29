const express = require('express');
const router = express.Router();
const { getMongoDb, getNextId } = require('../../lib/mongoClient');
const { getMongoFilter } = require('../../lib/clientFilters');

router.get('/', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const rows = await db.collection('suppliers_catalog').find().toArray();
        res.json(rows.map(r => ({ ...r, id: r.id || String(r._id) })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const id = await getNextId('suppliers_catalog');
        const newDoc = {
            ...req.body,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await db.collection('suppliers_catalog').insertOne(newDoc);
        res.status(201).json({ ...newDoc, id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const filter = getMongoFilter(req.params.id);
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        delete updates._id;
        delete updates.id;
        const result = await db.collection('suppliers_catalog').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        res.json({ ...result, id: result.id || String(result._id) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const filter = getMongoFilter(req.params.id);
        await db.collection('suppliers_catalog').deleteOne(filter);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
