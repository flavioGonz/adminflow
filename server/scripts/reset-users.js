const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

async function resetUsers() {
    // Usar la URL específica proporcionada
    const url = 'mongodb://crm.infratec.com.uy:29999/adminflow';
    const client = new MongoClient(url);

    try {
        console.log("⏳ Conectando a MongoDB...");
        await client.connect();
        console.log("✅ Conectado.");

        const db = client.db('adminflow');
        const usersCollection = db.collection('users');

        // 1. Borrar todos los usuarios existentes
        const deleteResult = await usersCollection.deleteMany({});
        console.log(`🗑️ Usuarios eliminados: ${deleteResult.deletedCount}`);

        // 2. Crear contraseña hasheada (123456)
        const hashedPassword = await bcrypt.hash('123456', 10);

        // 3. Definir usuarios nuevos
        const newUsers = [
            {
                _id: new ObjectId(),
                email: 'admin@adminflow.com',
                password: hashedPassword,
                name: 'Administrador',
                phone: '+555 123 456',
                roles: ['admin'],
                status: 'active',
                group: null,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                email: 'soporte@adminflow.com',
                password: hashedPassword,
                name: 'Soporte Técnico',
                phone: '+555 987 654',
                roles: ['support'],
                status: 'active',
                group: null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // 4. Insertar
        const insertResult = await usersCollection.insertMany(newUsers);
        console.log(`✨ Usuarios creados: ${insertResult.insertedCount}`);
        console.log("------------------------------------------------");
        console.log("👤 Usuario 1: admin@adminflow.com / 123456");
        console.log("👤 Usuario 2: soporte@adminflow.com / 123456");
        console.log("------------------------------------------------");

    } catch (e) {
        console.error("❌ Error:", e.message);
        if (e.message.includes('ECONNREFUSED')) {
            console.error("💡 PISTA: Parece que MongoDB no está corriendo en localhost:27017");
        }
    } finally {
        await client.close();
    }
}

resetUsers();
