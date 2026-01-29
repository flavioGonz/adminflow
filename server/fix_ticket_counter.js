const { MongoClient } = require('mongodb');
(async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('adminflow');
  const counter = await db.collection('counters').findOne({ _id: 'tickets' });
  console.log(JSON.stringify(counter));
  
  if (!counter || counter.seq < 100) {
      console.log('Updating counter to 100');
      await db.collection('counters').updateOne(
        { _id: 'tickets' },
        { $set: { seq: 100 } },
        { upsert: true }
      );
  }
  
  await client.close();
})();
