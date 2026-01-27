const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const regex = /\s*const filter = getMongoClientFilter\(clientId\);\s*const items = await mongoDb\.collection\('repository'\)\s*\.find\(filter\)\s*\.toArray\(\);/s;
if (!regex.test(text)) {
  console.error('pattern not found');
  process.exit(1);
}
const replacement = `            const clientDoc = await mongoDb.collection('clients').findOne(getMongoFilter(clientId));\r\n            const repositoryFilter = buildClientReferenceFilter(clientId, clientDoc);\r\n            const items = await mongoDb.collection('repository')\r\n                .find(repositoryFilter)\r\n                .toArray();`;
text = text.replace(regex, replacement);
fs.writeFileSync(path, text);
