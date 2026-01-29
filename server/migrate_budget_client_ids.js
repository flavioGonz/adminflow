const { MongoClient } = require('mongodb');

const URI = 'mongodb://192.168.99.121:27017';
const DB_NAME = 'adminflow';

async function run() {
  const client = new MongoClient(URI);
  await client.connect();
  try {
    const db = client.db(DB_NAME);
    const clients = await db.collection('clients').find({}).toArray();
    const mapping = new Map();

    clients.forEach((clientDoc) => {
      const newId = clientDoc.id ? String(clientDoc.id) : null;
      const oldId = clientDoc.sqliteId ? String(clientDoc.sqliteId) : null;
      const numericOld = clientDoc.numericId !== undefined && clientDoc.numericId !== null ? String(clientDoc.numericId) : null;
      if (newId) {
        if (oldId) mapping.set(oldId, newId);
        if (numericOld) mapping.set(numericOld, newId);
        mapping.set(newId, newId); // ensure already-correct values stay
      }
    });

    const budgets = await db.collection('budgets').find({}).toArray();
    let updates = 0;
    for (const budget of budgets) {
      const clientValue = budget.clientId ?? budget.client_id;
      const candidate = clientValue !== undefined && clientValue !== null ? String(clientValue) : null;
      if (!candidate) continue;
      const mapped = mapping.get(candidate);
      if (mapped && mapped !== candidate) {
        await db.collection('budgets').updateOne(
          { _id: budget._id },
          { $set: { clientId: mapped, client_id: mapped } }
        );
        updates += 1;
      }
    }

    console.log(`Updated ${updates} budget documents to new client IDs.`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Budget migration failed:', error);
  process.exit(1);
});