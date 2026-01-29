const express = require('express');
const router = express.Router();
const { getMongoDb, getNextId } = require('../../lib/mongoClient');
const { getMongoFilter, getMongoClientFilter } = require('../../lib/clientFilters');

const collectClientIds = (rows) => {
    const ids = new Set();
    rows.forEach((row) => {
        const clientValue = row.client_id ?? row.clientId;
        if (clientValue !== undefined && clientValue !== null) {
            ids.add(String(clientValue));
        }
    });
    return Array.from(ids);
};

const buildClientMap = async (db, clientIds = []) => {
    if (!clientIds.length) return {};
    const numericIds = [];
    const stringIds = [];
    clientIds.forEach((value) => {
        if (value === undefined || value === null) return;
        const normalized = String(value);
        const parsed = Number(normalized);
        if (!Number.isNaN(parsed)) numericIds.push(parsed);
        stringIds.push(normalized);
    });
    const orClauses = [];
    if (numericIds.length) orClauses.push({ id: { $in: numericIds } });
    if (stringIds.length) orClauses.push({ id: { $in: stringIds } });
    if (!orClauses.length) return {};
    const clients = await db.collection('clients').find({ $or: orClauses }).toArray();
    const map = {};
    clients.forEach((client) => {
        const key = client.id !== undefined ? String(client.id) : null;
        if (key) {
            map[key] = client.name || client.clientName || '';
        }
        const altId = client._id ? String(client._id) : null;
        if (altId) map[altId] = client.name || client.clientName || '';
    });
    return map;
};

const mapBudgetRow = (row, clientMap = {}) => {
    const clientValue = row.client_id ?? row.clientId;
    const clientKey = clientValue !== undefined && clientValue !== null ? String(clientValue) : undefined;
    return {
        ...row,
        id: row.id ?? String(row._id),
        clientId: clientKey,
        clientName: clientMap[clientKey] ?? row.clientName ?? '',
    };
};

router.get('/', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const rows = await db.collection('budgets').find().sort({ createdAt: -1 }).toArray();
        const clientIds = collectClientIds(rows);
        const clientMap = await buildClientMap(db, clientIds);
        res.json(rows.map((r) => mapBudgetRow(r, clientMap)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const id = await getNextId('budgets');
        const newDoc = {
            ...req.body,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await db.collection('budgets').insertOne(newDoc);
        const clientMap = await buildClientMap(db, [newDoc.clientId ?? newDoc.client_id]);
        res.status(201).json(mapBudgetRow(newDoc, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'DB not connected' });
        const row = await db.collection('budgets').findOne(getMongoFilter(req.params.id));
        if (!row) return res.status(404).json({ message: 'Budget not found' });
        const clientMap = await buildClientMap(db, [row.clientId ?? row.client_id]);
        res.json(mapBudgetRow(row, clientMap));
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
        const result = await db.collection('budgets').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: 'Budget not found' });
        const clientMap = await buildClientMap(db, [result.clientId ?? result.client_id]);
        res.json(mapBudgetRow(result, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
