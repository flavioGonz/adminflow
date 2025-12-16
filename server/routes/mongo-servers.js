/**
 * API Routes para gestionar servidores MongoDB
 */

const express = require('express');
const router = express.Router();
const { getMongoServerManager } = require('../lib/mongoServerManager');
const { initMongo, closeMongoConnection } = require('../lib/mongoClient');

/**
 * GET /api/mongo-servers
 * Obtiene la lista de todos los servidores configurados
 */
router.get('/', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const servers = manager.getServers();
        const current = manager.getCurrentServer();

        res.json({
            success: true,
            servers: servers,
            currentServer: current
        });
    } catch (error) {
        console.error('Error al obtener servidores:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mongo-servers/status
 * Obtiene el estado de todos los servidores (incluye conexión y colecciones)
 */
router.get('/status', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const status = await manager.getServersStatus();

        res.json({
            success: true,
            status: status
        });
    } catch (error) {
        console.error('Error al obtener estado de servidores:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mongo-servers/:id
 * Obtiene un servidor específico
 */
router.get('/:id', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const server = manager.getServer(req.params.id);

        if (!server) {
            return res.status(404).json({
                success: false,
                error: 'Servidor no encontrado'
            });
        }

        res.json({
            success: true,
            server: server
        });
    } catch (error) {
        console.error('Error al obtener servidor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/mongo-servers
 * Crea un nuevo servidor
 */
router.post('/', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const server = manager.addServer(req.body);

        res.status(201).json({
            success: true,
            server: server,
            message: 'Servidor creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear servidor:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/mongo-servers/:id
 * Actualiza un servidor existente
 */
router.put('/:id', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const server = manager.updateServer(req.params.id, req.body);

        res.json({
            success: true,
            server: server,
            message: 'Servidor actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar servidor:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/mongo-servers/:id
 * Elimina un servidor
 */
router.delete('/:id', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const deleted = manager.removeServer(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Servidor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Servidor eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar servidor:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/mongo-servers/:id/test
 * Prueba la conexión a un servidor
 */
router.post('/:id/test', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const result = await manager.testConnection(req.params.id);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error al probar conexión:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/mongo-servers/:id/switch
 * Cambia al servidor especificado
 * Body: { autoCreate: boolean, forceCreate: boolean }
 */
router.post('/:id/switch', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const options = {
            autoCreate: req.body.autoCreate !== false, // Por defecto true
            forceCreate: req.body.forceCreate === true  // Por defecto false
        };

        const result = await manager.switchToServer(req.params.id, options);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Reconectar el cliente de MongoDB con el nuevo servidor
        const server = result.server;
        await closeMongoConnection();
        await initMongo({ uri: server.uri, dbName: server.database });

        res.json({
            ...result,
            message: 'Servidor cambiado exitosamente. La aplicación está ahora conectada al nuevo servidor.'
        });
    } catch (error) {
        console.error('Error al cambiar servidor:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            log: [`❌ Error: ${error.message}`]
        });
    }
});

/**
 * POST /api/mongo-servers/:id/verify
 * Verifica las colecciones de un servidor sin cambiar a él
 */
router.post('/:id/verify', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const server = manager.getServer(req.params.id);

        if (!server) {
            return res.status(404).json({
                success: false,
                error: 'Servidor no encontrado'
            });
        }

        const { MongoClient } = require('mongodb');
        const client = new MongoClient(server.uri, {
            serverSelectionTimeoutMS: 5000,
        });

        await client.connect();
        const verification = await manager.verifyCollections(client, server.database);
        await client.close();

        res.json({
            success: true,
            server: {
                id: server.id,
                name: server.name,
                host: server.host,
                database: server.database
            },
            verification: verification
        });
    } catch (error) {
        console.error('Error al verificar colecciones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/mongo-servers/:id/create-collections
 * Crea las colecciones faltantes en un servidor
 */
router.post('/:id/create-collections', async (req, res) => {
    try {
        const manager = getMongoServerManager();
        const server = manager.getServer(req.params.id);

        if (!server) {
            return res.status(404).json({
                success: false,
                error: 'Servidor no encontrado'
            });
        }

        const { MongoClient } = require('mongodb');
        const client = new MongoClient(server.uri, {
            serverSelectionTimeoutMS: 5000,
        });

        await client.connect();
        
        // Verificar qué colecciones faltan
        const verification = await manager.verifyCollections(client, server.database);
        
        if (verification.missing.length === 0) {
            await client.close();
            return res.json({
                success: true,
                message: 'Todas las colecciones ya existen',
                verification: verification
            });
        }

        // Crear colecciones faltantes
        const result = await manager.createMissingCollections(
            client,
            server.database,
            verification.missing
        );

        await client.close();

        res.json({
            success: true,
            message: `${result.created.length} colecciones creadas`,
            created: result.created,
            errors: result.errors,
            verification: verification
        });
    } catch (error) {
        console.error('Error al crear colecciones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
