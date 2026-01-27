
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function checkTickets() {
    await initMongo();
    const db = getMongoDb();

    const tickets = await db.collection('tickets').find().limit(5).toArray();
    console.log('--- First 5 Tickets ---');
    tickets.forEach(t => {
        console.log(`_id: ${t._id} (type: ${typeof t._id}), id: ${t.id} (type: ${typeof t.id})`);
    });

    const counters = await db.collection('counters').find().toArray();
    console.log('\n--- Counters ---');
    console.log(counters);

    // Find numeric IDs specifically
    const numericIds = await db.collection('tickets').find({ id: { $type: 'number' } }).limit(5).toArray();
    console.log('\n--- Tickets with numeric IDs ---');
    numericIds.forEach(t => {
        console.log(`id: ${t.id}`);
    });

    process.exit();
}

checkTickets().catch(console.error);
