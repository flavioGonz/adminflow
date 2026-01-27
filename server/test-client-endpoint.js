const { MongoClient } = require('mongodb');

async function testClientEndpoint() {
    const client = new MongoClient('mongodb://192.168.99.121:27017');

    try {
        await client.connect();
        const db = client.db('adminflow');

        console.log('=== SIMULANDO ENDPOINT /api/clients ===\n');

        // Obtener clientes
        const clients = await db.collection('clients').find({}).limit(5).toArray();

        // Para cada cliente, verificar indicadores
        for (const clientDoc of clients) {
            console.log(`\nCliente: ${clientDoc.name} (ID: ${clientDoc.id})`);

            // Verificar accesos
            const access = await db.collection('client_accesses').findOne({
                clientId: clientDoc.id.toString()
            });
            const hasAccess = !!access;

            // Verificar diagramas
            const diagram = await db.collection('client_diagrams').findOne({
                clientId: clientDoc.id.toString()
            });
            const hasDiagram = !!diagram;

            // Verificar archivos
            const files = await db.collection('repository_items').findOne({
                clientId: clientDoc.id.toString()
            });
            const hasFiles = !!files;

            // Verificar implementación
            const impl = await db.collection('client_implementations').findOne({
                clientId: clientDoc.id.toString()
            });
            const hasImplementation = !!impl;

            console.log(`  hasAccess: ${hasAccess}`);
            console.log(`  hasDiagram: ${hasDiagram}`);
            console.log(`  hasFiles: ${hasFiles}`);
            console.log(`  hasImplementation: ${hasImplementation}`);

            // Mostrar qué iconos deberían aparecer
            const icons = [];
            if (hasAccess) icons.push('🔒 Lock');
            if (hasDiagram) icons.push('🌐 Network');
            if (hasFiles) icons.push('📁 FolderArchive');
            if (hasImplementation) icons.push('🔌 RJ45');

            if (icons.length > 0) {
                console.log(`  ✅ Iconos que deberían aparecer: ${icons.join(', ')}`);
            } else {
                console.log(`  ❌ No debería aparecer ningún icono`);
            }
        }

    } finally {
        await client.close();
    }
}

testClientEndpoint();
