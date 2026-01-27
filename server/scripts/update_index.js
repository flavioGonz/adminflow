const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const marker = "const { syncLocalToMongo } = require('./lib/mongo-sync');";
const insert = `${marker}\nconst { parseSqliteIdentifier, getMongoFilter, getMongoClientFilter, buildClientReferenceFilter } = require('./lib/clientFilters');`;
if (!text.includes(marker)) {
  console.error('marker not found');
  process.exit(1);
}
text = text.replace(marker, insert);
const parseRegex = /const parseSqliteIdentifier = \(value\) => \{[\s\S]*?return Number\.isNaN\(numeric\) \? null : numeric;\s+\};\s+/;
text = text.replace(parseRegex, '');
const mongoFilterRegex = /const getMongoFilter = \(id\) => \{[\s\S]*?return filters\.length > 1 \? \{ \$or: filters \} : filters\[0\];\s+\};\s+/;
text = text.replace(mongoFilterRegex, '');
const mongoClientFilterRegex = /const getMongoClientFilter = \(clientId\) => \{[\s\S]*?return \{ \$or: filters \};\s+\};\s+/;
text = text.replace(mongoClientFilterRegex, '');
fs.writeFileSync(path, text);
console.log('index.js patched');
