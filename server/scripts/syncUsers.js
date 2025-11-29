const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = path.join(__dirname, '../database.sqlite');
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'adminflow';

const syncUsers = async () => {
    console.log('Iniciando sincronización de usuarios...');

    // 1. Conectar a SQLite
    const sqliteDb = new sqlite3.Database(dbPath);

    // 2. Conectar a MongoDB
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // 3. Obtener usuarios de SQLite
    sqliteDb.all('SELECT * FROM users', async (err, sqliteUsers) => {
        if (err) {
            console.error('Error leyendo SQLite:', err);
            process.exit(1);
        }

        console.log(`Encontrados ${sqliteUsers.length} usuarios en SQLite.`);

        for (const user of sqliteUsers) {
            const { id, email, password, name, avatar, role } = user;

            // Determinar roles (si SQLite tiene columna role, usarla, sino default)
            const roles = role ? [role] : ['viewer'];
            // Nota: Si tu SQLite no tiene columna 'role', ajusta esto. 
            // Asumimos que los usuarios antiguos al menos deberían ser 'viewer' o 'admin' si es el primero.

            const updateDoc = {
                $set: {
                    email,
                    name: name || email.split('@')[0],
                    avatar,
                    updatedAt: new Date(),
                    // Si password existe en SQLite y queremos mantenerlo sincronizado (opcional)
                    // password: password 
                },
                $setOnInsert: {
                    sqliteId: id,
                    createdAt: new Date(),
                    roles: roles,
                    metadata: {}
                }
            };

            // Intentar encontrar por sqliteId o email
            await usersCollection.updateOne(
                { $or: [{ sqliteId: id }, { email: email }] },
                updateDoc,
                { upsert: true }
            );

            console.log(`Usuario sincronizado: ${email} (SQLite ID: ${id})`);
        }

        console.log('Sincronización completada.');
        await client.close();
        sqliteDb.close();
    });
};

syncUsers().catch(console.error);
