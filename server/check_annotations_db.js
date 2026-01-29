const { MongoClient } = require('mongodb');
(async () => {
  const uri = 'mongodb://192.168.99.121:27017';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adminflow');
    const sample = await db.collection('tickets').findOne({ annotations: { $exists: true, $not: { $size: 0 } } });
    if (sample) {
        console.log('Ticket with annotations found:', sample.id);
        console.log('Annotations type:', typeof sample.annotations);
        console.log('Annotations content:', JSON.stringify(sample.annotations));
    } else {
        console.log('No tickets with annotations found in DB');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
})();
