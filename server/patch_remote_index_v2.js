const fs = require('fs');
const indexPath = '/opt/adminflow/server/index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// More flexible matching
const postSearch = "app.post('/api/tickets'";
const putSearch = "app.put('/api/tickets/:id'";

function updateBlock(searchStr, newBlock) {
    const start = content.indexOf(searchStr);
    if (start === -1) return false;
    
    let end = -1;
    let braceCount = 0;
    let foundOpen = false;
    
    for (let i = start; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            foundOpen = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        
        if (foundOpen && braceCount === 0) {
            end = i;
            break;
        }
    }
    
    if (end !== -1) {
        content = content.substring(0, start) + newBlock + content.substring(end + 1);
        return true;
    }
    return false;
}

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
})`;

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
})`;

if (updateBlock(postSearch, postNew)) {
    console.log('POST /api/tickets updated');
} else {
    console.log('POST /api/tickets not found');
}

if (updateBlock(putSearch, putNew)) {
    console.log('PUT /api/tickets/:id updated');
} else {
    console.log('PUT /api/tickets/:id not found');
}

fs.writeFileSync(indexPath, content);
console.log('File index.js patched');
