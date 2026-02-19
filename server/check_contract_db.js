const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const sample = await db.collection('contracts').findOne();
    console.log('Contract sample:', JSON.stringify(sample));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
