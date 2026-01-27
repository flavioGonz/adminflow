const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function run() {
    let mongoUri = "mongodb://localhost:27017";
    let mongoDbName = "adminflow";

    const configPath = path.resolve(__dirname, '..', '.selected-db.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.mongoUri) mongoUri = config.mongoUri;
        if (config.mongoDb) mongoDbName = config.mongoDb;
    }

    console.log(`Connecting to ${mongoUri}...`);
    const client = await MongoClient.connect(mongoUri);
    const db = client.db(mongoDbName);

    const collections = await db.listCollections().toArray();
    console.log('\n--- Collections Status ---');
    const interesting = ['clients', 'tickets', 'users', 'budgets', 'contracts', 'payments', 'groups'];
    for (const name of interesting) {
        const count = await db.collection(name).countDocuments().catch(() => -1);
        console.log(`${name}: ${count < 0 ? 'NOT FOUND' : count + ' documents'}`);
    }

    // Also list all found
    console.log('\nAll collections found:');
    collections.forEach(c => console.log(`- ${c.name}`));

    await client.close();
}

run().catch(console.error);
