const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('c:/Users/Flavio/Documents/EXPRESS/adminflow/server/database/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking client IDs in SQLite...');

db.all("SELECT id, name FROM clients WHERE name LIKE '%Sildan%' OR name LIKE '%Mecsegur%'", (err, rows) => {
    if (err) console.error(err);
    console.log('Results:', JSON.stringify(rows, null, 2));
    db.close();
});
