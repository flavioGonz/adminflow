const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

const oldFunc = `const parseJsonColumn = (value, fallback = []) => {
    if (!value) return Array.isArray(fallback) ? fallback : fallback ?? null;
    try {
        return JSON.parse(value);
    } catch {
        return Array.isArray(fallback) ? fallback : fallback ?? null;
    }
};`;

const newFunc = `const parseJsonColumn = (value, fallback = []) => {
    if (!value) return Array.isArray(fallback) ? fallback : fallback ?? null;
    if (typeof value === 'object') return value; // MongoDB handles objects/arrays natively
    try {
        return JSON.parse(value);
    } catch {
        return Array.isArray(fallback) ? fallback : fallback ?? null;
    }
};`;

if (text.includes(oldFunc)) {
    text = text.replace(oldFunc, newFunc);
    console.log('Fixed parseJsonColumn');
} else {
    // Try with CRLF
    const oldFuncRN = oldFunc.replace(/\n/g, '\r\n');
    const newFuncRN = newFunc.replace(/\n/g, '\r\n');
    if (text.includes(oldFuncRN)) {
        text = text.replace(oldFuncRN, newFuncRN);
        console.log('Fixed parseJsonColumn (CRLF)');
    } else {
        console.log('parseJsonColumn not found exactly');
    }
}

fs.writeFileSync(path, text);
