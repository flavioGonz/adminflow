const fs = require('fs');
const path = '/opt/adminflow/server/swagger.json';
let text = fs.readFileSync(path, 'utf8');

const oldPattern = '    },\r\n  },\r\n  "components": {';
const newPattern = '    }\r\n  },\r\n  "components": {';

if (text.includes(oldPattern)) {
    text = text.replace(oldPattern, newPattern);
    console.log('Fixed trailing comma in Swagger');
} else {
    // Try without \r
    const oldPatternLF = oldPattern.replace(/\r/g, '');
    const newPatternLF = newPattern.replace(/\r/g, '');
    if (text.includes(oldPatternLF)) {
        text = text.replace(oldPatternLF, newPatternLF);
        console.log('Fixed trailing comma in Swagger (LF)');
    } else {
        console.log('Pattern not found exactly');
    }
}

fs.writeFileSync(path, text);
