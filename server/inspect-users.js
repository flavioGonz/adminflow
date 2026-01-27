const { MongoClient } = require('mongodb');

async function inspectUsers() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db('adminflow');
        const users = await db.collection('users').find({}).limit(10).toArray();

        console.log('\n📊 Total de usuarios encontrados:', users.length);
        console.log('\n👥 Usuarios en la base de datos:\n');

        users.forEach((user, index) => {
            console.log(`\n--- Usuario ${index + 1} ---`);
            console.log('_id:', user._id);
            console.log('_id type:', typeof user._id);
            console.log('_id toString():', user._id?.toString());
            console.log('email:', user.email);
            console.log('name:', user.name);
            console.log('sqliteId:', user.sqliteId);
            console.log('groupId:', user.groupId);
            console.log('roles:', user.roles);
            console.log('createdAt:', user.createdAt);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

inspectUsers();
