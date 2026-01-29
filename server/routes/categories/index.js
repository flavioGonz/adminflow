const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../../lib/mongoClient');

router.get('/', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const rows = await db.collection('categories').find().toArray();
        res.json(rows.map(r => ({ ...r, id: r.id || String(r._id) })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
