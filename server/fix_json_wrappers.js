const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const beforeJson = "app.use(express.json({ limit: '25mb' });";
const afterJson = "app.use(express.json({ limit: '25mb' }));";
if (!text.includes(beforeJson)) {
  throw new Error('json snippet not found');
}
text = text.replace(beforeJson, afterJson);
const beforeUrl = "app.use(express.urlencoded({ extended: true, limit: '25mb' });";
const afterUrl = "app.use(express.urlencoded({ extended: true, limit: '25mb' }));";
if (!text.includes(beforeUrl)) {
  throw new Error('urlencoded snippet not found');
}
text = text.replace(beforeUrl, afterUrl);
fs.writeFileSync(path, text);
