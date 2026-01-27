const { MongoClient } = require('mongodb');

async function checkTypes() {
    const client = new MongoClient('mongodb://192.168.99.121:27017');

    try {
        await client.connect();
        const db = client.db('adminflow');

        console.log('=== VERIFICANDO TIPOS DE DATOS ===\n');

        // Check Client ID type
        const clientDoc = await db.collection('clients').findOne({ id: 2 });
        if (clientDoc) {
            console.log(`Cliente ID 2 (Alex Schenk):`);
            console.log(`  id value:`, clientDoc.id);
            console.log(`  id type:`, typeof clientDoc.id);
        } else {
            console.log('Cliente ID 2 no encontrado');
        }

        // Check Access clientId type
        const accessDoc = await db.collection('client_accesses').findOne({ clientId: '2' });
        const accessDocNum = await db.collection('client_accesses').findOne({ clientId: 2 });

        console.log(`\nBúsqueda en client_accesses para ID 2:`);
        if (accessDoc) {
            console.log(`  Encontrado con string "2": SÍ`);
            console.log(`  clientId value:`, accessDoc.clientId);
            console.log(`  clientId type:`, typeof accessDoc.clientId);
        } else {
            console.log(`  Encontrado con string "2": NO`);
        }

        if (accessDocNum) {
            console.log(`  Encontrado con number 2: SÍ`);
            console.log(`  clientId value:`, accessDocNum.clientId);
            console.log(`  clientId type:`, typeof accessDocNum.clientId);
        } else {
            console.log(`  Encontrado con number 2: NO`);
        }

    } finally {
        await client.close();
    }
}

checkTypes();
