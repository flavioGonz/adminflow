const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');

const { db } = require('./db');
const {
    determineDbEngine,
    getCurrentDbEngine,
    getDbConfigFromFile,
    updateDbConfig,
} = require('./lib/dbChoice');
const {
    initMongo,
    getMongoDb,
    connectToMongoDirect,
} = require('./lib/mongoClient');
const { notify, isReady: notificationsReady } = require('./lib/notificationService');
const { logEvent, getAuditLogs } = require('./lib/auditService');
const { getConfig, listConfigs, upsertConfig } = require('./lib/configService');
const { trackRegisteredUser, listRegisteredUsers, updateRegisteredUser } = require('./lib/userService');
const { fetchRecentSyncEvents } = require('./lib/sqliteSync');
const { syncLocalToMongo } = require('./lib/mongo-sync');
const DB_CONFIG_DEFAULTS = require('./lib/dbConfigDefaults');

const { getTemplateForEvent } = require('./lib/emailTemplates');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_super_secret';

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.includes('192.168.99.254')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Routes
const accessRoutes = require('./routes/access');
app.use('/api', accessRoutes);

app.use(
    session({
        store: new SQLiteStore({ db: 'database/database.sqlite', table: 'sessions' }),
        secret: process.env.SESSION_SECRET || 'dev_session_secret',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 },
    })
);

const contractUploadsRoot = path.resolve(__dirname, 'uploads', 'contracts');
if (!fs.existsSync(contractUploadsRoot)) {
    fs.mkdirSync(contractUploadsRoot, { recursive: true });
}
const budgetUploadsRoot = path.resolve(__dirname, 'uploads', 'budgets');
if (!fs.existsSync(budgetUploadsRoot)) {
    fs.mkdirSync(budgetUploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
    destination: contractUploadsRoot,
    filename: (req, file, cb) => {
        const contractId = req.params.id || 'contract';
        cb(null, `${contractId}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });
const budgetShareStorage = multer.diskStorage({
    destination: budgetUploadsRoot,
    filename: (req, file, cb) => {
        const budgetId = req.params.id || 'budget';
        cb(null, `${budgetId}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const budgetShareUpload = multer({ storage: budgetShareStorage });

const parseJsonColumn = (value, fallback = []) => {
    if (!value) return Array.isArray(fallback) ? fallback : fallback ?? null;
    try {
        return JSON.parse(value);
    } catch {
        return Array.isArray(fallback) ? fallback : fallback ?? null;
    }
};

const mapClientRow = (row) => ({
    ...row,
    id: String(row.id),
    contract: !!row.contract,
    notificationsEnabled: !!row.notifications_enabled,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
});

const mapTicketRow = (row) => ({
    id: String(row.id),
    clientId: row.clientId !== undefined ? String(row.clientId) : undefined,
    clientName: row.clientName || '',
    title: row.title,
    status: row.status,
    priority: row.priority,
    amount: row.amount,
    visit: !!row.visit,
    annotations: parseJsonColumn(row.annotations, []),
    hasActiveContract: !!row.hasActiveContract,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    description: row.description || '',
    attachments: parseJsonColumn(row.attachments, []),
    audioNotes: parseJsonColumn(row.audioNotes, []),
    clientNotificationsEnabled: !!row.clientNotificationsEnabled,
    clientEmail: row.clientEmail || '',
});

const ensurePendingPaymentForTicket = (ticket) => {
    if (!ticket?.id) {
        return;
    }
    db.get(
        'SELECT id FROM payments WHERE ticket_id = ? AND status != ?',
        [ticket.id, 'Pagado'],
        (err, row) => {
            if (err || row) {
                return;
            }
            const paymentId = `PAY-${uuid().slice(0, 6).toUpperCase()}`;
            const invoice = `INV-${Date.now().toString(36).slice(0, 6).toUpperCase()}`;
            const amount = Number(ticket.amount) || 0;
            db.run(
                `INSERT INTO payments (id, invoice, ticket_id, ticket_title, client, client_id, amount, status, method, concept, currency, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    paymentId,
                    invoice,
                    ticket.id,
                    ticket.title || 'Ticket pendiente',
                    ticket.clientName || 'Cliente',
                    ticket.clientId || null,
                    amount,
                    'Pendiente',
                    'Transferencia',
                    ticket.title
                        ? `Pago pendiente por ${ticket.title}`
                        : 'Pago pendiente',
                    'UYU',
                    new Date().toISOString(),
                ],
                () => { }
            );
        }
    );
};

const updateTicketStatus = (ticketId, status) => {
    if (!ticketId) {
        return;
    }
    db.run(
        'UPDATE tickets SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [status, ticketId],
        () => { }
    );
};

const mapContractRow = (row) => ({
    id: String(row.id),
    clientId: String(row.client_id),
    clientName: row.clientName || '',
    title: row.title || row.contract_name || '',
    description: row.description || '',
    startDate: row.startDate || null,
    endDate: row.endDate || null,
    status: row.status || '',
    sla: row.sla || '',
    contractType: row.contractType || '',
    amount: row.amount,
    currency: row.currency || 'ARS',
    filePath: row.file_path || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

const mapCalendarEventRow = (row) => ({
    id: String(row.id),
    title: row.title,
    start: row.start,
    end: row.end || null,
    location: row.location || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

const TICKET_SELECT_BASE = `
  SELECT
    t.id,
    t.client_id as clientId,
    t.title,
    t.status,
    t.priority,
    t.amount,
    t.visit,
    t.annotations,
    t.description,
    t.attachments,
    t.audioNotes,
    t.createdAt,
    t.updatedAt,
    c.name as clientName,
    c.email as clientEmail,
    c.notifications_enabled as clientNotificationsEnabled,
    c.contract as hasActiveContract
  FROM tickets t
  JOIN clients c ON t.client_id = c.id
`;

const CONTRACT_SELECT_BASE = `
  SELECT
    contracts.*,
    clients.name as clientName
  FROM contracts
  JOIN clients ON contracts.client_id = clients.id
`;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const mapPaymentRow = (row) => ({
    id: row.id,
    invoice: row.invoice,
    ticketId: row.ticket_id || null,
    ticketTitle: row.ticket_title || null,
    client: row.client,
    clientId: row.client_id !== null ? String(row.client_id) : null,
    amount: row.amount,
    status: row.status,
    method: row.method || "Transferencia",
    note: row.note || "",
    currency: row.currency || "UYU",
    concept: row.concept || "",
    createdAt: row.createdAt,
});

const syncPaymentToMongo = async (payment) => {
    const mongoDb = getMongoDb();
    if (!mongoDb) return;
    try {
        await mongoDb
            .collection("payments")
            .updateOne({ id: payment.id }, { $set: payment }, { upsert: true });
    } catch (error) {
        console.warn("No se pudo sincronizar el pago en MongoDB:", error.message);
    }
};

/**
 * Envía notificaciones automáticas basadas en la configuración guardada
 * @param {string} eventId - ID del evento (ej: 'ticket_created', 'payment_received')
 * @param {string} message - Mensaje a enviar
 * @param {object} metadata - Metadata adicional del evento
 * @param {string[]} recipients - Lista de emails destinatarios (opcional)
 */
const sendAutoNotification = async (eventId, message, metadata = {}, recipients = []) => {
    if (!notificationsReady()) {
        console.log(`⚠️ Notificaciones no configuradas, saltando evento: ${eventId}`);
        return;
    }

    try {
        // Obtener configuración de notificaciones
        const notifConfig = await getConfig('notifications');
        console.log(`🔔 Verificando notificación para evento: ${eventId}`);

        if (!notifConfig || !notifConfig.data || !notifConfig.data.events) {
            console.log(`⚠️ No hay configuración de eventos guardada`);
            return;
        }

        // Buscar el evento en la configuración
        const eventConfig = notifConfig.data.events?.find(e => e.id === eventId);

        if (!eventConfig) {
            console.log(`⚠️ Evento ${eventId} no encontrado en configuración`);
            return;
        }

        // Obtener canales habilitados para este evento
        const enabledChannels = [];
        if (eventConfig.channels) {
            Object.keys(eventConfig.channels).forEach(channel => {
                if (eventConfig.channels[channel]) {
                    enabledChannels.push(channel);
                }
            });
        }

        if (enabledChannels.length === 0) {
            console.log(`⚠️ No hay canales habilitados para evento: ${eventId}`);
            return;
        }

        console.log(`✅ Enviando notificación para ${eventId} por canales:`, enabledChannels);

        // Enviar notificación
        await notify({
            event: eventId,
            message,
            channels: enabledChannels,
            metadata,
            recipients,
        });

        console.log(`✅ Notificación enviada para evento: ${eventId}`);
    } catch (error) {
        console.error(`❌ Error enviando notificación automática para ${eventId}:`, error.message);
    }
};

app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], function (runErr) {
            if (runErr) {
                if (runErr.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'User already exists' });
                }
                return res.status(500).json({ message: 'Error registering user' });
            }
            trackRegisteredUser({ sqliteId: this.lastID, email }).catch(() => { });

            // Audit log
            auditService.logEvent('user', 'create', 'user', {
                userId: this.lastID,
                email: email
            }, req).catch(console.error);

            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ message: 'Error retrieving user' });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        bcrypt.compare(password, user.password, (compareErr, result) => {
            if (compareErr) return res.status(500).json({ message: 'Error comparing passwords' });
            if (!result) return res.status(401).json({ message: 'Invalid credentials' });
            const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
            req.session.userId = user.id;
            res.json({ message: 'Logged in successfully', token });
        });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

app.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Welcome to your profile!', user: req.user });
});

// Registered users stored in Mongo
app.get('/api/users/registered', async (req, res) => {
    if (!getMongoDb()) {
        return res.status(503).json({ message: 'MongoDB no está conectado.' });
    }
    try {
        const users = await listRegisteredUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al listar usuarios registrados', detail: error.message });
    }
});

app.patch('/api/users/registered/:id', async (req, res) => {
    if (!getMongoDb()) {
        return res.status(503).json({ message: 'MongoDB no está conectado.' });
    }
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Provee al menos un campo para actualizar' });
    }
    try {
        const updated = await updateRegisteredUser(req.params.id, updates);
        if (!updated) {
            return res.status(404).json({ message: 'Usuario no encontrado en MongoDB' });
        }

        // Audit log
        auditService.logEvent('user', 'update', 'user', {
            userId: req.params.id,
            updates: Object.keys(updates)
        }, req).catch(console.error);

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando usuario', detail: error.message });
    }
});

app.get('/api/config', async (req, res) => {
    try {
        const configs = await listConfigs();
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Error al listar configuraciones', detail: error.message });
    }
});

app.get('/api/config/:module', async (req, res) => {
    try {
        const config = await getConfig(req.params.module);
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo configuración', detail: error.message });
    }
});

app.post('/api/config/:module', async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ message: 'Envía un objeto válido para la configuración' });
    }
    try {
        const updated = await upsertConfig(req.params.module, payload);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error guardando configuración', detail: error.message });
    }
});

const testMongoConnection = async (uri, database = DB_CONFIG_DEFAULTS.mongoDb) => {
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    });
    await client.connect();
    try {
        await client.db(database).command({ ping: 1 });
    } finally {
        await client.close();
    }
};

const testSqliteConnection = (sqlitePath) => {
    const resolvedPath = sqlitePath
        ? sqlitePath
        : path.resolve(__dirname, 'database', 'database.sqlite');
    return new Promise((resolve, reject) => {
        const testDb = new sqlite3.Database(
            resolvedPath,
            sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
            (err) => {
                if (err) {
                    return reject(err);
                }
                testDb.close((closeErr) => {
                    if (closeErr) {
                        return reject(closeErr);
                    }
                    resolve(resolvedPath);
                });
            }
        );
    });
};

app.get('/api/system/database', async (req, res) => {
    try {
        const config = getDbConfigFromFile();
        res.json({
            module: 'database',
            data: config,
            engine: getCurrentDbEngine(),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo la configuración de base', detail: error.message });
    }
});

app.post('/api/system/database', async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ message: 'Envía un objeto válido para la configuración' });
    }
    try {
        const updated = updateDbConfig(payload);
        res.json({
            module: 'database',
            data: updated,
            engine: updated.engine ?? getCurrentDbEngine(),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error guardando la configuración de base', detail: error.message });
    }
});

app.post('/api/system/database/verify', async (req, res) => {
    const { engine, mongoUri, mongoDb, sqlitePath } = req.body || {};
    if (!engine) {
        return res.status(400).json({ message: 'Indica el motor de base a verificar.' });
    }
    const dbConfig = getDbConfigFromFile();
    try {
        if (engine === 'mongodb') {
            const targetUri = mongoUri || dbConfig.mongoUri;
            const targetDbName = mongoDb || dbConfig.mongoDb || DB_CONFIG_DEFAULTS.mongoDb;
            if (!targetUri) {
                return res.status(400).json({ message: 'Debe indicar la URI de MongoDB.' });
            }
            await testMongoConnection(targetUri, targetDbName);
            return res.json({
                engine,
                ok: true,
                info: `Conexión correcta con MongoDB en ${targetUri}/${targetDbName}`,
            });
        }
        if (engine === 'sqlite') {
            const pathUsed = await testSqliteConnection(sqlitePath || dbConfig.sqlitePath);
            return res.json({
                engine,
                ok: true,
                info: `Archivo SQLite accesible: ${pathUsed}`,
            });
        }
        res.status(400).json({ message: 'Motor desconocido. Usa mongodb o sqlite.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verificando la base de datos', detail: error.message });
    }
});

const SQLITE_TABLES = ['clients', 'tickets', 'budgets', 'contracts', 'payments', 'products', 'repository'];

const summarizeSqlite = () =>
    new Promise((resolve) => {
        const summary = {};
        let completed = 0;
        SQLITE_TABLES.forEach((table) => {
            db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                summary[table] = err ? 0 : row?.count ?? 0;
                completed += 1;
                if (completed === SQLITE_TABLES.length) {
                    resolve(summary);
                }
            });
        });
    });

const summarizeMongo = async () => {
    const dbConfig = getDbConfigFromFile();
    let mongoDb = getMongoDb();
    let tempClient = null;
    try {
        if (!mongoDb) {
            const connection = await connectToMongoDirect(dbConfig.mongoUri, dbConfig.mongoDb);
            mongoDb = connection.db;
            tempClient = connection.client;
        }
        const collections = await mongoDb.listCollections().toArray();
        const stats = await Promise.all(
            collections.map(async (collection) => {
                const col = mongoDb.collection(collection.name);
                const count = await col.countDocuments();
                return { name: collection.name, count };
            })
        );
        const dbStats = await mongoDb.command({ dbStats: 1 });
        return {
            collections: stats,
            size: dbStats.storageSize ?? 0,
        };
    } catch (error) {
        return { collections: [], size: 0, error: error.message };
    } finally {
        if (tempClient) {
            await tempClient.close().catch(() => { });
        }
    }
};

app.get('/api/system/database/overview', async (req, res) => {
    try {
        const sqliteSummary = await summarizeSqlite();
        const mongoSummary = await summarizeMongo();
        res.json({
            sqlite: {
                tables: sqliteSummary,
                status: 'ok',
            },
            mongo: mongoSummary,
            engine: getCurrentDbEngine(),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generando resumen de bases', detail: error.message });
    }
});

app.get('/api/system/audit', async (req, res) => {
    try {
        const { limit, type, status, search } = req.query;
        const logs = await getAuditLogs(limit || 50, { resource: type, status, search });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo auditoría', detail: error.message });
    }
});

app.get('/api/system/database/export/:engine', async (req, res) => {
    const { engine } = req.params;
    const engines = ['mongodb', 'sqlite'];
    if (!engines.includes(engine)) {
        return res.status(400).json({ message: 'Engine debe ser mongodb o sqlite' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${engine}-snapshot.json`);
    res.send(JSON.stringify({ message: `Export simulado de ${engine}`, timestamp: new Date().toISOString() }));
});

app.post('/api/db/select', async (req, res) => {
    const { engine } = req.body;
    if (!['sqlite', 'mongodb'].includes(engine)) {
        return res.status(400).json({ message: 'Invalid database engine selected.' });
    }
    try {
        const updated = updateDbConfig({ engine });
        res.json({
            success: true,
            message: `Database engine switched to ${engine}. Please restart the server to apply changes.`,
            data: updated,
            engine: updated.engine ?? getCurrentDbEngine(),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to switch database engine.', detail: error.message });
    }
});
app.post('/api/db/sync', async (req, res) => {
    const { engine } = req.body;

    if (engine === 'mongodb') {
        try {
            const dbConfig = getDbConfigFromFile();
            const mongoUri = dbConfig?.mongoUri || DB_CONFIG_DEFAULTS.mongoUri;
            const mongoDbName = dbConfig?.mongoDb || DB_CONFIG_DEFAULTS.mongoDb;

            const summary = await syncLocalToMongo({
                uri: mongoUri,
                dbName: mongoDbName,
                dropExisting: false,
            });

            res.json({ success: true, message: 'Sync to MongoDB completed.', summary });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Sync to MongoDB failed.', detail: error.message });
        }
    } else if (engine === 'sqlite') {
        res.json({ success: true, message: 'Sync is not applicable for the SQLite engine in this context.' });
    } else {
        res.status(400).json({ message: 'Invalid or missing database engine specified.' });
    }
});

app.post('/api/db/reset', async (req, res) => {
    const { engine } = req.body;

    if (engine === 'sqlite') {
        try {
            const dbConfig = getDbConfigFromFile();
            const sqlitePath = dbConfig?.sqlitePath || DB_CONFIG_DEFAULTS.sqlitePath;

            db.close((err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Failed to close SQLite connection.', detail: err.message });
                }

                fs.unlink(sqlitePath, (unlinkErr) => {
                    if (unlinkErr) {
                        return res.status(500).json({ success: false, message: 'Failed to delete SQLite database file.', detail: unlinkErr.message });
                    }
                    res.json({ success: true, message: 'SQLite database file deleted. Please restart the server to recreate it.' });
                });
            });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to reset SQLite database.', detail: error.message });
        }
    } else if (engine === 'mongodb') {
        try {
            const mongoDb = getMongoDb();
            if (!mongoDb) {
                return res.status(503).json({ message: 'MongoDB is not connected.' });
            }
            const collections = await mongoDb.listCollections().toArray();
            for (const collection of collections) {
                await mongoDb.collection(collection.name).drop();
            }
            res.json({ success: true, message: 'All collections in MongoDB have been dropped.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to reset MongoDB.', detail: error.message });
        }
    } else {
        res.status(400).json({ message: 'Invalid or missing database engine specified.' });
    }
});

app.post('/api/db/migrate-to-mongo', async (req, res) => {
    try {
        const dbConfig = getDbConfigFromFile();
        const mongoUri = dbConfig?.mongoUri || DB_CONFIG_DEFAULTS.mongoUri;
        const mongoDbName = dbConfig?.mongoDb || DB_CONFIG_DEFAULTS.mongoDb;

        const summary = await syncLocalToMongo({
            uri: mongoUri,
            dbName: mongoDbName,
            dropExisting: true, // This will wipe collections before inserting
        });

        res.json({ success: true, message: 'Migration completed successfully.', summary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Migration failed.', detail: error.message });
    }
});

app.post('/api/notifications/send', async (req, res) => {
    if (!notificationsReady()) {
        return res.status(503).json({ message: 'Los canales de notificación no están configurados.' });
    }
    const { event, message, channels, metadata, recipients } = req.body;
    if (!event || !message) {
        return res.status(400).json({ message: 'Se requiere el evento y el mensaje a notificar.' });
    }
    try {
        const results = await notify({ event, message, channels, metadata, recipients });
        res.json({ event, results });
    } catch (error) {
        res.status(500).json({ message: 'Error enviando notificación', detail: error.message });
    }
});

app.get('/api/notifications/history', async (req, res) => {
    const limit = Number(req.query.limit) || 25;
    const mongoDb = getMongoDb();
    if (mongoDb) {
        const entries = await mongoDb
            .collection('notifications')
            .find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
        return res.json(entries);
    }
    try {
        const fallback = await fetchRecentSyncEvents(limit);
        res.json(fallback);
    } catch (error) {
        res.status(500).json({ message: 'Error leyendo historial de sincronización', detail: error.message });
    }
});

// Endpoint para verificar conexión SMTP
app.post('/api/notifications/verify-smtp', async (req, res) => {
    const nodemailer = require('nodemailer');
    const { host, port, user, pass } = req.body;

    if (!host || !user || !pass) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere host, user y pass'
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: Number(port) || 587,
            secure: Number(port) === 465,
            auth: {
                user,
                pass,
            },
        });

        // Verificar la conexión
        await transporter.verify();

        res.json({
            success: true,
            message: 'Conexión SMTP exitosa'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error de conexión SMTP',
            detail: error.message
        });
    }
});

app.post('/api/notifications/preview-template', (req, res) => {
    const { event, data } = req.body;
    try {
        const { html } = getTemplateForEvent(event, data || {});
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Endpoint para guardar configuración de notificaciones
app.post('/api/notifications/config', async (req, res) => {
    try {
        const config = req.body;

        // Guardar en MongoDB usando configService
        await upsertConfig('notifications', config);

        res.json({
            success: true,
            message: 'Configuración guardada correctamente'
        });
    } catch (error) {
        console.error('Error guardando configuración de notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar configuración',
            detail: error.message
        });
    }
});

// Endpoint para obtener configuración de notificaciones
app.get('/api/notifications/config', async (req, res) => {
    try {
        const config = await getConfig('notifications');
        res.json(config || { channels: {}, templates: {} });
    } catch (error) {
        console.error('Error obteniendo configuración de notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración',
            detail: error.message
        });
    }
});

// Client routes
app.get('/api/clients', (req, res) => {
    db.all('SELECT * FROM clients', [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapClientRow));
    });
});

app.get('/api/clients/:id', (req, res) => {
    db.get('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: 'Client not found' });
        res.json(mapClientRow(row));
    });
});

app.post('/api/clients', (req, res) => {
    const { name, alias, rut, email, phone, address, contract, notificationsEnabled } = req.body;
    const latitude = req.body.latitude ?? null;
    const longitude = req.body.longitude ?? null;
    if (!name) {
        return res.status(400).json({ message: 'Name is required.' });
    }
    const contractValue = contract === true ? 1 : 0;
    const notificationsValue = notificationsEnabled === false ? 0 : 1; // Default true
    db.run(
        'INSERT INTO clients (name, alias, rut, email, phone, address, latitude, longitude, contract, notifications_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, alias, rut, email, phone, address, latitude, longitude, contractValue, notificationsValue],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: `Client with email '${email}' already exists.` });
                }
                return res.status(500).json({ message: err.message });
            }
            db.get('SELECT * FROM clients WHERE id = ?', [this.lastID], async (selectErr, row) => {
                if (selectErr) {
                    return res.status(500).json({ message: selectErr.message });
                }
                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'create',
                    resource: 'client',
                    details: { clientId: row.id, name: row.name },
                    ip: req.ip
                });
                res.status(201).json(mapClientRow(row));
            });
        }
    );
});

app.put('/api/clients/:id', (req, res) => {
    const { name, alias, rut, email, phone, address, contract, notificationsEnabled } = req.body;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    if (!name) {
        return res.status(400).json({ message: 'Name is required.' });
    }
    const contractValue = contract === true ? 1 : 0;
    const notificationsValue = notificationsEnabled === false ? 0 : 1;
    db.run(
        'UPDATE clients SET name = ?, alias = ?, rut = ?, email = ?, phone = ?, address = ?, latitude = ?, longitude = ?, contract = ?, notifications_enabled = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [name, alias, rut, email, phone, address, latitude, longitude, contractValue, notificationsValue, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Client not found.' });
            }
            db.get('SELECT * FROM clients WHERE id = ?', [req.params.id], async (selectErr, row) => {
                if (selectErr) {
                    return res.status(500).json({ message: selectErr.message });
                }
                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'update',
                    resource: 'client',
                    details: { clientId: row.id, name: row.name },
                    ip: req.ip
                });
                res.json(mapClientRow(row));
            });
        }
    );
});

app.delete('/api/clients/:id', (req, res) => {
    db.run('DELETE FROM clients WHERE id = ?', [req.params.id], async function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Client not found.' });

        await auditService.logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'delete',
            resource: 'client',
            details: { clientId: req.params.id },
            ip: req.ip
        });

        res.json({ message: 'Client deleted successfully.' });
    });
});

app.post('/api/clients/import', (req, res) => {
    const payload = Array.isArray(req.body) ? req.body : req.body?.clients;
    if (!Array.isArray(payload)) {
        return res.status(400).json({ message: 'Payload must be an array of clients.' });
    }
    let imported = 0;
    let failed = 0;
    const errors = [];
    const insertClient = (client) =>
        new Promise((resolve) => {
            const contractValue = client.contract === true ? 1 : 0;
            const notificationsValue = client.notificationsEnabled === false ? 0 : 1;
            db.run(
                'INSERT INTO clients (name, alias, rut, email, phone, address, contract, notifications_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [client.name, client.alias, client.rut, client.email, client.phone, client.address, contractValue, notificationsValue],
                (err) => {
                    if (err) {
                        failed += 1;
                        errors.push({ email: client.email, message: err.message });
                    } else {
                        imported += 1;
                    }
                    resolve();
                }
            );
        });
    Promise.all(payload.map(insertClient)).then(() => {
        res.json({ message: 'Client import completed', stats: { total: payload.length, imported, failed, errors } });
    });
});

// Repository and payments
const mapRepositoryRow = (row) => ({
    id: String(row.id),
    clientId: String(row.client_id),
    name: row.name || row.equipo || "",
    type: row.type || row.usuario || "",
    category: row.category || "Documento",
    format: row.format || row.mac_serie || "",
    credential: row.credential || row.password || "",
    notes: row.notes || row.comentarios || "",
    content: row.content || "",
    fileName: row.file_name || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

app.get('/api/clients/:id/repository', (req, res) => {
    db.all('SELECT * FROM repository WHERE client_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapRepositoryRow));
    });
});

app.post('/api/clients/:id/repository', (req, res) => {
    const clientId = Number(req.params.id);
    if (Number.isNaN(clientId)) {
        return res.status(400).json({ message: 'clientId inválido' });
    }
    const {
        name,
        type,
        category = 'Documento',
        format,
        credential,
        notes,
        content,
        fileName,
    } = req.body;
    if (!name || !type) {
        return res.status(400).json({ message: 'name y type son obligatorios' });
    }
    db.run(
        `INSERT INTO repository (client_id, name, type, category, format, credential, notes, content, file_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            clientId,
            name,
            type,
            category,
            format || "",
            credential || "",
            notes || "",
            content || "",
            fileName || "",
        ],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            db.get('SELECT * FROM repository WHERE id = ?', [this.lastID], (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                res.status(201).json(mapRepositoryRow(row));
            });
        }
    );
});

app.put('/api/repository/:id', (req, res) => {
    db.get('SELECT * FROM repository WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!existing) return res.status(404).json({ message: 'Entry no encontrada' });
        const {
            name,
            type,
            category,
            format,
            credential,
            notes,
            content,
            fileName,
        } = req.body;
        const updates = {
            name: name ?? existing.name,
            type: type ?? existing.type,
            category: category ?? existing.category,
            format: format ?? existing.format,
            credential: credential ?? existing.credential,
            notes: notes ?? existing.notes,
            content: content ?? existing.content,
            file_name: fileName ?? existing.file_name,
        };
        db.run(
            `UPDATE repository
       SET name = ?, type = ?, category = ?, format = ?, credential = ?, notes = ?, content = ?, file_name = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                updates.name,
                updates.type,
                updates.category,
                updates.format,
                updates.credential,
                updates.notes,
                updates.content,
                updates.file_name,
                req.params.id,
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                db.get('SELECT * FROM repository WHERE id = ?', [req.params.id], (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });
                    res.json(mapRepositoryRow(row));
                });
            }
        );
    });
});

app.delete('/api/repository/:id', (req, res) => {
    db.run('DELETE FROM repository WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Entry no encontrada' });
        }
        res.json({ message: 'Entry eliminado' });
    });
});



// Payments routes
app.get('/api/payments', (req, res) => {
    db.all('SELECT * FROM payments ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapPaymentRow));
    });
});

app.post('/api/payments', (req, res) => {
    const {
        invoice,
        client,
        clientId,
        amount,
        status = 'Pendiente',
        ticketId,
        ticketTitle,
        method,
        note,
        concept,
        currency = 'UYU',
        createdAt = new Date().toISOString(),
    } = req.body;
    const numericAmount = Number(amount);
    if (!invoice || !client || Number.isNaN(numericAmount)) {
        return res.status(400).json({ message: 'invoice, client and amount are required' });
    }
    if (!(numericAmount > 0)) {
        return res.status(400).json({ message: 'amount must be greater than zero' });
    }
    const id = `PAY-${uuid().slice(0, 6).toUpperCase()}`;
    db.run(
        `INSERT INTO payments (id, invoice, ticket_id, ticket_title, client, client_id, amount, status, method, note, concept, currency, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            invoice,
            ticketId || null,
            ticketTitle || null,
            client,
            clientId || null,
            numericAmount,
            status,
            method || 'Transferencia',
            note || null,
            concept || null,
            currency,
            createdAt,
        ],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            db.get('SELECT * FROM payments WHERE id = ?', [id], async (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                const savedPayment = mapPaymentRow(row);

                // Enviar notificación automática
                sendAutoNotification(
                    'payment_received',
                    `Nuevo pago ${savedPayment.invoice} de ${savedPayment.client} por ${savedPayment.amount} ${savedPayment.currency}`,
                    savedPayment,
                    []
                ).catch(err => console.error('Error en notificación:', err));

                syncPaymentToMongo(savedPayment);

                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'create',
                    resource: 'payment',
                    details: { paymentId: savedPayment.id, invoice: savedPayment.invoice, amount: savedPayment.amount },
                    ip: req.ip
                });

                res.status(201).json(savedPayment);
            });
        }
    );
});

app.put('/api/payments/:id', (req, res) => {
    db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!existing) return res.status(404).json({ message: 'Payment not found' });
        const payload = {
            invoice: req.body.invoice ?? existing.invoice,
            ticket_id: req.body.ticketId ?? req.body.ticket_id ?? existing.ticket_id,
            ticket_title: req.body.ticketTitle ?? req.body.ticket_title ?? existing.ticket_title,
            client: req.body.client ?? existing.client,
            client_id: req.body.clientId ?? req.body.client_id ?? existing.client_id,
            amount: req.body.amount ?? existing.amount,
            status: req.body.status ?? existing.status,
            method: req.body.method ?? existing.method,
            note: req.body.note ?? existing.note,
            concept: req.body.concept ?? existing.concept,
            currency: req.body.currency ?? existing.currency ?? 'UYU',
            createdAt: req.body.createdAt ?? existing.createdAt,
        };
        if (!(payload.amount > 0)) {
            return res.status(400).json({ message: 'amount must be greater than zero' });
        }
        const newTicketStatus =
            payload.status === 'Pagado'
                ? 'Pagado'
                : payload.status === 'Facturar'
                    ? 'Facturar'
                    : undefined;
        db.run(
            `UPDATE payments
           SET invoice = ?, ticket_id = ?, ticket_title = ?, client = ?, client_id = ?, amount = ?, status = ?, method = ?, note = ?, concept = ?, currency = ?, createdAt = ?
           WHERE id = ?`,
            [
                payload.invoice,
                payload.ticket_id,
                payload.ticket_title,
                payload.client,
                payload.client_id,
                payload.amount,
                payload.status,
                payload.method,
                payload.note,
                payload.concept,
                payload.currency,
                payload.createdAt,
                req.params.id,
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                if (newTicketStatus && payload.ticket_id) {
                    updateTicketStatus(payload.ticket_id, newTicketStatus);
                }
                db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], async (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });
                    const updatedPayment = mapPaymentRow(row);

                    await auditService.logEvent({
                        user: req.user ? req.user.email : 'system',
                        action: 'update',
                        resource: 'payment',
                        details: { paymentId: updatedPayment.id, invoice: updatedPayment.invoice, status: updatedPayment.status },
                        ip: req.ip
                    });

                    res.json(updatedPayment);
                });
            }
        );
    });
});

app.delete('/api/payments/:id', (req, res) => {
    db.run('DELETE FROM payments WHERE id = ?', [req.params.id], async function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Payment not found' });

        await auditService.logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'delete',
            resource: 'payment',
            details: { paymentId: req.params.id },
            ip: req.ip
        });

        res.json({ message: 'Payment deleted' });
    });
});

app.get('/api/contracts', (req, res) => {
    db.all(`${CONTRACT_SELECT_BASE} ORDER BY contracts.createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapContractRow));
    });
});

app.get('/api/clients/:id/contracts', (req, res) => {
    db.all(`${CONTRACT_SELECT_BASE} WHERE contracts.client_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapContractRow));
    });
});

app.post('/api/contracts', (req, res) => {
    const {
        clientId,
        title,
        description,
        startDate,
        endDate,
        status,
        sla,
        contractType,
        amount,
        currency = 'ARS',
    } = req.body;
    const numericClientId = Number(clientId);
    if (!numericClientId || !title) {
        return res.status(400).json({ message: 'clientId and title are required.' });
    }
    db.run(
        `INSERT INTO contracts (client_id, contract_name, file_path, currency, title, description, startDate, endDate, status, sla, contractType, amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            numericClientId,
            title,
            '',
            currency || 'ARS',
            title,
            description || null,
            startDate || null,
            endDate || null,
            status || null,
            sla || null,
            contractType || null,
            amount ?? null,
        ],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            const contractId = this.lastID;
            db.get(`${CONTRACT_SELECT_BASE} WHERE contracts.id = ?`, [contractId], async (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                const newContract = mapContractRow(row);

                // Enviar notificación si el contrato está firmado
                if (status === 'Firmado' || status === 'Activo') {
                    sendAutoNotification(
                        'contract_signed',
                        `Contrato firmado: ${newContract.title} - Cliente: ${newContract.clientName}`,
                        newContract,
                        []
                    ).catch(err => console.error('Error en notificación:', err));
                }

                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'create',
                    resource: 'contract',
                    details: { contractId: newContract.id, title: newContract.title, clientId: newContract.clientId },
                    ip: req.ip
                });

                res.status(201).json(newContract);
            });
        }
    );
});

app.put('/api/contracts/:id', (req, res) => {
    db.get('SELECT * FROM contracts WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!existing) return res.status(404).json({ message: 'Contract not found' });
        const payload = {
            contractName: req.body.title ?? existing.contract_name ?? existing.title,
            title: req.body.title ?? existing.title,
            description: req.body.description ?? existing.description,
            startDate: req.body.startDate ?? existing.startDate,
            endDate: req.body.endDate ?? existing.endDate,
            status: req.body.status ?? existing.status,
            sla: req.body.sla ?? existing.sla,
            contractType: req.body.contractType ?? existing.contractType,
            amount: req.body.amount ?? existing.amount,
            currency: req.body.currency ?? existing.currency ?? 'ARS',
        };
        db.run(
            `UPDATE contracts
       SET contract_name = ?, title = ?, description = ?, startDate = ?, endDate = ?, status = ?, sla = ?, contractType = ?, amount = ?, currency = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                payload.contractName,
                payload.title,
                payload.description,
                payload.startDate,
                payload.endDate,
                payload.status,
                payload.sla,
                payload.contractType,
                payload.amount,
                payload.currency,
                req.params.id,
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                db.get(`${CONTRACT_SELECT_BASE} WHERE contracts.id = ?`, [req.params.id], async (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });

                    await auditService.logEvent({
                        user: req.user ? req.user.email : 'system',
                        action: 'update',
                        resource: 'contract',
                        details: { contractId: row.id, title: row.title },
                        ip: req.ip
                    });

                    res.json(mapContractRow(row));
                });
            }
        );
    });
});

app.delete('/api/contracts/:id', (req, res) => {
    db.get('SELECT file_path FROM contracts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: 'Contract not found.' });
        if (row.file_path) {
            const absolutePath = path.resolve(__dirname, row.file_path.replace(/^\//, ''));
            fs.unlink(absolutePath, () => { });
        }
        db.run('DELETE FROM contracts WHERE id = ?', [req.params.id], async (deleteErr) => {
            if (deleteErr) return res.status(500).json({ message: deleteErr.message });

            await auditService.logEvent({
                user: req.user ? req.user.email : 'system',
                action: 'delete',
                resource: 'contract',
                details: { contractId: req.params.id },
                ip: req.ip
            });

            res.json({ message: 'Contract deleted successfully.' });
        });
    });
});

app.post('/api/contracts/import', (req, res) => {
    const payload = Array.isArray(req.body) ? req.body : req.body?.contracts;
    if (!Array.isArray(payload)) {
        return res.status(400).json({ message: 'Payload must be an array of contracts.' });
    }
    let imported = 0;
    let failed = 0;
    const errors = [];
    const insertContract = (contract) =>
        new Promise((resolve) => {
            const numericClientId = Number(contract.clientId || contract.client_id);
            if (!numericClientId) {
                failed += 1;
                errors.push({ title: contract.title, message: 'Invalid clientId' });
                return resolve();
            }
            db.run(
                `INSERT INTO contracts (client_id, title, description, startDate, endDate, status, sla, contractType, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    numericClientId,
                    contract.title,
                    contract.description || null,
                    contract.startDate || null,
                    contract.endDate || null,
                    contract.status || null,
                    contract.sla || null,
                    contract.contractType || null,
                    contract.amount ?? null,
                ],
                (err) => {
                    if (err) {
                        failed += 1;
                        errors.push({ title: contract.title, message: err.message });
                    } else {
                        imported += 1;
                    }
                    resolve();
                }
            );
        });
    Promise.all(payload.map(insertContract)).then(() => {
        res.json({ message: 'Contract import completed', stats: { total: payload.length, imported, failed, errors } });
    });
});

app.post('/api/contracts/:id/upload', upload.single('contractFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File is required.' });
    }
    const relativePath = `/uploads/contracts/${path.basename(req.file.path)}`;
    db.run(
        'UPDATE contracts SET file_path = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [relativePath, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Contract not found' });
            db.get(`${CONTRACT_SELECT_BASE} WHERE contracts.id = ?`, [req.params.id], (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                res.json(mapContractRow(row));
            });
        }
    );
});

const mapBudgetRow = (row) => ({
    id: String(row.id),
    clientId: String(row.client_id),
    clientName: row.clientName || '',
    clientPhone: row.clientPhone || '',
    clientEmail: row.clientEmail || '',
    title: row.title || '',
    description: row.description || '',
    amount: row.amount,
    status: row.status || '',
    filePath: row.file_path || null,
    sections: parseJsonColumn(row.sections, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

const BUDGET_SELECT_BASE = `
  SELECT
    budgets.*,
    clients.name as clientName,
    clients.phone as clientPhone,
    clients.email as clientEmail
  FROM budgets
  JOIN clients ON budgets.client_id = clients.id
`;

// Budget routes
app.get('/api/budgets', (req, res) => {
    db.all(`${BUDGET_SELECT_BASE} ORDER BY budgets.createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapBudgetRow));
    });
});

app.get('/api/budgets/:id', (req, res) => {
    db.get(`${BUDGET_SELECT_BASE} WHERE budgets.id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: 'Budget not found' });
        res.json(mapBudgetRow(row));
    });
});

app.get('/api/clients/:id/budgets', (req, res) => {
    db.all(`${BUDGET_SELECT_BASE} WHERE budgets.client_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapBudgetRow));
    });
});

app.post('/api/budgets', (req, res) => {
    const {
        clientId,
        title,
        description,
        amount,
        status,
        sections,
    } = req.body;
    const numericClientId = Number(clientId);
    if (!numericClientId || !title) {
        return res.status(400).json({ message: 'clientId and title are required.' });
    }
    db.run(
        `INSERT INTO budgets (client_id, title, description, amount, status, sections)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            numericClientId,
            title,
            description || null,
            amount ?? null,
            status || null,
            JSON.stringify(Array.isArray(sections) ? sections : []),
        ],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            const budgetId = this.lastID;
            db.get(`${BUDGET_SELECT_BASE} WHERE budgets.id = ?`, [budgetId], async (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                const newBudget = mapBudgetRow(row);

                // Enviar notificación automática
                sendAutoNotification(
                    'budget_created',
                    `Nuevo presupuesto creado: ${newBudget.title} - Cliente: ${newBudget.clientName} - Monto: ${newBudget.amount}`,
                    newBudget,
                    []
                ).catch(err => console.error('Error en notificación:', err));

                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'create',
                    resource: 'budget',
                    details: { budgetId: newBudget.id, title: newBudget.title, clientId: newBudget.clientId },
                    ip: req.ip
                });

                res.status(201).json(newBudget);
            });
        }
    );
});

app.put('/api/budgets/:id', (req, res) => {
    db.get('SELECT * FROM budgets WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!existing) return res.status(404).json({ message: 'Budget not found' });
        const parsedClientId = Number(req.body.clientId ?? existing.client_id);
        const clientId = Number.isNaN(parsedClientId) ? existing.client_id : parsedClientId;
        const sectionsPayload = Array.isArray(req.body.sections)
            ? JSON.stringify(req.body.sections)
            : existing.sections;
        const payload = {
            title: req.body.title ?? existing.title,
            description: req.body.description ?? existing.description,
            amount: req.body.amount ?? existing.amount,
            status: req.body.status ?? existing.status,
            clientId,
            sections: sectionsPayload,
        };
        db.run(
            `UPDATE budgets
       SET title = ?, description = ?, amount = ?, status = ?, client_id = ?, sections = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                payload.title,
                payload.description,
                payload.amount,
                payload.status,
                payload.clientId,
                payload.sections,
                req.params.id,
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                db.get(`${BUDGET_SELECT_BASE} WHERE budgets.id = ?`, [req.params.id], async (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });
                    const updatedBudget = mapBudgetRow(row);

                    // Enviar notificación si cambió el estado
                    if (existing.status !== payload.status) {
                        let eventId = null;
                        if (payload.status === 'Aprobado' || payload.status === 'Confirmado') {
                            eventId = 'budget_approved';
                        } else if (payload.status === 'Rechazado' || payload.status === 'Cancelado') {
                            eventId = 'budget_rejected';
                        }

                        if (eventId) {
                            sendAutoNotification(
                                eventId,
                                `Presupuesto ${payload.status.toLowerCase()}: ${updatedBudget.title} - Cliente: ${updatedBudget.clientName}`,
                                updatedBudget,
                                []
                            ).catch(err => console.error('Error en notificación:', err));
                        }
                    }

                    res.json(updatedBudget);

                    await auditService.logEvent({
                        user: req.user ? req.user.email : 'system',
                        action: 'update',
                        resource: 'budget',
                        details: { budgetId: updatedBudget.id, title: updatedBudget.title, status: updatedBudget.status },
                        ip: req.ip
                    });
                });
            }
        );
    });
});

app.delete('/api/budgets/:id', (req, res) => {
    const budgetId = Number(req.params.id);
    if (Number.isNaN(budgetId)) {
        return res.status(400).json({ message: 'Identificador de presupuesto inválido.' });
    }

    db.get('SELECT file_path FROM budgets WHERE id = ?', [budgetId], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: 'Budget not found.' });

        if (row.file_path) {
            const absolutePath = path.resolve(__dirname, row.file_path.replace(/^\//, ''));
            fs.unlink(absolutePath, () => { });
        }

        db.run('DELETE FROM budget_items WHERE budget_id = ?', [budgetId], (itemsErr) => {
            if (itemsErr) {
                console.error('Failed to remove related budget items:', itemsErr);
            }
            db.run('DELETE FROM budgets WHERE id = ?', [budgetId], async (deleteErr) => {
                if (deleteErr) return res.status(500).json({ message: deleteErr.message });

                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'delete',
                    resource: 'budget',
                    details: { budgetId: req.params.id },
                    ip: req.ip
                });

                res.json({ message: 'Budget deleted successfully.' });
            });
        });
    });
});

app.post('/api/budgets/:id/cover', budgetShareUpload.single('cover'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Cover file is required.' });
    }
    const relativePath = `/uploads/budgets/${path.basename(req.file.path)}`;
    db.run(
        'UPDATE budgets SET file_path = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [relativePath, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.json({ url: relativePath });
        }
    );
});

app.post('/api/budgets/:id/share', budgetShareUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File is required.' });
    }
    const relativePath = `/uploads/budgets/${path.basename(req.file.path)}`;
    res.json({ url: relativePath });
});
const mapBudgetItemRow = (row) => ({
    id: String(row.id),
    budgetId: String(row.budget_id),
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    productId: row.product_id ? String(row.product_id) : undefined,
    total: row.quantity * row.unit_price,
});

const mapProductRow = (row) => ({
    id: String(row.id),
    name: row.name,
    description: row.description || "",
    manufacturer: row.manufacturer || "",
    category: row.category || "",
    priceUYU: row.price_uyu ?? 0,
    priceUSD: row.price_usd ?? 0,
    badge: row.badge || "Servicio",
    imageUrl: row.image_url || "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

// Budget Items routes
app.get('/api/budgets/:id/items', (req, res) => {
    db.all('SELECT * FROM budget_items WHERE budget_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapBudgetItemRow));
    });
});

app.post('/api/budgets/:id/items', (req, res) => {
    const { description, quantity, unitPrice, productId } = req.body;
    const budgetId = req.params.id;

    if (!description || quantity === undefined || unitPrice === undefined) {
        return res.status(400).json({ message: 'Description, quantity, and unitPrice are required.' });
    }

    db.run(
        'INSERT INTO budget_items (budget_id, product_id, description, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        [budgetId, productId ?? null, description, quantity, unitPrice],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            db.get('SELECT * FROM budget_items WHERE id = ?', [this.lastID], (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                res.status(201).json(mapBudgetItemRow(row));
            });
        }
    );
});

app.put('/api/items/:itemId', (req, res) => {
    const { description, quantity, unitPrice, productId } = req.body;
    const { itemId } = req.params;

    if (!description || quantity === undefined || unitPrice === undefined) {
        return res.status(400).json({ message: 'Description, quantity, and unitPrice are required.' });
    }

    db.run(
        'UPDATE budget_items SET description = ?, quantity = ?, unit_price = ?, product_id = ? WHERE id = ?',
        [description, quantity, unitPrice, productId ?? null, itemId],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Budget item not found.' });
            }
            db.get('SELECT * FROM budget_items WHERE id = ?', [itemId], (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                res.json(mapBudgetItemRow(row));
            });
        }
    );
});

app.delete('/api/items/:itemId', (req, res) => {
    const { itemId } = req.params;
    db.run('DELETE FROM budget_items WHERE id = ?', [itemId], function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Budget item not found.' });
        res.json({ message: 'Budget item deleted successfully.' });
    });
});

// Product routes
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapProductRow));
    });
});

app.post('/api/products', (req, res) => {
    const {
        name,
        description,
        manufacturer,
        category,
        badge = 'Servicio',
        priceUYU = 0,
        priceUSD = 0,
        imageUrl,
    } = req.body;

    if (!name || !manufacturer) {
        return res.status(400).json({ message: 'Name and manufacturer are required.' });
    }

    db.run(
        `INSERT INTO products (name, description, manufacturer, category, badge, price_uyu, price_usd, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            description || null,
            manufacturer,
            category || null,
            badge,
            priceUYU,
            priceUSD,
            imageUrl || null,
        ],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            db.get('SELECT * FROM products WHERE id = ?', [this.lastID], async (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                const newProduct = mapProductRow(row);

                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'create',
                    resource: 'product',
                    details: { productId: newProduct.id, name: newProduct.name },
                    ip: req.ip
                });

                res.status(201).json(newProduct);
            });
        }
    );
});

app.put('/api/products/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!existing) return res.status(404).json({ message: 'Product not found' });

        const payload = {
            name: req.body.name ?? existing.name,
            description: req.body.description ?? existing.description,
            manufacturer: req.body.manufacturer ?? existing.manufacturer,
            category: req.body.category ?? existing.category,
            badge: req.body.badge ?? existing.badge,
            priceUYU: req.body.priceUYU ?? existing.price_uyu,
            priceUSD: req.body.priceUSD ?? existing.price_usd,
            imageUrl: req.body.imageUrl ?? existing.image_url,
        };

        db.run(
            `UPDATE products
       SET name = ?, description = ?, manufacturer = ?, category = ?, badge = ?, price_uyu = ?, price_usd = ?, image_url = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                payload.name,
                payload.description,
                payload.manufacturer,
                payload.category,
                payload.badge,
                payload.priceUYU,
                payload.priceUSD,
                payload.imageUrl,
                req.params.id,
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                db.get('SELECT * FROM products WHERE id = ?', [req.params.id], async (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });
                    const updatedProduct = mapProductRow(row);

                    await auditService.logEvent({
                        user: req.user ? req.user.email : 'system',
                        action: 'update',
                        resource: 'product',
                        details: { productId: updatedProduct.id, name: updatedProduct.name },
                        ip: req.ip
                    });

                    res.json(updatedProduct);
                });
            }
        );
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], async function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Product not found' });

        await auditService.logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'delete',
            resource: 'product',
            details: { productId: req.params.id },
            ip: req.ip
        });

        res.json({ message: 'Product deleted successfully.' });
    });
});

// Ticket routes
app.get('/api/tickets', (req, res) => {
    db.all(`${TICKET_SELECT_BASE} ORDER BY t.createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapTicketRow));
    });
});

app.get('/api/tickets/:id', (req, res) => {
    db.get(`${TICKET_SELECT_BASE} WHERE t.id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(row));
    });
});

app.post('/api/tickets', (req, res) => {
    const {
        clientId,
        title,
        priority,
        annotations = [],
        status = 'Nuevo',
        amount = null,
        visit = false,
        description = '',
        attachments = [],
        audioNotes = [],
    } = req.body;
    if (!clientId || !title || !priority) {
        return res.status(400).json({ message: 'Client, title, and priority are required.' });
    }
    const numericClientId = Number(clientId);
    if (Number.isNaN(numericClientId)) {
        return res.status(400).json({ message: 'clientId must be a valid number.' });
    }
    const annotationsText = JSON.stringify(Array.isArray(annotations) ? annotations : []);
    const attachmentsText = JSON.stringify(Array.isArray(attachments) ? attachments : []);
    const audioNotesText = JSON.stringify(Array.isArray(audioNotes) ? audioNotes : []);
    db.run(
        'INSERT INTO tickets (client_id, title, priority, status, annotations, amount, visit, description, attachments, audioNotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [numericClientId, title, priority, status, annotationsText, amount, visit ? 1 : 0, description || null, attachmentsText, audioNotesText],
        function (err) {
            if (err) return res.status(500).json({ message: err.message });
            const ticketId = this.lastID;
            db.get(`${TICKET_SELECT_BASE} WHERE t.id = ?`, [ticketId], async (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                const newTicket = mapTicketRow(row);

                const recipients = [];
                if (newTicket.clientNotificationsEnabled && newTicket.clientEmail) {
                    recipients.push(newTicket.clientEmail);
                }

                // Enviar notificación automática
                sendAutoNotification(
                    'ticket_created',
                    `Nuevo ticket creado: ${newTicket.title} - Cliente: ${newTicket.clientName}`,
                    newTicket,
                    recipients
                ).catch(err => console.error('Error en notificación:', err));

                // Registrar auditoría
                logEvent({
                    user: 'system', // Idealmente req.user.email si hubiera auth middleware aquí
                    action: 'Crear Ticket',
                    resource: 'ticket',
                    details: `Ticket creado: ${newTicket.title} (ID: ${newTicket.id})`,
                    status: 'success',
                    ip: req.ip
                });

                res.status(201).json(newTicket);
            });
        }
    );
});

app.put('/api/tickets/:id', (req, res) => {
    db.get('SELECT * FROM tickets WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!existing) return res.status(404).json({ message: 'Ticket not found' });
        const payload = {
            title: req.body.title ?? existing.title,
            status: req.body.status ?? existing.status,
            priority: req.body.priority ?? existing.priority,
            amount: req.body.amount ?? existing.amount,
            visit: req.body.visit !== undefined ? (req.body.visit ? 1 : 0) : existing.visit,
            annotations: JSON.stringify(
                Array.isArray(req.body.annotations)
                    ? req.body.annotations
                    : parseJsonColumn(existing.annotations, [])
            ),
            description: req.body.description ?? existing.description,
            attachments: JSON.stringify(
                Array.isArray(req.body.attachments)
                    ? req.body.attachments
                    : parseJsonColumn(existing.attachments, [])
            ),
            audioNotes: JSON.stringify(
                Array.isArray(req.body.audioNotes)
                    ? req.body.audioNotes
                    : parseJsonColumn(existing.audioNotes, [])
            ),
        };
        db.run(
            `UPDATE tickets
       SET title = ?, status = ?, priority = ?, amount = ?, visit = ?, annotations = ?, description = ?, attachments = ?, audioNotes = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                payload.title,
                payload.status,
                payload.priority,
                payload.amount,
                payload.visit,
                payload.annotations,
                payload.description,
                payload.attachments,
                payload.audioNotes,
                req.params.id,
            ],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                db.get(`${TICKET_SELECT_BASE} WHERE t.id = ?`, [req.params.id], async (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });
                    const updatedTicket = mapTicketRow(row);

                    if (row?.status === 'Facturar') {
                        ensurePendingPaymentForTicket(row);
                    }

                    // Enviar notificación si cambió el estado o si se solicitó explícitamente
                    const notifyClient = req.body.notifyClient === true;
                    if (existing.status !== payload.status || notifyClient) {
                        const eventId = payload.status === 'Cerrado' ? 'ticket_closed' : 'ticket_updated';

                        const recipients = [];
                        // Notificar si el cliente tiene notificaciones activadas O si se solicitó explícitamente
                        // (Asumiendo que el checkbox 'notifyClient' fuerza el envío incluso si el cliente lo tiene desactivado globalmente, 
                        // o podríamos requerir ambos. Por ahora, asumiremos que el checkbox es una acción intencional del usuario).
                        if ((updatedTicket.clientNotificationsEnabled || notifyClient) && updatedTicket.clientEmail) {
                            recipients.push(updatedTicket.clientEmail);
                        }

                        sendAutoNotification(
                            eventId,
                            `Ticket actualizado: ${updatedTicket.title} - Estado: ${payload.status} - Cliente: ${updatedTicket.clientName}`,
                            updatedTicket,
                            recipients
                        ).catch(err => console.error('Error en notificación:', err));
                    }

                    // Registrar auditoría
                    logEvent({
                        user: 'system',
                        action: 'Actualizar Ticket',
                        resource: 'ticket',
                        details: `Ticket actualizado: ${updatedTicket.title} (ID: ${updatedTicket.id}). Cambios: ${JSON.stringify(payload)}`,
                        status: 'success',
                        ip: req.ip
                    });

                    res.json(updatedTicket);
                });
            }
        );
    });
});

app.delete('/api/tickets/:id', (req, res) => {
    db.run('DELETE FROM tickets WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Ticket not found' });
        res.json({ message: 'Ticket deleted successfully.' });
    });
});

app.get('/api/clients/:id/tickets', (req, res) => {
    db.all(`${TICKET_SELECT_BASE} WHERE t.client_id = ? ORDER BY t.createdAt DESC`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapTicketRow));
    });
});

app.get('/api/calendar-events', (req, res) => {
    db.all('SELECT * FROM calendar_events ORDER BY start ASC', (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows.map(mapCalendarEventRow));
    });
});

app.post('/api/calendar-events', (req, res) => {
    const { title, start, end = null, location = null } = req.body;
    if (!title || !start) {
        return res.status(400).json({ message: 'Title and start date are required.' });
    }
    db.run(
        'INSERT INTO calendar_events (title, location, start, end) VALUES (?, ?, ?, ?)',
        [title, location, start, end],
        function (insertErr) {
            if (insertErr) return res.status(500).json({ message: insertErr.message });
            const eventId = this.lastID;
            db.get('SELECT * FROM calendar_events WHERE id = ?', [eventId], async (selectErr, row) => {
                if (selectErr) return res.status(500).json({ message: selectErr.message });
                const newEvent = mapCalendarEventRow(row);

                // Enviar notificación automática
                sendAutoNotification(
                    'event_created',
                    `Nuevo evento creado: ${newEvent.title} - Fecha: ${newEvent.start}${newEvent.location ? ` - Lugar: ${newEvent.location}` : ''}`,
                    newEvent,
                    []
                ).catch(err => console.error('Error en notificación:', err));

                await auditService.logEvent({
                    user: req.user ? req.user.email : 'system',
                    action: 'create',
                    resource: 'calendar_event',
                    details: { eventId: newEvent.id, title: newEvent.title, start: newEvent.start },
                    ip: req.ip
                });

                res.status(201).json(newEvent);
            });
        }
    );
});

app.put('/api/calendar-events/:id', (req, res) => {
    db.get('SELECT * FROM calendar_events WHERE id = ?', [req.params.id], (getErr, existing) => {
        if (getErr) return res.status(500).json({ message: getErr.message });
        if (!existing) return res.status(404).json({ message: 'Evento no encontrado.' });
        const payload = {
            title: req.body.title ?? existing.title,
            location: req.body.location ?? existing.location,
            start: req.body.start ?? existing.start,
            end: req.body.end ?? existing.end,
        };
        db.run(
            `UPDATE calendar_events SET title = ?, location = ?, start = ?, end = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            [payload.title, payload.location, payload.start, payload.end, req.params.id],
            function (updateErr) {
                if (updateErr) return res.status(500).json({ message: updateErr.message });
                db.get('SELECT * FROM calendar_events WHERE id = ?', [req.params.id], async (selectErr, row) => {
                    if (selectErr) return res.status(500).json({ message: selectErr.message });
                    const updatedEvent = mapCalendarEventRow(row);

                    await auditService.logEvent({
                        user: req.user ? req.user.email : 'system',
                        action: 'update',
                        resource: 'calendar_event',
                        details: { eventId: updatedEvent.id, title: updatedEvent.title },
                        ip: req.ip
                    });

                    res.json(updatedEvent);
                });
            }
        );
    });
});

const startServer = async () => {
    const engine = await determineDbEngine();
    if (engine === 'mongodb') {
        try {
            const dbConfig = getDbConfigFromFile();
            await initMongo({ uri: dbConfig.mongoUri, dbName: dbConfig.mongoDb });
        } catch (mongoErr) {
            console.warn('No se pudo conectar a MongoDB:', mongoErr.message);
        }
    } else {
        console.log('Modo SQLite activo, MongoDB no se inicializa.');
    }

    console.log(`Motor activo: ${getCurrentDbEngine()}`);
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error('Error arrancando el servidor:', error);
    process.exit(1);
});

