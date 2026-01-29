const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const target = "\r\n\r\napp.delete('/api/tickets/:id'";
const idx = text.indexOf(target);
if (idx === -1) {
  throw new Error('target not found in file');
}
const replaceStart = idx - 4;
if (replaceStart < 0) {
  throw new Error('invalid replace position');
}
const snippet = text.slice(replaceStart, replaceStart + 4);
if (snippet !== '}));') {
  throw new Error('unexpected snippet: ' + snippet);
}
text = text.slice(0, replaceStart) + '});' + text.slice(replaceStart + 4);
fs.writeFileSync(path, text);
