const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const pattern = "const { parseSqliteIdentifier, getMongoFilter, getMongoClientFilter, buildClientReferenceFilter } = require('./lib/clientFilters');\nconst { parseSqliteIdentifier, getMongoFilter, getMongoClientFilter, buildClientReferenceFilter } = require('./lib/clientFilters');";
if (text.includes(pattern)) {
  text = text.replace(pattern, "const { parseSqliteIdentifier, getMongoFilter, getMongoClientFilter, buildClientReferenceFilter } = require('./lib/clientFilters');");
  fs.writeFileSync(path, text);
}
