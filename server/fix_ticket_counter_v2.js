const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    
    // Check 'seq' (for migration compatibility)
    let counter = await db.collection('counters').findOne({ _id: 'tickets' });
    console.log('Current counter (tickets):', JSON.stringify(counter));
    
    if (!counter || counter.seq < 100) {
        console.log('Updating seq to 100');
        await db.collection('counters').updateOne(
          { _id: 'tickets' },
          { $set: { seq: 100 } },
          { upsert: true }
        );
    }
    
    // Also remove 'sequence' if it exists to avoid confusion
    if (counter && counter.sequence !== undefined) {
        console.log('Removing old "sequence" field');
        await db.collection('counters').updateOne(
            { _id: 'tickets' },
            { $unset: { sequence: "" } }
        );
    }

    console.log('Final counter:', JSON.stringify(await db.collection('counters').findOne({ _id: 'tickets' })));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
