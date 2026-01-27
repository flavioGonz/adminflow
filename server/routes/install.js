// server/routes/install.js
// Rutas para el instalador web

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { testMongoConnection, initializeMongoDB, getDatabaseStats } = require('../lib/mongoInit');
const { upsertConfig } = require('../lib/configService');
const { validateInstallation } = require('../lib/installationValidator');



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
 * GET /api/install/validate
 * Valida la integridad de la instalación existente
 */
router.get('/validate', async (req, res) => {
    try {
        const result = await validateInstallation();
        res.json({
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            valid: false,
            errors: [error.message],
            warnings: [],
            timestamp: new Date().toISOString()
        });
    }
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

            try {
                // Usar URL parser para manejo robusto de URIs
                const url = new URL(cleanUri);
                // Remover el nombre de BD del pathname si existe
                if (url.pathname && url.pathname !== '/') {
                    const pathParts = url.pathname.split('/').filter(p => p);
                    if (pathParts.length > 0 && pathParts[pathParts.length - 1] === mongoDb) {
                        pathParts.pop();
                    }
                    url.pathname = pathParts.length > 0 ? '/' + pathParts.join('/') : '';
                }
                cleanUri = url.toString().replace(/\/$/, '');
            } catch (urlError) {
                // Fallback a método simple si URL no es parseable
                if (cleanUri.includes('/' + mongoDb)) {
                    cleanUri = cleanUri.replace('/' + mongoDb, '');
                }
                if (cleanUri.endsWith('/')) {
                    cleanUri = cleanUri.slice(0, -1);
                }
            }

            console.log('📡 Cleaned URI:', cleanUri);
            console.log('🗄️  Database:', mongoDb);

            try {
                const result = await testMongoConnection(cleanUri, mongoDb);
                console.log('✅ Connection test result:', result);

                if (result.success) {
                    const stats = await getDatabaseStats(cleanUri, mongoDb);
                    result.stats = stats;
                }

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
                success: false,
                message: 'El sistema ya está instalado'
            });
        }

        const { company, database, notifications } = req.body;

        // Validar datos requeridos
        if (!company || !company.name || !company.email) {
            return res.status(400).json({
                success: false,
                message: 'Información de empresa incompleta'
            });
        }

        if (!database || !database.type) {
            return res.status(400).json({
                success: false,
                message: 'Configuración de base de datos incompleta'
            });
        }

        const logs = [];

        // 1. Configurar base de datos
        const dbConfigPath = path.join(__dirname, '../.selected-db.json');
        const dbConfig = {
            engine: database.type,
            sqlitePath: 'database/database.sqlite'
        };

        if (database.type === 'mongodb') {
            if (!database.mongoUri || !database.mongoDb) {
                return res.status(400).json({
                    success: false,
                    message: 'Configuración de MongoDB incompleta'
                });
            }

            // Limpiar URI con manejo robusto
            let cleanUri = database.mongoUri.trim();
            
            try {
                const url = new URL(cleanUri);
                if (url.pathname && url.pathname !== '/') {
                    const pathParts = url.pathname.split('/').filter(p => p);
                    if (pathParts.length > 0 && pathParts[pathParts.length - 1] === database.mongoDb) {
                        pathParts.pop();
                    }
                    url.pathname = pathParts.length > 0 ? '/' + pathParts.join('/') : '';
                }
                cleanUri = url.toString().replace(/\/$/, '');
            } catch (urlError) {
                // Fallback
                if (cleanUri.includes('/' + database.mongoDb)) {
                    cleanUri = cleanUri.replace('/' + database.mongoDb, '');
                }
                if (cleanUri.endsWith('/')) {
                    cleanUri = cleanUri.slice(0, -1);
                }
            }

            logs.push(`🔧 Configurando MongoDB: ${cleanUri}/${database.mongoDb}`);

            dbConfig.mongoUri = cleanUri;
            dbConfig.mongoDb = database.mongoDb;

            // Inicializar MongoDB
            try {
                const initResult = await initializeMongoDB(cleanUri, database.mongoDb, database.isNew, logs);

                if (!initResult.success) {
                    console.error('❌ Error al inicializar MongoDB:', initResult.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al inicializar MongoDB: ' + initResult.message,
                        logs: initResult.progress,
                    });
                }

                logs.push('✅ MongoDB inicializado correctamente');

            } catch (initError) {
                console.error('❌ Error fatal al inicializar MongoDB:', initError);
                logs.push('❌ Error fatal al inicializar MongoDB: ' + initError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error fatal al inicializar MongoDB: ' + initError.message,
                    logs,
                });
            }
        } else if (database.type === 'sqlite') {
            // ... (el código de sqlite no necesita cambios)
        }

        fs.writeFileSync(dbConfigPath, JSON.stringify(dbConfig, null, 2));
        logs.push('💾 Configuración guardada en .selected-db.json');

        // 2. Guardar información de la empresa
        await upsertConfig('company', {
            name: company.name,
            address: company.address || '',
            phone: company.phone || '',
            email: company.email
        });
        logs.push('🏢 Información de la empresa guardada');

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
            logs.push('🔔 Canales de notificación configurados');
        }

        // 4. Validar integridad antes de marcar como instalado
        try {
            // Verificar que .selected-db.json existe y es válido
            const configExists = fs.existsSync(dbConfigPath);
            if (!configExists) {
                throw new Error('Archivo de configuración no se guardó correctamente');
            }
            
            // Verificar que la configuración de empresa se guardó
            const companyConfig = await upsertConfig('company', {});
            if (!companyConfig || !companyConfig.name) {
                throw new Error('Configuración de empresa no se guardó correctamente');
            }
            
            logs.push('✅ Validación de integridad completada');
        } catch (validationError) {
            logs.push('❌ Error en validación: ' + validationError.message);
            return res.status(500).json({
                success: false,
                message: 'Error en validación de integridad: ' + validationError.message,
                logs,
            });
        }
        
        // 5. Marcar como instalado
        markAsInstalled();
        logs.push('🎉 ¡Instalación completada exitosamente!');

        res.json({
            success: true,
            message: 'Instalación completada exitosamente',
            logs,
        });

    } catch (error) {
        console.error('Error en instalación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar la instalación: ' + error.message,
            logs: [error.message]
        });
    }
});

module.exports = router;
