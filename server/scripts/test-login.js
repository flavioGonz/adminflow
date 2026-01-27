const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function testLogin() {
    let mongoUri = "mongodb://localhost:27017";
    let mongoDbName = "adminflow";

    const configPath = path.resolve(__dirname, '..', '.selected-db.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.mongoUri) mongoUri = config.mongoUri;
        if (config.mongoDb) mongoDbName = config.mongoDb;
    }

    const testEmail = "admin@adminflow.uy";
    const testPassword = "admin";

    console.log(`\n🔍 Probando login para: ${testEmail}`);
    console.log(`Conectando a ${mongoUri}...`);

    const client = await MongoClient.connect(mongoUri);
    const db = client.db(mongoDbName);

    const user = await db.collection('users').findOne({ email: testEmail });

    if (!user) {
        console.log(`❌ Usuario NO encontrado en la base de datos`);
        await client.close();
        return;
    }

    console.log(`✅ Usuario encontrado:`);
    console.log(`   _id: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role || user.roles || 'N/A'}`);
    console.log(`   Password hash exists: ${!!user.password}`);

    if (!user.password) {
        console.log(`❌ El usuario NO tiene contraseña configurada`);
        await client.close();
        return;
    }

    console.log(`\n🔐 Verificando contraseña...`);
    const isValid = await bcrypt.compare(testPassword, user.password);

    if (isValid) {
        console.log(`✅ ¡Contraseña CORRECTA!`);
        console.log(`\n📋 Credenciales válidas:`);
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
    } else {
        console.log(`❌ Contraseña INCORRECTA`);
        console.log(`   Hash almacenado: ${user.password.substring(0, 30)}...`);
    }

    await client.close();
}

testLogin().catch(console.error);
