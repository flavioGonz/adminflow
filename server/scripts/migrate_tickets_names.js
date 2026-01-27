const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function migrateTickets() {
    const dbConfigFile = path.resolve(__dirname, '../.selected-db.json');
    let mongoUri = 'mongodb://localhost:27017';
    let dbName = 'adminflow';

    if (fs.existsSync(dbConfigFile)) {
        try {
            const dbConfig = JSON.parse(fs.readFileSync(dbConfigFile, 'utf-8'));
            if (dbConfig.mongoUri) mongoUri = dbConfig.mongoUri;
            if (dbConfig.mongoDb) dbName = dbConfig.mongoDb;
        } catch (e) { }
    }

    console.log(`Migrando tickets en ${mongoUri}/${dbName}...`);
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        const db = client.db(dbName);

        // Find tickets without clientName
        const tickets = await db.collection('tickets').find({
            $or: [
                { clientName: { $exists: false } },
                { clientName: null },
                { clientName: '' }
            ]
        }).toArray();
        console.log(`Encontrados ${tickets.length} tickets para procesar.`);

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const ticket of tickets) {
            const cid = ticket.clientId || ticket.client_id;
            if (cid) {
                // Try to find client by various ID formats
                let clientDoc = null;

                // Try numeric
                if (!isNaN(Number(cid))) {
                    clientDoc = await db.collection('clients').findOne({ id: Number(cid) });
                }

                // Try as is (ObjectId or string)
                if (!clientDoc) {
                    clientDoc = await db.collection('clients').findOne({ _id: cid });
                }

                // Try as string id
                if (!clientDoc) {
                    clientDoc = await db.collection('clients').findOne({ id: String(cid) });
                }

                if (clientDoc) {
                    await db.collection('tickets').updateOne(
                        { _id: ticket._id },
                        {
                            $set: {
                                clientName: clientDoc.name,
                                clientEmail: clientDoc.email || '',
                                clientNotificationsEnabled: !!clientDoc.notifications_enabled
                            }
                        }
                    );
                    updatedCount++;
                } else {
                    notFoundCount++;
                }
            }
        }
        console.log(`\nMigración completada. Actualizados: ${updatedCount}, No encontrados: ${notFoundCount}`);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.close();
    }
}

migrateTickets();
