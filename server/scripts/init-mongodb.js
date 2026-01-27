// server/scripts/init-mongodb.js
// Script CLI para inicializar MongoDB

const { initializeMongoDB, testMongoConnection } = require('../lib/mongoInit');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     AdminFlow - Inicialización de MongoDB             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Leer configuración
    const configPath = path.join(__dirname, '../.selected-db.json');
    let config;

    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configContent);
    } catch (error) {
        console.error('❌ No se pudo leer .selected-db.json');
        console.log('\n💡 Creando configuración por defecto...\n');

        config = {
            engine: 'mongodb',
            mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
            mongoDb: process.env.MONGODB_DB || 'adminflow',
            sqlitePath: 'database/database.sqlite'
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ Configuración creada en .selected-db.json\n');
    }

    const { mongoUri, mongoDb } = config;

    console.log(`📡 MongoDB URI: ${mongoUri}`);
    console.log(`🗄️  Base de datos: ${mongoDb}\n`);

    // Probar conexión
    console.log('🔍 Probando conexión...');
    const connectionTest = await testMongoConnection(mongoUri, mongoDb);

    if (!connectionTest.success) {
        console.error(`❌ Error de conexión: ${connectionTest.message}\n`);
        console.log('💡 Verifica que:');
        console.log('   1. MongoDB esté ejecutándose');
        console.log('   2. La URI sea correcta');
        console.log('   3. Tengas permisos de conexión\n');
        process.exit(1);
    }

    console.log('✅ Conexión exitosa\n');

    // Inicializar base de datos
    console.log('🚀 Iniciando creación de colecciones y esquemas...\n');

    const result = await initializeMongoDB(mongoUri, mongoDb);

    if (result.success) {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║              ✅ INICIALIZACIÓN EXITOSA                 ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log(`📊 Colecciones creadas: ${result.collections.length}`);
        console.log(`📋 Total de colecciones: ${result.totalCollections}\n`);

        if (result.collections.length > 0) {
            console.log('Nuevas colecciones:');
            result.collections.forEach(col => console.log(`  • ${col}`));
        }

        console.log('\n🎉 MongoDB está listo para usar!');
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Inicia el servidor: npm run dev');
        console.log('   2. (Opcional) Migra datos de SQLite: npm run migrate-to-mongo\n');

    } else {
        console.error('\n❌ Error en la inicialización:', result.message);
        process.exit(1);
    }
}

// Ejecutar
main().catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
});
