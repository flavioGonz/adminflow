
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function checkAccessData() {
    await initMongo();
    const db = getMongoDb();

    const count = await db.collection('client_accesses').countDocuments();
    console.log(`Total documents in 'client_accesses': ${count}`);

    if (count > 0) {
        console.log('Sample documents:');
        const sample = await db.collection('client_accesses').find().limit(5).toArray();
        sample.forEach(s => console.log(s));
    } else {
        console.log('Searching for accesses in other collections...');
        // Check if they are embedded in clients
        const clientWithAccess = await db.collection('clients').findOne({ accesses: { $exists: true, $not: { $size: 0 } } });
        if (clientWithAccess) {
            console.log('Found accesses embedded in client document:');
            console.log(JSON.stringify(clientWithAccess.accesses.slice(0, 1), null, 2));
        } else {
            console.log('No embedded accesses found in clients.');
        }

        // Check if there is another collection name
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    }

    process.exit();
}

checkAccessData().catch(console.error);
