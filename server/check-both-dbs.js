const { MongoClient } = require('mongodb');

const uri1 = "mongodb://192.168.99.121:27017"; // Proxmox
const uri2 = "mongodb://crm.infratec.com.uy:29999"; // Seguridad Diferente

async function check(uri, name) {
    let client;
    try {
        console.log(`Checking ${name} (${uri})...`);
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        const db = client.db('adminflow');

        const count = await db.collection('client_accesses').countDocuments({ clientId: "25" });
        const AllCount = await db.collection('client_accesses').countDocuments({});

        console.log(`[${name}] Total accesses in DB: ${AllCount}`);
        console.log(`[${name}] Accesses for Client 25: ${count}`);

        const sample = await db.collection('client_accesses').find({ clientId: "25" }).limit(3).toArray();
        if (sample.length > 0) {
            console.log(`[${name}] Sample items:`, sample.map(s => s.equipo));
        }

    } catch (e) {
        console.error(`Error checking ${name}:`, e.message);
    } finally {
        if (client) await client.close();
    }
}

async function run() {
    await check(uri1, "PROXMOX (192.168.99.121)");
    console.log('---');
    await check(uri2, "CRM REMOTE (crm.infratec.com.uy)");
}

run();
