// test-mongo-connection.js
// Script para probar la conexión a MongoDB remoto

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://crm.infratec.com.uy:29999';
const MONGO_DB = process.env.MONGO_DB || 'adminflow';

async function testConnection() {
    console.log('🔍 Probando conexión a MongoDB...\n');
    console.log(`📡 URI: ${MONGO_URI}`);
    console.log(`🗄️  Base de datos: ${MONGO_DB}\n`);

    let client;
    
    try {
        console.log('⏳ Conectando...');
        
        client = new MongoClient(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        await client.connect();
        console.log('✅ Conexión establecida\n');

        const db = client.db(MONGO_DB);
        
        // Probar operación básica
        console.log('🔍 Verificando base de datos...');
        const collections = await db.listCollections().toArray();
        console.log(`✅ Colecciones encontradas: ${collections.length}`);
        
        if (collections.length > 0) {
            console.log('\n📋 Colecciones disponibles:');
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }

        // Obtener stats
        try {
            const stats = await db.stats();
            console.log('\n📊 Estadísticas de la base de datos:');
            console.log(`   📦 Tamaño: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   📑 Documentos: ${stats.objects}`);
            console.log(`   🗂️  Colecciones: ${stats.collections}`);
        } catch (statsError) {
            console.log('\n⚠️  No se pudieron obtener estadísticas:', statsError.message);
        }

        console.log('\n🎉 Conexión exitosa a MongoDB!');
        return true;

    } catch (error) {
        console.error('\n❌ Error de conexión:');
        console.error(`   ${error.message}`);
        
        if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 El host no se pudo resolver. Verifica:');
            console.log('   - Que el dominio crm.infratec.com.uy esté accesible');
            console.log('   - Que tengas conectividad de red');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Conexión rechazada. Verifica:');
            console.log('   - Que MongoDB esté corriendo en el puerto 29999');
            console.log('   - Que el firewall permita conexiones al puerto 29999');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Fallo de autenticación. Verifica:');
            console.log('   - Usuario y contraseña correctos');
            console.log('   - URI completa con credenciales');
        } else if (error.message.includes('timed out')) {
            console.log('\n💡 Timeout de conexión. Verifica:');
            console.log('   - Que el servidor esté accesible desde tu red');
            console.log('   - Configuración de firewall/VPN');
        }
        
        return false;

    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Conexión cerrada\n');
        }
    }
}

// Ejecutar test
testConnection()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
