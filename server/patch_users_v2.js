const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

const importMarker = "const supplierCatalogRoutes = require('./routes/suppliers-catalog');";
const importNew = "const usersV2Routes = require('./routes/users-v2');";

if (text.includes(importMarker) && !text.includes(importNew)) {
    text = text.replace(importMarker, `${importMarker}\n${importNew}`);
    console.log('Added usersV2Routes import');
} else {
    // Try with CRLF
    const importMarkerRN = importMarker.replace(/\n/g, '\r\n');
    if (text.includes(importMarkerRN) && !text.includes(importNew)) {
        text = text.replace(importMarkerRN, `${importMarkerRN}\r\n${importNew}`);
        console.log('Added usersV2Routes import (CRLF)');
    } else {
        console.log('Import marker not found or already added');
    }
}

const mountMarker = "app.use('/api/suppliers-catalog', supplierCatalogRoutes);";
const mountNew = "app.use('/api/v2/users', usersV2Routes);";

if (text.includes(mountMarker) && !text.includes(mountNew)) {
    text = text.replace(mountMarker, `${mountMarker}\n${mountNew}`);
    console.log('Mounted usersV2Routes');
} else {
    // Try with CRLF
    const mountMarkerRN = mountMarker.replace(/\n/g, '\r\n');
    if (text.includes(mountMarkerRN) && !text.includes(mountNew)) {
        text = text.replace(mountMarkerRN, `${mountMarkerRN}\r\n${mountNew}`);
        console.log('Mounted usersV2Routes (CRLF)');
    } else {
        console.log('Mount marker not found or already added');
    }
}

fs.writeFileSync(path, text);
console.log('Done patching index.js');
