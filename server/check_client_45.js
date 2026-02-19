const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const c45 = await db.collection('clients').findOne({ id: 45 });
    console.log('Client 45 found:', !!c45);
    if (c45) console.log(JSON.stringify(c45));
    
    const cAll = await db.collection('clients').find({}, { projection: { id: 1, name: 1 } }).toArray();
    console.log('Total clients:', cAll.length);
    console.log('Client IDs:', cAll.map(c => c.id).join(', '));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
