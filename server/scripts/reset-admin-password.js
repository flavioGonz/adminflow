const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function resetAdminPassword() {
    let mongoUri = "mongodb://localhost:27017";
    let mongoDbName = "adminflow";

    const configPath = path.resolve(__dirname, '..', '.selected-db.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.mongoUri) mongoUri = config.mongoUri;
        if (config.mongoDb) mongoDbName = config.mongoDb;
    }

    const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@adminflow.uy";
    const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin";

    console.log(`Conectando a ${mongoUri}...`);
    const client = await MongoClient.connect(mongoUri);
    const db = client.db(mongoDbName);

    const existingAdmin = await db.collection('users').findOne({ email: DEFAULT_ADMIN_EMAIL });

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    if (existingAdmin) {
        console.log(`\n✅ Usuario admin encontrado: ${DEFAULT_ADMIN_EMAIL}`);
        console.log(`   Actualizando contraseña...`);

        await db.collection('users').updateOne(
            { email: DEFAULT_ADMIN_EMAIL },
            {
                $set: {
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Contraseña actualizada exitosamente`);
    } else {
        console.log(`\n⚠️  Usuario admin NO encontrado. Creando...`);

        await db.collection('users').insertOne({
            email: DEFAULT_ADMIN_EMAIL,
            password: hashedPassword,
            name: 'Administrator',
            role: 'admin',
            roles: ['admin'],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`✅ Usuario admin creado exitosamente`);
    }

    console.log(`\n📋 Credenciales:`);
    console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);

    await client.close();
}

resetAdminPassword().catch(console.error);
