
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function checkRepoItems() {
    await initMongo();
    const db = getMongoDb();

    const count = await db.collection('repository_items').countDocuments();
    console.log(`Total 'repository_items': ${count}`);

    const accessCount = await db.collection('client_accesses').countDocuments();
    console.log(`Total 'client_accesses': ${accessCount}`);

    process.exit();
}

checkRepoItems().catch(console.error);
