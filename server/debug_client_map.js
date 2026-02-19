const { MongoClient, ObjectId } = require('mongodb');

const getId = (doc) => {
    if (!doc) return null;
    return doc.id !== undefined ? String(doc.id) : String(doc._id || '');
};

const buildClientMap = async (mongoDb, clientIds = []) => {
    if (!clientIds.length) return {};
    const numericIds = [];
    const stringIds = [];
    const objectIds = [];
    clientIds.forEach((value) => {
        if (value === undefined || value === null) return;
        const normalized = String(value);
        if (ObjectId.isValid(normalized) && normalized.length === 24) {
            objectIds.push(new ObjectId(normalized));
        }
        const parsed = Number(normalized);
        if (!Number.isNaN(parsed)) {
            numericIds.push(parsed);
        }
        stringIds.push(normalized);
    });
    const orClauses = [];
    if (objectIds.length) orClauses.push({ _id: { $in: objectIds } });
    if (numericIds.length) orClauses.push({ id: { $in: numericIds } });
    if (stringIds.length) orClauses.push({ id: { $in: stringIds } });
    
    if (!orClauses.length) return {};
    const clients = await mongoDb.collection('clients').find({ $or: orClauses }).toArray();
    const map = {};
    clients.forEach((client) => {
        const data = {
            name: client.name || client.clientName || "",
            avatarUrl: client.avatarUrl || client.avatar || null
        };
        const key = client.id !== undefined ? String(client.id) : null;
        if (key) map[key] = data;
        const idFromDoc = getId(client);
        if (idFromDoc) map[idFromDoc] = data;
        map[String(client._id)] = data;
    });
    return map;
};

(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const map = await buildClientMap(db, ["108", "45", "109"]);
    console.log('Client Map Keys:', Object.keys(map));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
