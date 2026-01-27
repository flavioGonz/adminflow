const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
const text = fs.readFileSync(path, 'utf8');
const needle = `            const filter = getMongoClientFilter(clientId);
            const items = await mongoDb.collection('repository')
                .find(filter)
                .toArray();`;
const replacement = `            const clientDoc = await mongoDb.collection('clients').findOne(getMongoFilter(clientId));
            const repositoryFilter = buildClientReferenceFilter(clientId, clientDoc);
            const items = await mongoDb.collection('repository')
                .find(repositoryFilter)
                .toArray();`;
if (!text.includes(needle)) {
  console.error('needle not found');
  process.exit(1);
}
fs.writeFileSync(path, text.replace(needle, replacement));
