const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('c:/Users/Flavio/Documents/EXPRESS/adminflow/server/database/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Searching for non-integer IDs in tickets...');

db.all("SELECT id, typeof(id) as type FROM tickets", (err, rows) => {
    if (err) console.error(err);
    const unusual = rows.filter(r => r.type !== 'integer');
    console.log('Unusual IDs count:', unusual.length);
    if (unusual.length > 0) {
        console.log('Sample unusual IDs:', JSON.stringify(unusual.slice(0, 5), null, 2));
    }
    db.close();
});
