const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('c:/Users/Flavio/Documents/EXPRESS/adminflow/server/database/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Querying tickets for specific clients...');

db.all("SELECT id, client_id, title FROM tickets WHERE client_id IN (25, '25', '696e9dd5a7aeb0061587dbf8') ORDER BY id DESC", (err, rows) => {
    if (err) console.error(err);
    console.log('Results:', JSON.stringify(rows, null, 2));
    db.close();
});
