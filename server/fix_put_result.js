const fs = require('fs');
const path = '/opt/adminflow/server/index.js';
let text = fs.readFileSync(path, 'utf8');

const oldBlock = `        const result = await mongoDb.collection('tickets').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(result));`;

const newBlock = `        const result = await mongoDb.collection('tickets').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        const updatedDoc = result.value || result;
        if (!updatedDoc) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(updatedDoc));`;

if (text.includes(oldBlock)) {
    text = text.replace(oldBlock, newBlock);
    console.log('Fixed PUT /api/tickets result handling');
} else {
    // Try with CRLF
    const oldBlockRN = oldBlock.replace(/\n/g, '\r\n');
    const newBlockRN = newBlock.replace(/\n/g, '\r\n');
    if (text.includes(oldBlockRN)) {
        text = text.replace(oldBlockRN, newBlockRN);
        console.log('Fixed PUT /api/tickets result handling (CRLF)');
    } else {
        console.log('Block not found exactly');
    }
}

fs.writeFileSync(path, text);
