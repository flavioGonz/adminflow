const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

// 1. Update POST /api/contracts
const postSearch = "app.post('/api/contracts', async (req, res) => {";
const postNew = `app.post('/api/contracts', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('contracts');
        
        const contractData = { ...req.body };
        // Unify client ID field
        const clientId = contractData.clientId || contractData.client_id;
        delete contractData.client_id;
        contractData.clientId = clientId;

        const newContract = {
            ...contractData,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await mongoDb.collection('contracts').insertOne(newContract);
        const clientMap = await buildClientMap(mongoDb, [clientId]);
        res.status(201).json(mapContractRow(newContract, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})`;

// 2. Update PUT /api/contracts/:id
const putSearch = "app.put('/api/contracts/:id', async (req, res) => {";
const putNew = `app.put('/api/contracts/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    const filter = buildIdFilter(req.params.id);
    if (!filter) {
        return res.status(400).json({ message: 'ID de contrato inválido.' });
    }
    try {
        const updates = {
            ...req.body,
            updatedAt: new Date().toISOString(),
        };
        
        // Unify client ID field and explicitly unset the old one
        const clientId = updates.clientId || updates.client_id;
        delete updates.client_id;
        updates.clientId = clientId;

        const result = await mongoDb.collection('contracts').findOneAndUpdate(
            filter,
            { 
                $set: updates,
                $unset: { client_id: "" } // Remove legacy field
            },
            { returnDocument: 'after' }
        );
        const updatedDoc = result.value || result;
        if (!updatedDoc) {
            return res.status(404).json({ message: 'Contrato no encontrado.' });
        }
        const clientMap = await buildClientMap(mongoDb, [clientId]);
        res.json(mapContractRow(updatedDoc, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})`;

function updateBlock(searchStr, newBlock) {
    const start = text.indexOf(searchStr);
    if (start === -1) return false;
    
    let end = -1;
    let braceCount = 0;
    let foundOpen = false;
    
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') {
            braceCount++;
            foundOpen = true;
        } else if (text[i] === '}') {
            braceCount--;
        }
        
        if (foundOpen && braceCount === 0) {
            end = i;
            break;
        }
    }
    
    if (end !== -1) {
        text = text.substring(0, start) + newBlock + text.substring(end + 1);
        return true;
    }
    return false;
}

if (updateBlock(postSearch, postNew)) {
    console.log('Updated POST /api/contracts');
} else {
    console.log('POST /api/contracts not found');
}

if (updateBlock(putSearch, putNew)) {
    console.log('Updated PUT /api/contracts/:id');
} else {
    console.log('PUT /api/contracts/:id not found');
}

fs.writeFileSync(path, text);
