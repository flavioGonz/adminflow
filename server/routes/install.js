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

            const result = await testMongoConnection(mongoUri, mongoDb);
            return res.json(result);
        }

        res.status(400).json({
            success: false,
            message: 'Tipo de base de datos no válido'
        });
    } catch (error) {
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

            dbConfig.mongoUri = database.mongoUri;
            dbConfig.mongoDb = database.mongoDb;

            // Inicializar MongoDB
            const initResult = await initializeMongoDB(database.mongoUri, database.mongoDb);

            if (!initResult.success) {
                return res.status(500).json({
                    error: 'Error al inicializar MongoDB: ' + initResult.message
                });
            }
        }

        fs.writeFileSync(dbConfigPath, JSON.stringify(dbConfig, null, 2));

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
