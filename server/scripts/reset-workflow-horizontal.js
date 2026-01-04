const { initMongo, getMongoDb, closeMongoConnection } = require('../lib/mongoClient');

const DEFAULT_NODES = [
    { id: '1', position: { x: 50, y: 100 }, data: { label: 'Nuevo' }, type: 'input' },
    // 'Abierto' removed
    { id: '3', position: { x: 300, y: 100 }, data: { label: 'En proceso' } },
    { id: '4', position: { x: 300, y: 300 }, data: { label: 'Visita - Coordinar' } },
    { id: '5', position: { x: 550, y: 300 }, data: { label: 'Visita Programada' } },
    { id: '6', position: { x: 800, y: 300 }, data: { label: 'Visita Realizada' } },
    { id: '7', position: { x: 1050, y: 300 }, data: { label: 'Revision Cerrar Visita' } },
    { id: '8', position: { x: 1300, y: 100 }, data: { label: 'Resuelto' } },
    { id: '9', position: { x: 1550, y: 100 }, data: { label: 'Facturar' } },
    { id: '10', position: { x: 1800, y: 100 }, data: { label: 'Pagado' }, type: 'output' },
    { id: '11', position: { x: 1550, y: 300 }, data: { label: 'Re abierto' } },
];

const DEFAULT_EDGES = [
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e1-4', source: '1', target: '4', label: 'Requiere Visita' },
    { id: 'e3-8', source: '3', target: '8' },
    { id: 'e3-4', source: '3', target: '4', label: 'Requiere Visita' },
    { id: 'e4-5', source: '4', target: '5' },
    { id: 'e5-6', source: '5', target: '6' },
    { id: 'e6-7', source: '6', target: '7' },
    { id: 'e7-8', source: '7', target: '8' },
    { id: 'e8-9', source: '8', target: '9' },
    { id: 'e9-10', source: '9', target: '10' },
    { id: 'e8-11', source: '8', target: '11', label: 'Reabrir' },
    { id: 'e10-11', source: '10', target: '11', label: 'Reabrir' },
    { id: 'e11-3', source: '11', target: '3', label: 'Procesar de nuevo' },
];

async function run() {
    try {
        console.log("Connecting to DB...");
        await initMongo();
        const db = getMongoDb();
        const collection = db.collection('workflows');

        console.log("Updating ticket workflow...");
        const result = await collection.updateOne(
            { type: 'ticket_flow' },
            {
                $set: {
                    nodes: DEFAULT_NODES,
                    edges: DEFAULT_EDGES,
                    updatedAt: new Date()
                }
            }
        );

        console.log("Update result:", result);
        console.log("Done.");
    } catch (err) {
        console.error(err);
    } finally {
        await closeMongoConnection();
    }
}

run();
