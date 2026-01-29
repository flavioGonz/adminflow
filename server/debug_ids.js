const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const uri = "mongodb://192.168.99.121:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('adminflow');
        
        console.log("--- CLIENTS SAMPLE ---");
        const clients = await db.collection('clients').find().limit(10).toArray();
        clients.forEach(c => {
            console.log(`_id: ${c._id}, id: ${c.id}, name: ${c.name}, numericId: ${c.numericId}`);
        });

        const testId = "5"; // Assuming 5 is problematic
        console.log(`\n--- FETCHING ID: ${testId} ---`);
        const { getMongoFilter } = require('./lib/clientFilters');
        const filter = getMongoFilter(testId);
        console.log("Generated Filter:", JSON.stringify(filter));
        
        const found = await db.collection('clients').findOne(filter);
        console.log("Found Client:", found ? `${found.name} (id: ${found.id})` : "NOT FOUND");

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

debug();
