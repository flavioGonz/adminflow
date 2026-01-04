const { initMongo, getMongoDb, closeMongoConnection } = require('../lib/mongoClient');

const DEFAULT_NODES = [
    // Center-Left
    { id: '1', position: { x: 200, y: 400 }, data: { label: 'Nuevo' }, type: 'input' },

    // CENTER HUB
    { id: '3', position: { x: 600, y: 400 }, data: { label: 'En proceso' } },

    // Top Branch (Visitas)
    { id: '4', position: { x: 600, y: 150 }, data: { label: 'Visita - Coordinar' } },
    { id: '5', position: { x: 850, y: 150 }, data: { label: 'Visita Programada' } },
    { id: '6', position: { x: 1100, y: 150 }, data: { label: 'Visita Realizada' } },
    { id: '7', position: { x: 1350, y: 150 }, data: { label: 'Revision Cerrar Visita' } },

    // Right Branch (Resolution)
    { id: '8', position: { x: 1000, y: 400 }, data: { label: 'Resuelto' } },
    { id: '9', position: { x: 1250, y: 400 }, data: { label: 'Facturar' } },
    { id: '10', position: { x: 1500, y: 400 }, data: { label: 'Pagado' }, type: 'output' },

    // Bottom-Right Loop (Re-open)
    { id: '11', position: { x: 1250, y: 650 }, data: { label: 'Re abierto' } },

    // Waiting Loop (Bottom Center)
    { id: '12', position: { x: 600, y: 650 }, data: { label: 'Esperando cliente' } },
];

const DEFAULT_EDGES = [
    // Entry
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e1-4', source: '1', target: '4', label: 'Requiere Visita', style: { stroke: '#64748b', strokeDasharray: '5,5' } },

    // To Visitas (Up)
    { id: 'e3-4', source: '3', target: '4', label: 'Requiere Visita' },

    // Visita Chain
    { id: 'e4-5', source: '4', target: '5' },
    { id: 'e5-6', source: '5', target: '6' },
    { id: 'e6-7', source: '6', target: '7' },

    // Visita Return to Resuelto (Down)
    { id: 'e7-8', source: '7', target: '8' },

    // Direct Resolution (Right)
    { id: 'e3-8', source: '3', target: '8' },

    // Finalization Chain
    { id: 'e8-9', source: '8', target: '9' },
    { id: 'e9-10', source: '9', target: '10' },

    // Re-open Loop (Bottom)
    { id: 'e8-11', source: '8', target: '11', label: 'Reabrir', style: { stroke: '#f43f5e' } },
    { id: 'e10-11', source: '10', target: '11', label: 'Reabrir', style: { stroke: '#f43f5e' } },

    // Waiting Loop
    { id: 'e3-12', source: '3', target: '12', label: 'Pausar' },
    { id: 'e12-3', source: '12', target: '3', label: 'Reanudar' },


];

async function run() {
    try {
        console.log("Connecting to DB...");
        await initMongo();
        const db = getMongoDb();
        const collection = db.collection('workflows');

        console.log("Applying STAR/RADIAL layout...");
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
