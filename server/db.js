const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { getMongoDb } = require('./lib/mongoClient');

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@adminflow.uy";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "admin";

let dbInstance = null;

const dbDir = path.resolve(__dirname, 'database');
const dbPath = path.resolve(dbDir, 'database.sqlite');

/**
 * Ensures that a default admin user exists in MongoDB
 */
const ensureDefaultAdmin = async () => {
  try {
    const mongoDb = getMongoDb();
    if (!mongoDb) {
      console.warn('⚠️ MongoDB no está conectado, no se puede verificar admin por defecto');
      return;
    }

    const existingAdmin = await mongoDb.collection('users').findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`✅ Usuario admin por defecto ya existe: ${DEFAULT_ADMIN_EMAIL}`);
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    await mongoDb.collection('users').insertOne({
      email: DEFAULT_ADMIN_EMAIL,
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Usuario admin por defecto creado: ${DEFAULT_ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ Error al crear usuario admin por defecto:', error.message);
  }
};

/**
 * Initialize SQLite database (temporary - for backward compatibility)
 */
const initDB = async () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      ensureDefaultAdmin().then(() => resolve(dbInstance)).catch(reject);
      return;
    }

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        reject(err);
      } else {
        console.log('✅ SQLite conectado (modo compatibilidad)');
        dbInstance = db;

        try {
          await ensureDefaultAdmin();
          resolve(db);
        } catch (adminError) {
          console.error('Error ensuring default admin:', adminError);
          resolve(db); // Continue even if admin creation fails
        }
      }
    });
  });
};

// Real db proxy that works with SQLite
const dbProxy = new Proxy({}, {
  get: (target, prop) => {
    if (!dbInstance) {
      console.warn(`⚠️ Attempted to access db.${String(prop)} before initialization`);
      return () => {
        throw new Error('Database not initialized. Call initDB() first.');
      };
    }
    const value = dbInstance[prop];
    return typeof value === 'function' ? value.bind(dbInstance) : value;
  }
});

module.exports = {
  db: dbProxy,
  initDB,
  ensureDefaultAdmin
};
