const { MongoClient, ObjectId } = require('mongodb');

async function migrateUsers() {
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');

        const db = client.db('adminflow');
        const usersCollection = db.collection('users');

        // Obtener todos los usuarios
        const allUsers = await usersCollection.find({}).toArray();
        console.log(`📊 Total de usuarios encontrados: ${allUsers.length}\n`);

        // Separar usuarios por tipo de _id
        const numericUsers = allUsers.filter(u => typeof u._id === 'number');
        const objectIdUsers = allUsers.filter(u => typeof u._id === 'object');

        console.log(`🔢 Usuarios con _id numérico: ${numericUsers.length}`);
        console.log(`🆔 Usuarios con ObjectId: ${objectIdUsers.length}\n`);

        if (numericUsers.length === 0) {
            console.log('✅ Todos los usuarios ya tienen ObjectId. No se requiere migración.');
            return;
        }

        console.log('🔄 Iniciando migración...\n');

        // Crear colección temporal para backup
        const backupCollection = db.collection('users_backup_' + Date.now());
        await backupCollection.insertMany(allUsers);
        console.log(`💾 Backup creado en: ${backupCollection.collectionName}\n`);

        // Migrar cada usuario numérico
        for (const user of numericUsers) {
            const oldId = user._id;
            const newId = new ObjectId();

            // Crear nuevo documento con ObjectId
            const newUser = {
                ...user,
                _id: newId,
                oldNumericId: oldId, // Guardar el ID antiguo por si acaso
                migratedAt: new Date()
            };

            // Eliminar el usuario antiguo
            await usersCollection.deleteOne({ _id: oldId });

            // Insertar el nuevo usuario
            await usersCollection.insertOne(newUser);

            console.log(`✅ Migrado: ${user.email}`);
            console.log(`   Antiguo ID: ${oldId} → Nuevo ID: ${newId}\n`);
        }

        console.log('\n🎉 Migración completada exitosamente!');
        console.log(`📋 Usuarios migrados: ${numericUsers.length}`);
        console.log(`💾 Backup disponible en: ${backupCollection.collectionName}`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await client.close();
        console.log('\n✅ Conexión cerrada');
    }
}

migrateUsers();
