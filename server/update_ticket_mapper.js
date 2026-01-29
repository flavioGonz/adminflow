const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

const oldMapTicketRow = `const mapTicketRow = (row) => ({
    ...row,
    id: getId(row),
    clientId: row.clientId !== undefined ? String(row.clientId) : (row.client_id !== undefined ? String(row.client_id) : undefined),
    clientName: row.clientName || '',
    title: row.title,
    status: row.status,
    priority: row.priority,
    amount: row.amount,
    visit: !!row.visit,
    annotations: parseJsonColumn(row.annotations, []),
    hasActiveContract: !!row.hasActiveContract,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    description: row.description || '',
    attachments: parseJsonColumn(row.attachments, []),
    audioNotes: parseJsonColumn(row.audioNotes, []),
    assignedTo: row.assignedTo || null,
    assignedGroupId: row.assignedGroupId || null,
    visitData: parseJsonColumn(row.visit_data, null),
    clientNotificationsEnabled: !!row.clientNotificationsEnabled,
    clientEmail: row.clientEmail || '',
});`;

const newMapTicketRow = `const mapTicketRow = (row, clientMap = {}) => {
    const clientId = row.clientId !== undefined ? String(row.clientId) : (row.client_id !== undefined ? String(row.client_id) : undefined);
    const clientData = clientId ? clientMap[clientId] : null;
    return {
        ...row,
        id: getId(row),
        clientId,
        clientName: clientData ? clientData.name : (row.clientName || ''),
        clientAvatarUrl: clientData ? clientData.avatarUrl : null,
        title: row.title,
        status: row.status,
        priority: row.priority,
        amount: row.amount,
        visit: !!row.visit,
        annotations: parseJsonColumn(row.annotations, []),
        hasActiveContract: !!row.hasActiveContract,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        description: row.description || '',
        attachments: parseJsonColumn(row.attachments, []),
        audioNotes: parseJsonColumn(row.audioNotes, []),
        assignedTo: row.assignedTo || null,
        assignedGroupId: row.assignedGroupId || null,
        visitData: parseJsonColumn(row.visit_data, null),
        clientNotificationsEnabled: !!row.clientNotificationsEnabled,
        clientEmail: row.clientEmail || '',
    };
};`;

if (text.includes(oldMapTicketRow)) {
    text = text.replace(oldMapTicketRow, newMapTicketRow);
    console.log('Updated mapTicketRow');
} else {
    const oldRN = oldMapTicketRow.replace(/\n/g, '\r\n');
    const newRN = newMapTicketRow.replace(/\n/g, '\r\n');
    if (text.includes(oldRN)) {
        text = text.replace(oldRN, newRN);
        console.log('Updated mapTicketRow (CRLF)');
    } else {
        console.log('mapTicketRow not found');
    }
}

fs.writeFileSync(path, text);
