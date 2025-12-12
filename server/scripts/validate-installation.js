#!/usr/bin/env node
// server/scripts/validate-installation.js
// Script para validar la integridad de la instalación sin modificar nada

const { getInstallationReport } = require('../lib/installationValidator');
const { initMongo, closeMongoConnection } = require('../lib/mongoClient');
const { determineDbEngine, getDbConfigFromFile } = require('../lib/dbChoice');

async function main() {
    console.log('\n🔍 Validando instalación de AdminFlow...\n');

    try {
        // Inicializar conexión a BD si es necesario
        const engine = await determineDbEngine();
        
        if (engine === 'mongodb') {
            const dbConfig = getDbConfigFromFile();
            try {
                await initMongo({
                    uri: dbConfig.mongoUri,
                    dbName: dbConfig.mongoDb
                });
                console.log('✅ Conectado a MongoDB\n');
            } catch (mongoError) {
                console.log('⚠️  No se pudo conectar a MongoDB:', mongoError.message);
                console.log('   Continuando con validación...\n');
            }
        }

        // Generar y mostrar reporte
        const report = await getInstallationReport();
        console.log(report);

        // Cerrar conexiones
        if (engine === 'mongodb') {
            await closeMongoConnection();
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error fatal durante validación:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
