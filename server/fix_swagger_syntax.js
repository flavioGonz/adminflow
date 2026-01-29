const fs = require('fs');
const path = '/opt/adminflow/server/swagger.json';
let text = fs.readFileSync(path, 'utf8');

// Look for the missing comma
const oldPattern = '      }\n    }\n    "/contracts": {';
const newPattern = '      }\n    },\n    "/contracts": {';

if (text.includes(oldPattern)) {
    text = text.replace(oldPattern, newPattern);
    console.log('Fixed missing comma in Swagger');
} else {
    // Try with CRLF
    const oldPatternRN = oldPattern.replace(/\n/g, '\r\n');
    const newPatternRN = newPattern.replace(/\n/g, '\r\n');
    if (text.includes(oldPatternRN)) {
        text = text.replace(oldPatternRN, newPatternRN);
        console.log('Fixed missing comma in Swagger (CRLF)');
    } else {
        console.log('Pattern not found exactly, trying more generic search');
        text = text.replace(/}\s*"\s*\/contracts\s*"\s*:/, '},\n    "/contracts":');
    }
}

fs.writeFileSync(path, text);
