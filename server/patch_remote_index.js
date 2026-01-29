const fs = require('fs');
const indexPath = '/opt/adminflow/server/index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Update POST /api/tickets
const postOld = `app.post('/api/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('tickets');
        const newTicket = {
            ...req.body,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await mongoDb.collection('tickets').insertOne(newTicket);
        res.status(201).json(mapTicketRow(newTicket));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

const postNew = `app.post('/api/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('tickets');
        
        // Fetch client name if clientId is present
        let clientName = req.body.clientName;
        if (!clientName && req.body.clientId) {
            const { getMongoFilter } = require('./lib/clientFilters');
            const client = await mongoDb.collection('clients').findOne(getMongoFilter(req.body.clientId));
            if (client) {
                clientName = client.name;
            }
        }

        const newTicket = {
            ...req.body,
            id,
            clientName: clientName || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await mongoDb.collection('tickets').insertOne(newTicket);
        res.status(201).json(mapTicketRow(newTicket));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

if (content.includes(postOld)) {
    content = content.replace(postOld, postNew);
    console.log('POST /api/tickets updated');
} else {
    console.log('POST /api/tickets not found or already updated');
}

// 2. Update PUT /api/tickets/:id
const putOld = `app.put('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const filter = getMongoFilter(req.params.id);
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        delete updates._id;
        delete updates.id;
        const result = await mongoDb.collection('tickets').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(result));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

const putNew = `app.put('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const filter = getMongoFilter(req.params.id);
        
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        delete updates._id;
        delete updates.id;

        // Update client name if clientId is present and clientName is not
        if (!updates.clientName && updates.clientId) {
            const client = await mongoDb.collection('clients').findOne(getMongoFilter(updates.clientId));
            if (client) {
                updates.clientName = client.name;
            }
        }

        const result = await mongoDb.collection('tickets').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(result));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});`;

if (content.includes(putOld)) {
    content = content.replace(putOld, putNew);
    console.log('PUT /api/tickets/:id updated');
} else {
    console.log('PUT /api/tickets/:id not found or already updated');
}

fs.writeFileSync(indexPath, content);
console.log('File index.js patched successfully');
