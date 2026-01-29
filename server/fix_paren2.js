const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
if (!text.includes('}));')) {
    throw new Error('no pattern');
}
text = text.replace('}));', '});');
fs.writeFileSync(path, text);
