const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const postStart = text.indexOf("app.post('/api/contracts'");
const postEnd = text.indexOf("app.get('/api/contracts/:id'");
if (postStart === -1 || postEnd === -1) {
  throw new Error('post or next start not found');
}
const newPost = `app.post('/api/contracts', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('contracts');
        const contractData = { ...req.body };
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
});

`;
text = text.slice(0, postStart) + newPost + text.slice(postEnd);
const putStart = text.indexOf("app.put('/api/contracts/:id'");
const putEnd = text.indexOf("app.delete('/api/contracts/:id'");
if (putStart === -1 || putEnd === -1) {
  throw new Error('put or next start not found');
}
const newPut = `app.put('/api/contracts/:id', async (req, res) => {
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
        const clientId = updates.clientId || updates.client_id;
        delete updates.client_id;
        updates.clientId = clientId;
        const result = await mongoDb.collection('contracts').findOneAndUpdate(
            filter,
            {
                $set: updates,
                $unset: { client_id: "" }
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
});

`;
text = text.slice(0, putStart) + newPut + text.slice(putEnd);
fs.writeFileSync(path, text);
