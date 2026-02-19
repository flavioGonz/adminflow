const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const contracts = await db.collection('contracts').find().sort({ _id: -1 }).limit(5).toArray();
    console.log('Last 5 contracts:');
    contracts.forEach(c => {
        console.log(`ID: ${c.id}, Title: ${c.title}, clientId: ${c.clientId}, client_id: ${c.client_id}, clientName: ${c.clientName}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
