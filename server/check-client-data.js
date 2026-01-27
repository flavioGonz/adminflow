const { MongoClient } = require('mongodb');

async function checkData() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db('adminflow');

        console.log('=== CHECKING CLIENT DATA ===\n');

        const clientCount = await db.collection('clients').countDocuments();
        console.log(`Total clients: ${clientCount}`);

        const accessCount = await db.collection('client_accesses').countDocuments();
        console.log(`Total client_accesses: ${accessCount}`);

        const diagramCount = await db.collection('client_diagrams').countDocuments();
        console.log(`Total client_diagrams: ${diagramCount}`);

        const implCount = await db.collection('client_implementations').countDocuments();
        console.log(`Total client_implementations: ${implCount}`);

        const fileCount = await db.collection('repository_items').countDocuments();
        console.log(`Total repository_items: ${fileCount}`);

        console.log('\n=== SAMPLE CLIENTS ===');
        const clients = await db.collection('clients').find({}).limit(3).toArray();
        clients.forEach(c => {
            console.log(`\nClient ID: ${c.id}, Name: ${c.name}`);
        });

        console.log('\n=== SAMPLE ACCESSES ===');
        const accesses = await db.collection('client_accesses').find({}).limit(5).toArray();
        accesses.forEach(a => {
            console.log(`ClientId: ${a.clientId}, Type: ${a.type || 'N/A'}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

checkData();
