const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

// Helper to update route handlers to use clientMap
function updateRoute(oldText, newText) {
    if (text.includes(oldText)) {
        text = text.replace(oldText, newText);
        return true;
    }
    const oldRN = oldText.replace(/\n/g, '\r\n');
    const newRN = newText.replace(/\n/g, '\r\n');
    if (text.includes(oldRN)) {
        text = text.replace(oldRN, newRN);
        return true;
    }
    return false;
}

// 1. Update GET /api/tickets
const getTicketsOld = `app.get('/api/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const rows = await mongoDb.collection('tickets').find().sort({ createdAt: -1 }).toArray();
        res.json(rows.map(mapTicketRow));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

const getTicketsNew = `app.get('/api/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const rows = await mongoDb.collection('tickets').find().sort({ createdAt: -1 }).toArray();
        const clientIds = extractClientIds(rows);
        const clientMap = await buildClientMap(mongoDb, clientIds);
        res.json(rows.map((row) => mapTicketRow(row, clientMap)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

if (updateRoute(getTicketsOld, getTicketsNew)) console.log('Updated GET /api/tickets');

// 2. Update GET /api/tickets/:id
const getTicketIdOld = `app.get('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const row = await mongoDb.collection('tickets').findOne(getMongoFilter(req.params.id));
        if (!row) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(row));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

const getTicketIdNew = `app.get('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const row = await mongoDb.collection('tickets').findOne(getMongoFilter(req.params.id));
        if (!row) return res.status(404).json({ message: 'Ticket not found' });
        const clientMap = await buildClientMap(mongoDb, [row.clientId || row.client_id]);
        res.json(mapTicketRow(row, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

if (updateRoute(getTicketIdOld, getTicketIdNew)) console.log('Updated GET /api/tickets/:id');

// 3. Update POST /api/tickets (using updated placeholder to match the one I just wrote)
const postTicketOld = `        await mongoDb.collection('tickets').insertOne(newTicket);
        res.status(201).json(mapTicketRow(newTicket));`;

const postTicketNew = `        await mongoDb.collection('tickets').insertOne(newTicket);
        const clientMap = await buildClientMap(mongoDb, [newTicket.clientId]);
        res.status(201).json(mapTicketRow(newTicket, clientMap));`;

if (updateRoute(postTicketOld, postTicketNew)) console.log('Updated POST /api/tickets');

// 4. Update PUT /api/tickets/:id
const putTicketOld = `        const updatedDoc = result.value || result;
        if (!updatedDoc) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(updatedDoc));`;

const putTicketNew = `        const updatedDoc = result.value || result;
        if (!updatedDoc) return res.status(404).json({ message: 'Ticket not found' });
        const clientMap = await buildClientMap(mongoDb, [updatedDoc.clientId || updatedDoc.client_id]);
        res.json(mapTicketRow(updatedDoc, clientMap));`;

if (updateRoute(putTicketOld, putTicketNew)) console.log('Updated PUT /api/tickets/:id');

// 5. Update GET /api/clients/:id/tickets
const getClientTicketsOld = `app.get('/api/clients/:id/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoClientFilter } = require('./lib/clientFilters');
        const filter = getMongoClientFilter(req.params.id);
        const rows = await mongoDb.collection('tickets').find(filter).sort({ createdAt: -1 }).toArray();
        res.json(rows.map(mapTicketRow));
    } catch (err) {`;

const getClientTicketsNew = `app.get('/api/clients/:id/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoClientFilter } = require('./lib/clientFilters');
        const filter = getMongoClientFilter(req.params.id);
        const rows = await mongoDb.collection('tickets').find(filter).sort({ createdAt: -1 }).toArray();
        const clientMap = await buildClientMap(mongoDb, [req.params.id]);
        res.json(rows.map((row) => mapTicketRow(row, clientMap)));
    } catch (err) {`;

if (updateRoute(getClientTicketsOld, getClientTicketsNew)) console.log('Updated GET /api/clients/:id/tickets');

fs.writeFileSync(path, text);
