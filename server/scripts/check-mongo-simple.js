const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function checkMongo() {
    console.log('Verificando conexión a MongoDB...');

    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        // Intentar leer de .selected-db.json
        try {
            const dbConfigFile = path.resolve(__dirname, '../../.selected-db.json');
            if (fs.existsSync(dbConfigFile)) {
                const dbConfig = JSON.parse(fs.readFileSync(dbConfigFile, 'utf-8'));
                if (dbConfig.engine === 'mongodb' && dbConfig.mongoUri) {
                    mongoUri = dbConfig.mongoUri;
                    console.log('URI encontrada en .selected-db.json');
                }
            }
        } catch (e) {
            console.warn('No se pudo leer .selected-db.json:', e);
        }
    }

    if (!mongoUri) {
        console.error('❌ No se encontró URI de MongoDB (ni en env ni en config).');
        return;
    }

    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conexión a MongoDB exitosa.');
        await client.close();
    } catch (e) {
        console.error('❌ Error conectando a MongoDB:', e.message);
    }
}

checkMongo();
