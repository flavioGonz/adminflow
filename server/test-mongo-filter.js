const { MongoClient } = require('mongodb');

async function testFilter() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db('adminflow');
        const collection = db.collection('users');

        console.log('🔍 Probando filtros de búsqueda...\n');

        // Test 1: Buscar por _id numérico
        console.log('Test 1: Buscar usuario con _id: 3');
        const user1 = await collection.findOne({ _id: 3 });
        console.log('Resultado:', user1 ? `✅ Encontrado: ${user1.email}` : '❌ No encontrado');

        // Test 2: Buscar por _id como string "3"
        console.log('\nTest 2: Buscar usuario con _id: "3" (string)');
        const user2 = await collection.findOne({ _id: "3" });
        console.log('Resultado:', user2 ? `✅ Encontrado: ${user2.email}` : '❌ No encontrado');

        // Test 3: Listar todos los usuarios y sus _id
        console.log('\n📋 Listado de todos los usuarios:');
        const allUsers = await collection.find({}).toArray();
        allUsers.forEach(u => {
            console.log(`- ${u.email}: _id=${u._id} (tipo: ${typeof u._id})`);
        });

        // Test 4: Intentar actualizar usuario con _id numérico
        console.log('\n📝 Test 4: Actualizar usuario con _id: 3');
        const result = await collection.findOneAndUpdate(
            { _id: 3 },
            { $set: { testField: 'prueba', updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        console.log('Resultado:', result.value ? `✅ Actualizado: ${result.value.email}` : '❌ No actualizado');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

testFilter();
