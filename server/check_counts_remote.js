const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const tCount = await db.collection('tickets').countDocuments();
    const cCount = await db.collection('clients').countDocuments();
    console.log(`TICKETS: ${tCount}`);
    console.log(`CLIENTS: ${cCount}`);
    
    if (tCount > 0) {
        const sample = await db.collection('tickets').findOne();
        console.log('Sample Ticket:', JSON.stringify(sample));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
