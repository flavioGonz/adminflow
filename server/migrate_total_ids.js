const { MongoClient, ObjectId } = require('mongodb');

async function migrate() {
    const uri = "mongodb://192.168.99.121:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('adminflow');
        
        console.log("🚀 Starting Total ID Migration (Starting from 101)...");

        // 1. Get all clients sorted by current ID (numeric if possible)
        const clients = await db.collection('clients').find().toArray();
        clients.sort((a, b) => {
            const idA = parseInt(a.id) || 0;
            const idB = parseInt(b.id) || 0;
            return idA - idB;
        });

        console.log(`📦 Found ${clients.length} clients to migrate.`);

        const relatedCollections = [
            'tickets', 
            'payments', 
            'contracts', 
            'repository_items', 
            'client_diagrams', 
            'client_accesses', 
            'client_implementations',
            'calendar_events'
        ];

        for (let i = 0; i < clients.length; i++) {
            const clientDoc = clients[i];
            const oldId = String(clientDoc.id);
            const newId = String(101 + i);

            console.log(`🔄 Migrating: "${clientDoc.name}" | Old ID: ${oldId} -> New ID: ${newId}`);

            // Update Client Document
            await db.collection('clients').updateOne(
                { _id: clientDoc._id },
                { $set: { id: newId, numericId: parseInt(newId), sqliteId: oldId } }
            );

            // Update Related Collections
            for (const collName of relatedCollections) {
                const coll = db.collection(collName);
                
                // Update fields that might be named 'clientId' or 'client_id'
                // We check for both string and numeric old ID just in case
                const numericOldId = parseInt(oldId);
                
                const filter = {
                    $or: [
                        { clientId: oldId },
                        { client_id: oldId },
                        { clientId: numericOldId },
                        { client_id: numericOldId }
                    ]
                };

                const update = { $set: { clientId: newId, client_id: newId } };
                
                const result = await coll.updateMany(filter, update);
                if (result.modifiedCount > 0) {
                    console.log(`   ✅ Updated ${result.modifiedCount} records in "${collName}"`);
                }
            }
        }

        // 2. Update counter
        await db.collection('counters').updateOne(
            { _id: 'clients' },
            { $set: { seq: 101 + clients.length } },
            { upsert: true }
        );

        console.log("\n✨ Migration completed successfully!");

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.close();
    }
}

migrate();
