// server/routes/install.js
// Rutas para el instalador web

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { testMongoConnection, initializeMongoDB } = require('../lib/mongoInit');
const { upsertConfig } = require('../lib/configService');

// Archivo que marca si la instalación está completa
const INSTALL_LOCK_FILE = path.join(__dirname, '../.installed');

/**
 * Verifica si el sistema ya está instalado
 */
function isInstalled() {
    return fs.existsSync(INSTALL_LOCK_FILE);
}

/**
 * Marca el sistema como instalado
 */
function markAsInstalled() {
    fs.writeFileSync(INSTALL_LOCK_FILE, JSON.stringify({
        installedAt: new Date().toISOString(),
        version: '1.0.0'
    }));
}

/**
 * GET /api/install/status
 * Verifica si el sistema ya está instalado
 */
router.get('/status', (req, res) => {
    res.json({ installed: isInstalled() });
});

/**
 * POST /api/install/test-db
 * Prueba la conexión a la base de datos
 */
router.post('/test-db', async (req, res) => {
    try {
        const { type, mongoUri, mongoDb } = req.body;

        console.log('🔍 Testing database connection:', { type, mongoUri, mongoDb });

        if (type === 'sqlite') {
            // SQLite siempre funciona
            return res.json({
                success: true,
                message: 'SQLite está listo para usar'
            });
        }

        if (type === 'mongodb') {
            if (!mongoUri || !mongoDb) {
                return res.status(400).json({
                    success: false,
                    message: 'URI y nombre de base de datos son requeridos'
                });
            }

            // Limpiar la URI si tiene el nombre de BD al final
            let cleanUri = mongoUri.trim();

            // Si la URI termina con /nombreBD, quitarlo
            if (cleanUri.includes('/' + mongoDb)) {
                cleanUri = cleanUri.replace('/' + mongoDb, '');
            }

            // Si termina con /, quitarlo
            if (cleanUri.endsWith('/')) {
                cleanUri = cleanUri.slice(0, -1);
            }

            console.log('📡 Cleaned URI:', cleanUri);
            console.log('🗄️  Database:', mongoDb);

            try {
                const result = await testMongoConnection(cleanUri, mongoDb);
                console.log('✅ Connection test result:', result);
                return res.json(result);
            } catch (testError) {
                console.error('❌ Connection test error:', testError);
                return res.json({
                    success: false,
                    message: testError.message || 'Error al conectar con MongoDB'
                });
            }
        }

        res.status(400).json({
            success: false,
            message: 'Tipo de base de datos no válido'
        });
    } catch (error) {
        console.error('❌ Fatal error in test-db:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/install/complete
 * Completa la instalación del sistema
 */
router.post('/complete', async (req, res) => {
    try {
        // Verificar que no esté ya instalado
        if (isInstalled()) {
            return res.status(400).json({
                error: 'El sistema ya está instalado'
            });
        }

        const { company, database, notifications } = req.body;

        // Validar datos requeridos
        if (!company || !company.name || !company.email) {
            return res.status(400).json({
                error: 'Información de empresa incompleta'
            });
        }

        if (!database || !database.type) {
            return res.status(400).json({
                error: 'Configuración de base de datos incompleta'
            });
        }

        // 1. Configurar base de datos
        const dbConfigPath = path.join(__dirname, '../.selected-db.json');
        const dbConfig = {
            engine: database.type,
            sqlitePath: 'database/database.sqlite'
        };

        if (database.type === 'mongodb') {
            if (!database.mongoUri || !database.mongoDb) {
                return res.status(400).json({
                    error: 'Configuración de MongoDB incompleta'
                });
            }

            // Limpiar URI
            let cleanUri = database.mongoUri.trim();
            if (cleanUri.includes('/' + database.mongoDb)) {
                cleanUri = cleanUri.replace('/' + database.mongoDb, '');
            }
            if (cleanUri.endsWith('/')) {
                cleanUri = cleanUri.slice(0, -1);
            }

            console.log('🔧 Configurando MongoDB:', { cleanUri, mongoDb: database.mongoDb });

            dbConfig.mongoUri = cleanUri;
            dbConfig.mongoDb = database.mongoDb;

            // Inicializar MongoDB
            try {
                const initResult = await initializeMongoDB(cleanUri, database.mongoDb);

                if (!initResult.success) {
                    console.error('❌ Error al inicializar MongoDB:', initResult.message);
                    return res.status(500).json({
                        error: 'Error al inicializar MongoDB: ' + initResult.message
                    });
                }

                console.log('✅ MongoDB inicializado correctamente');
            } catch (initError) {
                console.error('❌ Error fatal al inicializar MongoDB:', initError);
                return res.status(500).json({
                    error: 'Error fatal al inicializar MongoDB: ' + initError.message
                });
            }
        } else if (database.type === 'sqlite') {
            // Crear directorio de base de datos si no existe
            const dbDir = path.join(__dirname, '../database');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                console.log('✅ Directorio de base de datos creado');
            }

            // Crear base de datos SQLite
            const sqlite3 = require('sqlite3').verbose();
            const dbPath = path.join(dbDir, 'database.sqlite');

            console.log('🔧 Creando base de datos SQLite en:', dbPath);

            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        console.error('❌ Error al crear SQLite:', err);
                        return reject(err);
                    }
                });

                // Crear tablas básicas
                db.serialize(() => {
                    // Tabla de usuarios
                    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            role TEXT DEFAULT 'user',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

                    // Tabla de clientes
                    db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

                    // Tabla de tickets
                    db.run(`CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'open',
            priority TEXT DEFAULT 'medium',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clientId) REFERENCES clients(id)
          )`);

                    // Tabla de contratos
                    db.run(`CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clientId) REFERENCES clients(id)
          )`);

                    // Usuario admin por defecto
                    const bcrypt = require('bcrypt');
                    const adminPassword = bcrypt.hashSync('admin', 10);

                    db.run(`INSERT OR IGNORE INTO users (id, email, password, name, role) 
                  VALUES (1, 'admin@adminflow.uy', ?, 'Administrador', 'admin')`,
                        [adminPassword], (err) => {
                            if (err) {
                                console.error('❌ Error al crear usuario admin:', err);
                            } else {
                                console.log('✅ Usuario admin creado');
                            }
                        });
                });

                db.close((err) => {
                    if (err) {
                        console.error('❌ Error al cerrar SQLite:', err);
                        reject(err);
                    } else {
                        console.log('✅ Base de datos SQLite creada correctamente');
                        resolve();
                    }
                });
            }).catch(err => {
                return res.status(500).json({
                    error: 'Error al crear base de datos SQLite: ' + err.message
                });
            });
        }

        fs.writeFileSync(dbConfigPath, JSON.stringify(dbConfig, null, 2));
        console.log('✅ Configuración guardada en .selected-db.json');

        // 2. Guardar información de la empresa
        await upsertConfig('company', {
            name: company.name,
            address: company.address || '',
            phone: company.phone || '',
            email: company.email
        });

        // 3. Configurar notificaciones
        if (notifications && notifications.length > 0) {
            const notifConfig = {
                channels: {}
            };

            for (const channel of notifications) {
                notifConfig.channels[channel.id] = {
                    enabled: true,
                    ...channel.config
                };
            }

            await upsertConfig('notifications', notifConfig);
        }

        // 4. Marcar como instalado
        markAsInstalled();

        res.json({
            success: true,
            message: 'Instalación completada exitosamente'
        });

    } catch (error) {
        console.error('Error en instalación:', error);
        res.status(500).json({
            error: 'Error al completar la instalación: ' + error.message
        });
    }
});

module.exports = router;
