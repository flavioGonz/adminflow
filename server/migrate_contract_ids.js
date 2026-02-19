const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const contracts = await db.collection('contracts').find({ client_id: { $exists: true } }).toArray();
    console.log(`Found ${contracts.length} contracts with legacy client_id`);
    
    for (const contract of contracts) {
        const clientId = contract.clientId || contract.client_id;
        // Make sure it's a string for consistency
        const normalizedId = String(clientId);
        
        await db.collection('contracts').updateOne(
            { _id: contract._id },
            { 
                $set: { clientId: normalizedId },
                $unset: { client_id: "" }
            }
        );
        console.log(`Migrated contract ${contract.id}: ${contract.client_id} -> ${normalizedId}`);
    }
    console.log('Migration finished');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
