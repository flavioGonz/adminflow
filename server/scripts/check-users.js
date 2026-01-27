const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function checkUsers() {
    let mongoUri = "mongodb://localhost:27017";
    let mongoDbName = "adminflow";

    const configPath = path.resolve(__dirname, '..', '.selected-db.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.mongoUri) mongoUri = config.mongoUri;
        if (config.mongoDb) mongoDbName = config.mongoDb;
    }

    console.log(`Conectando a ${mongoUri}...`);
    const client = await MongoClient.connect(mongoUri);
    const db = client.db(mongoDbName);

    const users = await db.collection('users').find().toArray();
    console.log('\n--- Usuarios en MongoDB ---');
    console.log(`Total: ${users.length} usuarios`);

    users.forEach(user => {
        console.log(`\nEmail: ${user.email}`);
        console.log(`  _id: ${user._id}`);
        console.log(`  Name: ${user.name || 'N/A'}`);
        console.log(`  Role: ${user.role || user.roles || 'N/A'}`);
        console.log(`  Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`  Created: ${user.createdAt || 'N/A'}`);
    });

    await client.close();
}

checkUsers().catch(console.error);
