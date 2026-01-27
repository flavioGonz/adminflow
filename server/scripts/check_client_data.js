const { MongoClient, ObjectId } = require('mongodb');
const config = {
  uri: 'mongodb://192.168.99.121:27017',
  dbName: 'adminflow',
};
const clientId = '692af9d717d9f59bc755d966';
(async () => {
  const mongoClient = new MongoClient(config.uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await mongoClient.connect();
    const db = mongoClient.db(config.dbName);

    const schema = async () => {
      const [accesses, diagrams, repoById, repoByField] = await Promise.all([
        db.collection('client_accesses').find({ clientId }).toArray(),
        db.collection('client_diagrams').find({ clientId }).toArray(),
        db.collection('repository').find({ client_id: clientId }).toArray(),
        db.collection('repository').find({ clientId }).toArray(),
      ]);
      return { accesses, diagrams, repoById, repoByField };
    };

    const { accesses, diagrams, repoById, repoByField } = await schema();
    console.log({
      accesses: { count: accesses.length, sample: accesses[0] ? { clientId: accesses[0].clientId } : null },
      diagrams: { count: diagrams.length, sample: diagrams[0] ? { clientId: diagrams[0].clientId } : null },
      repository: {
        client_id: repoById.length,
        clientId: repoByField.length,
      },
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoClient.close().catch(() => undefined);
  }
})();
