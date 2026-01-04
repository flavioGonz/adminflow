const { initMongo, getMongoDb, closeMongoConnection } = require('./lib/mongoClient');

async function checkData() {
    try {
        await initMongo();
        const db = getMongoDb();

        console.log("Checking for records with clientId: '46' (string)...");
        const recordsString = await db.collection('client_accesses').find({ clientId: "46" }).toArray();
        console.log(`Found ${recordsString.length} records with string ID.`);
        console.log(recordsString[0]);

        console.log("Checking for records with clientId: 46 (number)...");
        const recordsNumber = await db.collection('client_accesses').find({ clientId: 46 }).toArray();
        console.log(`Found ${recordsNumber.length} records with number ID.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closeMongoConnection();
        process.exit(0);
    }
}

checkData();
