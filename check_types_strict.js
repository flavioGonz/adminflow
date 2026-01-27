
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function checkTypes() {
    await initMongo();
    const db = getMongoDb();

    const tickets = await db.collection('tickets').find().limit(10).toArray();
    console.log('--- Checking Types ---');
    tickets.forEach(t => {
        console.log(`_id: ${t._id}, id: ${JSON.stringify(t.id)}, type: ${typeof t.id}`);
    });

    const numericCount = await db.collection('tickets').countDocuments({ id: { $type: 'number' } });
    const stringCount = await db.collection('tickets').countDocuments({ id: { $type: 'string' } });

    console.log(`Numeric ID count: ${numericCount}`);
    console.log(`String ID count: ${stringCount}`);

    process.exit();
}

checkTypes().catch(console.error);
