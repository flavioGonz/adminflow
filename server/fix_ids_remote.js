const fs = require('fs');
const indexPath = '/opt/adminflow/server/index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// The problematic block in GET /api/clients
const oldBlock = `        clients = rows.map(c => ({
            ...c,
            id: c.id || c._id.toString(),
            notifications_enabled: c.notifications_enabled ?? c.notificationsEnabled ?? 0
        }));`;

const newBlock = `        clients = rows.map(c => ({
            ...c,
            id: c.id !== undefined && c.id !== null ? String(c.id) : String(c._id || ''),
            notifications_enabled: c.notifications_enabled ?? c.notificationsEnabled ?? 0
        }));`;

if (content.indexOf(oldBlock) !== -1) {
    content = content.replace(oldBlock, newBlock);
    console.log('Fixed client ID mapping in GET /api/clients');
} else {
    // Try with \r\n
    const oldBlockRN = oldBlock.replace(/\n/g, '\r\n');
    const newBlockRN = newBlock.replace(/\n/g, '\r\n');
    if (content.indexOf(oldBlockRN) !== -1) {
        content = content.replace(oldBlockRN, newBlockRN);
        console.log('Fixed client ID mapping (CRLF)');
    } else {
        console.log('Client mapping block not found exactly');
    }
}

// Ensure ensureMongoDb is using getMongoDb correctly
// (Actually it looked fine in previous cat, but let's be sure it's not returning null wrongly)

fs.writeFileSync(indexPath, content);
console.log('Done');
