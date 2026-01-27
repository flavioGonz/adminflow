/**
 * MongoDB Server Manager
 * Gestiona múltiples servidores MongoDB y permite cambiar entre ellos
 * con verificación y creación automática de colecciones
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Colecciones requeridas en el sistema
const REQUIRED_COLLECTIONS = [
    'users',
    'clients',
    'tickets',
    'budgets',
    'budget_items',
    'contracts',
    'payments',
    'products',
    'client_accesses',
    'client_diagrams',
    'client_implementations',
    'calendar_events',
    'groups',
    'notifications',
    'configurations',
    'audit_logs',
    'counters'
];

// Índices para cada colección
const COLLECTION_INDEXES = {
    users: [
        { key: { email: 1 }, unique: true },
        { key: { createdAt: -1 } }
    ],
    clients: [
        { key: { email: 1 }, unique: true, sparse: true },
        { key: { name: 1 } },
        { key: { alias: 1 } },
        { key: { contract: 1 } },
        { key: { createdAt: -1 } }
    ],
    tickets: [
        { key: { clientId: 1 } },
        { key: { status: 1 } },
        { key: { priority: 1 } },
        { key: { createdAt: -1 } },
        { key: { clientId: 1, status: 1 } }
    ],
    budgets: [
        { key: { clientId: 1 } },
        { key: { status: 1 } },
        { key: { createdAt: -1 } }
    ],
    budget_items: [
        { key: { budgetId: 1 } },
        { key: { productId: 1 } }
    ],
    contracts: [
        { key: { clientId: 1 } },
        { key: { status: 1 } },
        { key: { startDate: 1 } },
        { key: { endDate: 1 } }
    ],
    payments: [
        { key: { clientId: 1 } },
        { key: { ticketId: 1 } },
        { key: { status: 1 } },
        { key: { createdAt: -1 } }
    ],
    products: [
        { key: { name: 1 } },
        { key: { category: 1 } },
        { key: { manufacturer: 1 } }
    ],
    client_accesses: [
        { key: { clientId: 1 } },
        { key: { tipo_equipo: 1 } },
        { key: { createdAt: -1 } }
    ],
    calendar_events: [
        { key: { start: 1 } },
        { key: { sourceType: 1, sourceId: 1 } }
    ],
    groups: [
        { key: { slug: 1 }, unique: true },
        { key: { name: 1 } }
    ],
    notifications: [
        { key: { event: 1 } },
        { key: { createdAt: -1 } }
    ],
    configurations: [
        { key: { module: 1 }, unique: true }
    ],
    audit_logs: [
        { key: { user: 1 } },
        { key: { action: 1 } },
        { key: { resource: 1 } },
        { key: { createdAt: -1 } }
    ]
};

class MongoServerManager {
    constructor() {
        this.servers = new Map();
        this.currentServer = null;
        this.configFile = path.join(__dirname, '../config/mongo-servers.json');
        this.loadServers();
    }

    /**
     * Carga la configuración de servidores desde el archivo JSON
     */
    loadServers() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf8');
                const config = JSON.parse(data);

                if (config.servers && Array.isArray(config.servers)) {
                    config.servers.forEach(server => {
                        this.servers.set(server.id, server);
                    });
                }

                this.currentServer = config.currentServer || null;
                console.log(`✅ Configuración de servidores cargada: ${this.servers.size} servidor(es)`);
            } else {
                // Crear archivo de configuración por defecto
                this.createDefaultConfig();
            }
        } catch (error) {
            console.error('❌ Error al cargar configuración de servidores:', error.message);
            this.createDefaultConfig();
        }
    }

    /**
     * Crea un archivo de configuración por defecto
     */
    createDefaultConfig() {
        const defaultConfig = {
            currentServer: 'local',
            servers: [
                {
                    id: 'local',
                    name: 'Local Development',
                    host: 'localhost',
                    port: 27017,
                    database: 'adminflow',
                    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
                    active: true,
                    description: 'Servidor MongoDB local',
                    role: 'primary'
                }
            ]
        };

        try {
            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
            console.log('✅ Archivo de configuración creado:', this.configFile);

            this.servers.set('local', defaultConfig.servers[0]);
            this.currentServer = 'local';
        } catch (error) {
            console.error('❌ Error al crear configuración por defecto:', error.message);
        }
    }

    /**
     * Guarda la configuración actual en el archivo
     */
    saveConfig() {
        try {
            const config = {
                currentServer: this.currentServer,
                servers: Array.from(this.servers.values())
            };

            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            console.log('✅ Configuración guardada correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error al guardar configuración:', error.message);
            return false;
        }
    }

    /**
     * Obtiene todos los servidores configurados
     */
    getServers() {
        return Array.from(this.servers.values());
    }

    /**
     * Obtiene un servidor por ID
     */
    getServer(serverId) {
        return this.servers.get(serverId);
    }

    /**
     * Obtiene el servidor actual
     */
    getCurrentServer() {
        if (this.currentServer) {
            return this.servers.get(this.currentServer);
        }
        return null;
    }

    /**
     * Agrega un nuevo servidor
     */
    addServer(serverConfig) {
        if (!serverConfig.id) {
            throw new Error('El servidor debe tener un ID');
        }

        if (this.servers.has(serverConfig.id)) {
            throw new Error('Ya existe un servidor con ese ID');
        }

        const server = {
            id: serverConfig.id,
            name: serverConfig.name || serverConfig.id,
            host: serverConfig.host || 'localhost',
            port: serverConfig.port || 27017,
            database: serverConfig.database || 'adminflow',
            uri: serverConfig.uri,
            username: serverConfig.username,
            password: serverConfig.password,
            active: serverConfig.active !== false,
            description: serverConfig.description || '',
            role: serverConfig.role || 'secondary'
        };

        // If no other primary exists, promote this one
        const hasPrimary = Array.from(this.servers.values()).some((s) => s.role === 'primary');
        if (!hasPrimary) {
            server.role = 'primary';
        }

        // Construir URI si no se proporciona
        if (!server.uri) {
            if (server.username && server.password) {
                server.uri = `mongodb://${server.username}:${server.password}@${server.host}:${server.port}`;
            } else {
                server.uri = `mongodb://${server.host}:${server.port}`;
            }
        }

        this.servers.set(server.id, server);
        this.saveConfig();

        return server;
    }

    /**
     * Actualiza un servidor existente
     */
    updateServer(serverId, updates) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error('Servidor no encontrado');
        }

        Object.assign(server, updates);

        // Reconstruir URI si cambió host, port, username o password
        if (updates.host || updates.port || updates.username || updates.password) {
            if (server.username && server.password) {
                server.uri = `mongodb://${server.username}:${server.password}@${server.host}:${server.port}`;
            } else {
                server.uri = `mongodb://${server.host}:${server.port}`;
            }
        }

        // If a role is set to primary, demote others
        if (updates.role === 'primary') {
            for (const [, s] of this.servers) {
                if (s.id !== serverId) {
                    s.role = 'secondary';
                }
            }
        }

        this.saveConfig();
        return server;
    }

    /**
     * Establece un servidor como primario y actual
     */
    setPrimary(serverId) {
        if (!this.servers.has(serverId)) {
            throw new Error('Servidor no encontrado');
        }

        for (const [id, srv] of this.servers) {
            srv.role = id === serverId ? 'primary' : 'secondary';
        }

        this.currentServer = serverId;
        this.saveConfig();

        return this.servers.get(serverId);
    }

    /**
     * Elimina un servidor
     */
    removeServer(serverId) {
        if (this.currentServer === serverId) {
            throw new Error('No se puede eliminar el servidor activo. Cambie a otro servidor primero.');
        }

        const deleted = this.servers.delete(serverId);
        if (deleted) {
            this.saveConfig();
        }
        return deleted;
    }

    /**
     * Prueba la conexión a un servidor
     */
    async testConnection(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error('Servidor no encontrado');
        }

        let client;
        try {
            client = new MongoClient(server.uri, {
                serverSelectionTimeoutMS: 5000,
            });

            await client.connect();
            const db = client.db(server.database);

            // Verificar que podemos acceder a la base de datos
            await db.admin().ping();

            // Obtener información del servidor
            const serverInfo = await db.admin().serverInfo();

            return {
                success: true,
                message: 'Conexión exitosa',
                serverInfo: {
                    version: serverInfo.version,
                    uptime: serverInfo.uptime,
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error.toString()
            };
        } finally {
            if (client) {
                await client.close();
            }
        }
    }

    /**
     * Verifica que todas las colecciones requeridas existan
     */
    async verifyCollections(client, database) {
        const db = client.db(database);
        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map(c => c.name);

        const missing = REQUIRED_COLLECTIONS.filter(col => !existingNames.includes(col));

        return {
            existing: existingNames,
            missing: missing,
            required: REQUIRED_COLLECTIONS,
            total: existingNames.length,
            complete: missing.length === 0
        };
    }

    /**
     * Crea las colecciones faltantes
     */
    async createMissingCollections(client, database, missingCollections) {
        const db = client.db(database);
        const created = [];
        const errors = [];

        for (const collectionName of missingCollections) {
            try {
                // Crear colección
                await db.createCollection(collectionName);
                console.log(`  ✅ Colección creada: ${collectionName}`);

                // Crear índices si existen para esta colección
                if (COLLECTION_INDEXES[collectionName]) {
                    await this.createIndexes(db, collectionName);
                }

                created.push(collectionName);
            } catch (error) {
                console.error(`  ❌ Error al crear ${collectionName}:`, error.message);
                errors.push({
                    collection: collectionName,
                    error: error.message
                });
            }
        }

        return { created, errors };
    }

    /**
     * Crea índices para una colección
     */
    async createIndexes(db, collectionName) {
        const collection = db.collection(collectionName);
        const indexes = COLLECTION_INDEXES[collectionName];

        if (!indexes) return;

        for (const index of indexes) {
            try {
                const options = { ...index };
                delete options.key;
                await collection.createIndex(index.key, options);
            } catch (error) {
                // Ignorar errores de índices duplicados
                if (!error.message.includes('already exists')) {
                    console.error(`  ⚠️  Error al crear índice en ${collectionName}:`, error.message);
                }
            }
        }
    }

    /**
     * Cambia al servidor especificado después de verificar/crear colecciones
     */
    async switchToServer(serverId, options = {}) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error('Servidor no encontrado');
        }

        const { autoCreate = true, forceCreate = false } = options;

        let client;
        const log = [];

        try {
            log.push(`🔄 Conectando a servidor: ${server.name} (${server.host}:${server.port})`);

            // Conectar al servidor
            client = new MongoClient(server.uri, {
                serverSelectionTimeoutMS: 10000,
            });

            await client.connect();
            log.push(`✅ Conexión establecida`);

            // Verificar colecciones
            log.push(`📋 Verificando colecciones en base de datos: ${server.database}`);
            const verification = await this.verifyCollections(client, server.database);

            log.push(`  📊 Total de colecciones: ${verification.total}`);
            log.push(`  ✅ Colecciones requeridas presentes: ${verification.required.length - verification.missing.length}`);

            if (verification.missing.length > 0) {
                log.push(`  ⚠️  Colecciones faltantes: ${verification.missing.length}`);
                verification.missing.forEach(col => {
                    log.push(`    - ${col}`);
                });

                if (autoCreate) {
                    log.push(`🔧 Creando colecciones faltantes...`);
                    const result = await this.createMissingCollections(
                        client,
                        server.database,
                        verification.missing
                    );

                    log.push(`  ✅ Colecciones creadas: ${result.created.length}`);
                    if (result.errors.length > 0) {
                        log.push(`  ❌ Errores: ${result.errors.length}`);
                        result.errors.forEach(err => {
                            log.push(`    - ${err.collection}: ${err.error}`);
                        });
                    }

                    // Verificar nuevamente
                    const newVerification = await this.verifyCollections(client, server.database);
                    if (!newVerification.complete) {
                        throw new Error('No se pudieron crear todas las colecciones requeridas');
                    }
                } else {
                    throw new Error('El servidor no tiene todas las colecciones requeridas');
                }
            }

            // Todo correcto, cambiar servidor actual
            this.setPrimary(serverId);

            log.push(`✅ Servidor cambiado exitosamente a: ${server.name}`);

            // Cerrar conexión de prueba
            await client.close();

            return {
                success: true,
                server: server,
                verification: verification,
                log: log
            };

        } catch (error) {
            log.push(`❌ Error: ${error.message}`);

            if (client) {
                await client.close();
            }

            return {
                success: false,
                error: error.message,
                log: log
            };
        }
    }

    /**
     * Obtiene el estado de todos los servidores
     */
    async getServersStatus() {
        const status = [];

        // Map over servers and process in parallel
        const promises = Array.from(this.servers.entries()).map(async ([id, server]) => {
            const isCurrent = id === this.currentServer;
            let connectionStatus = 'offline';
            let collections = null;
            let serverInfo = null;

            let client = null;
            try {
                client = new MongoClient(server.uri, {
                    serverSelectionTimeoutMS: 3000, // Shorter timeout for status check
                    connectTimeoutMS: 3000
                });

                await client.connect();
                connectionStatus = 'online';

                const db = client.db(server.database);

                // Get server info
                const adminDb = db.admin();
                const info = await adminDb.serverInfo();
                serverInfo = {
                    version: info.version,
                    uptime: info.uptime,
                };

                // Verify collections
                collections = await this.verifyCollections(client, server.database);
            } catch (error) {
                console.error(`[MongoServerManager] Error checking status for ${id}:`, error.message);
                connectionStatus = 'error';
            } finally {
                if (client) {
                    await client.close().catch(() => { });
                }
            }

            return {
                id: id,
                name: server.name,
                host: server.host,
                port: server.port,
                database: server.database,
                active: server.active,
                role: server.role || (isCurrent ? 'primary' : 'secondary'),
                current: isCurrent,
                connectionStatus: connectionStatus,
                collections: collections,
                serverInfo: serverInfo,
                description: server.description
            };
        });

        return await Promise.all(promises);
    }
}

// Singleton
let managerInstance = null;

function getMongoServerManager() {
    if (!managerInstance) {
        managerInstance = new MongoServerManager();
    }
    return managerInstance;
}

module.exports = {
    MongoServerManager,
    getMongoServerManager,
    REQUIRED_COLLECTIONS,
    COLLECTION_INDEXES
};
