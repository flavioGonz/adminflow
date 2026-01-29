const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');
const marker = "    } catch (err) {\n        res.status(500).json({ message: err.message });\n    }));\n\napp.delete('/api/tickets/:id', async (req, res) => {\n";
let start = text.indexOf(marker);
if (start === -1) {
  const markerCRLF = marker.replace(/\n/g, '\r\n');
  start = text.indexOf(markerCRLF);
  if (start === -1) {
    throw new Error('marker not found');
  }
  text = text.replace(markerCRLF, markerCRLF.replace('}));', '});'));
} else {
  text = text.replace(marker, marker.replace('}));', '});'));
}
fs.writeFileSync(path, text);
