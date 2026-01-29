const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

const oldBuildClientMap = `const buildClientMap = async (mongoDb, clientIds = []) => {
    if (!clientIds.length) return {};
    const numericIds = [];
    const stringIds = [];
    clientIds.forEach((value) => {
        if (value === undefined || value === null) return;
        const normalized = String(value);
        const parsed = Number(normalized);
        if (!Number.isNaN(parsed)) {
            numericIds.push(parsed);
        }
        stringIds.push(normalized);
    });
    const orClauses = [];
    if (numericIds.length) {
        orClauses.push({ id: { $in: numericIds } });
    }
    if (stringIds.length) {
        orClauses.push({ id: { $in: stringIds } });
    }
    if (!orClauses.length) return {};
    const clients = await mongoDb.collection('clients').find({ $or: orClauses }).toArray();
    const map = {};
    clients.forEach((client) => {
        const key = client.id !== undefined ? String(client.id) : null;
        if (key) {
            map[key] = client.name || client.clientName || "";
        }
        const idFromDoc = getId(client);
        if (idFromDoc) {
            map[idFromDoc] = client.name || client.clientName || "";
        }
    });
    return map;
};`;

const newBuildClientMap = `const buildClientMap = async (mongoDb, clientIds = []) => {
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
};`;

if (text.includes(oldBuildClientMap)) {
    text = text.replace(oldBuildClientMap, newBuildClientMap);
    console.log('Updated buildClientMap');
} else {
    const oldRN = oldBuildClientMap.replace(/\n/g, '\r\n');
    const newRN = newBuildClientMap.replace(/\n/g, '\r\n');
    if (text.includes(oldRN)) {
        text = text.replace(oldRN, newRN);
        console.log('Updated buildClientMap (CRLF)');
    } else {
        console.log('buildClientMap not found');
    }
}

fs.writeFileSync(path, text);
