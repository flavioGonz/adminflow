
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function checkAccessStats() {
    await initMongo();
    const db = getMongoDb();

    const total = await db.collection('client_accesses').countDocuments();
    console.log(`Total 'client_accesses': ${total}`);

    const distinctClients = await db.collection('client_accesses').distinct('clientId');
    console.log(`Distinct clientIds in accesses: ${distinctClients.length}`);
    console.log('First 10 clientIds:', distinctClients.slice(0, 10));

    // Check if these clients exist
    if (distinctClients.length > 0) {
        const firstClientId = distinctClients[0];
        const client = await db.collection('clients').findOne({ id: firstClientId });
        const clientByObjId = await db.collection('clients').findOne({ _id: firstClientId });
        // Try numeric if string is numeric
        let clientByNumeric = null;
        if (!isNaN(firstClientId)) {
            clientByNumeric = await db.collection('clients').findOne({ id: Number(firstClientId) });
        }

        console.log(`\nChecking client '${firstClientId}':`);
        console.log(`- Found by id (string): ${!!client}`);
        console.log(`- Found by _id: ${!!clientByObjId}`);
        console.log(`- Found by id (number): ${!!clientByNumeric}`);

        if (client) console.log(`  Name: ${client.name}`);
        if (clientByNumeric) console.log(`  Name (numeric): ${clientByNumeric.name}`);
    }

    process.exit();
}

checkAccessStats().catch(console.error);
