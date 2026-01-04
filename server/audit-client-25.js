const { MongoClient } = require('mongodb');

const uri1 = "mongodb://192.168.99.121:27017"; // Proxmox
const uri2 = "mongodb://crm.infratec.com.uy:29999"; // CRM Remote

async function getAccesses(uri, label) {
    let client;
    try {
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        const db = client.db('adminflow');

        // Check string ID
        const docsString = await db.collection('client_accesses').find({ clientId: "25" }).toArray();
        // Check number ID (just in case)
        const docsNumber = await db.collection('client_accesses').find({ clientId: 25 }).toArray();

        const allDocs = [...docsString, ...docsNumber];

        console.log(`\n=== ${label} ===`);
        console.log(`Total records for Client 25: ${allDocs.length}`);

        if (allDocs.length > 0) {
            // Group by type
            const byType = allDocs.reduce((acc, item) => {
                const t = item.tipo_equipo || 'unknown';
                acc[t] = (acc[t] || 0) + 1;
                return acc;
            }, {});
            console.log('Counts by Type:', byType);

            // List non-email items to identify "old accesses"
            const nonEmail = allDocs.filter(d => d.tipo_equipo !== 'email');
            if (nonEmail.length > 0) {
                console.log('Non-Email items found:');
                nonEmail.forEach(d => console.log(` - [${d.tipo_equipo}] ${d.equipo} (${d.ip || 'no ip'})`));
            } else {
                console.log('No non-email items found. (This might be the problem if they expect routers/servers)');
            }

            // List email items count
            const emails = allDocs.filter(d => d.tipo_equipo === 'email');
            console.log(`Email items count: ${emails.length}`);
        } else {
            console.log("No records found for Client 25.");
        }

    } catch (e) {
        console.error(`Error checking ${label}:`, e.message);
    } finally {
        if (client) await client.close();
    }
}

async function run() {
    await getAccesses(uri1, "PROXMOX (Current DB)");
    await getAccesses(uri2, "CRM REMOTE (Old/Mirror DB?)");
}

run();
