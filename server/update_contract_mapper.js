const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

const oldMapContractRow = `const mapContractRow = (row) => ({
    ...row,
    id: getId(row),
    clientId: row.client_id !== undefined ? String(row.client_id) : (row.clientId !== undefined ? String(row.clientId) : undefined),
    clientName: row.clientName || '',
    title: row.title || row.contract_name || '',
    description: row.description || '',
    startDate: row.startDate || null,
    endDate: row.endDate || null,
    status: row.status || '',
    sla: row.sla || '',
    contractType: row.contractType || '',
    amount: row.amount,
    currency: row.currency || 'ARS',
    filePath: row.file_path || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});`;

const newMapContractRow = `const mapContractRow = (row, clientMap = {}) => {
    const clientId = row.client_id !== undefined ? String(row.client_id) : (row.clientId !== undefined ? String(row.clientId) : undefined);
    const clientData = clientId ? clientMap[clientId] : null;
    return {
        ...row,
        id: getId(row),
        clientId,
        clientName: clientData ? clientData.name : (row.clientName || ''),
        clientAvatarUrl: clientData ? clientData.avatarUrl : null,
        title: row.title || row.contract_name || '',
        description: row.description || '',
        startDate: row.startDate || null,
        endDate: row.endDate || null,
        status: row.status || '',
        sla: row.sla || '',
        contractType: row.contractType || '',
        amount: row.amount,
        currency: row.currency || 'ARS',
        filePath: row.file_path || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};`;

if (text.includes(oldMapContractRow)) {
    text = text.replace(oldMapContractRow, newMapContractRow);
    console.log('Updated mapContractRow');
} else {
    const oldRN = oldMapContractRow.replace(/\n/g, '\r\n');
    const newRN = newMapContractRow.replace(/\n/g, '\r\n');
    if (text.includes(oldRN)) {
        text = text.replace(oldRN, newRN);
        console.log('Updated mapContractRow (CRLF)');
    } else {
        console.log('mapContractRow not found');
    }
}

fs.writeFileSync(path, text);
