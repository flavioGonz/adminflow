
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function checkMissingIds() {
    await initMongo();
    const db = getMongoDb();

    const total = await db.collection('tickets').countDocuments();
    const withId = await db.collection('tickets').countDocuments({ id: { $exists: true } });
    const withoutId = await db.collection('tickets').countDocuments({ id: { $exists: false } });

    console.log(`Total tickets: ${total}`);
    console.log(`With 'id' field: ${withId}`);
    console.log(`Without 'id' field: ${withoutId}`);

    if (withoutId > 0) {
        console.log('Sample without ID:');
        const sample = await db.collection('tickets').findOne({ id: { $exists: false } });
        console.log(sample);
    }

    process.exit();
}

checkMissingIds().catch(console.error);
