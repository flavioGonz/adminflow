const express = require('express');
const cors = require('cors');
const session = require('express-session');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
// sqlite3 removido de las rutas activas
const { MongoClient, ObjectId } = require('mongodb');

// db.js removido gradualmente de las rutas activas
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
const {
    trackRegisteredUser,
    listRegisteredUsers,
    updateRegisteredUser,
    syncSqliteUserToMongo,
} = require('./lib/userService');
const userServiceV2 = require('./lib/userServiceV2');
const { listGroups, createGroup, updateGroup, deleteGroup } = require('./lib/groupService');
// sqliteSync removido
// const { syncLocalToMongo } = require('./lib/mongo-sync');

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Servir archivos estáticos de Next.js
app.use('/_next/static', express.static(path.resolve(__dirname, '../client/.next/static'), {
    maxAge: '365d', // Cache los archivos estáticos por 1 año
    immutable: true,
}));

// Servir archivos públicos
app.use(express.static(path.resolve(__dirname, '../client/public')));

// Servir archivos de Next.js (*.js, *.css, etc.)
app.use(express.static(path.resolve(__dirname, '../client/.next'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.json') || path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Content-Type', path.endsWith('.json') ? 'application/json' :
                path.endsWith('.js') ? 'application/javascript' : 'text/css');
        }
    },
}));

app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

const ensureMongoDb = (res) => {
    const mongoDb = getMongoDb();
    if (!mongoDb) {
        res.status(503).json({ message: 'MongoDB no está conectado.' });
        return null;
    }
    return mongoDb;
};

const withMappedId = (doc) => ({
    ...doc,
    id: doc?.id ? doc.id : String(doc?._id ?? ''),
});

// Routes
const accessRoutes = require('./routes/access');
const diagramRoutes = require('./routes/diagrams');
const installRoutes = require('./routes/install');
const systemBackupRoutes = require('./routes/system-backup');
const databaseRoutes = require('./routes/database');
const implementationRoutes = require('./routes/implementation');
const mongoServersRoutes = require('./routes/mongo-servers');
const statusRoutes = require('./routes/status');
const supportArticlesRoutes = require('./routes/support/articles');
const repositoryEntriesRoutes = require('./routes/repository');
const fileManagerRoutes = require('./routes/file-manager');
const workflowRoutes = require('./routes/workflows');
const budgetRoutes = require('./routes/budgets');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const manufacturerRoutes = require('./routes/manufacturers');
const supplierCatalogRoutes = require('./routes/suppliers-catalog');
const { checkInstallation } = require('./middleware/checkInstallation');

// Installation routes (always accessible)
app.use('/api/install', installRoutes);

// Check if system is installed before allowing other routes
app.use('/api', checkInstallation);

// Protected routes (require installation)
app.use('/api', accessRoutes);
app.use('/api', diagramRoutes);
app.use('/api', implementationRoutes);
app.use('/api/system', systemBackupRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/mongo-servers', mongoServersRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/support', supportArticlesRoutes);
app.use('/api', repositoryEntriesRoutes);
app.use('/api/files', fileManagerRoutes);
app.use('/api/repository', fileManagerRoutes); // Keep for compatibility if needed
app.use('/api/workflows', workflowRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/suppliers-catalog', supplierCatalogRoutes);


const MongoStore = require('connect-mongo');

app.use(
    session({
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI || DB_CONFIG_DEFAULTS.mongoUri,
            dbName: process.env.MONGODB_DB || DB_CONFIG_DEFAULTS.mongoDb,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60, // 1 day
            autoRemove: 'native'
        }),
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

// Avatar uploads
const avatarUploadsRoot = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(avatarUploadsRoot)) {
    fs.mkdirSync(avatarUploadsRoot, { recursive: true });
}
const avatarStorage = multer.diskStorage({
    destination: avatarUploadsRoot,
    filename: (req, file, cb) => {
        const id = req.params.id || req.body.userId || req.user?.userId || 'user';
        cb(null, `avatar-${id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
});

const parseJsonColumn = (value, fallback = []) => {
    if (!value) return Array.isArray(fallback) ? fallback : fallback ?? null;
    if (typeof value === 'object') return value; // MongoDB handles objects/arrays natively
    try {
        return JSON.parse(value);
    } catch {
        return Array.isArray(fallback) ? fallback : fallback ?? null;
    }
};

const getId = (doc) => {
    if (!doc) return null;
    return doc.id !== undefined ? String(doc.id) : String(doc._id || '');
};

const mapClientRow = (row) => ({
    ...row,
    id: getId(row),
    contract: !!row.contract,
    notificationsEnabled: !!row.notifications_enabled || !!row.notificationsEnabled,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    avatarUrl: row.avatarUrl || null,
    recurringAmount: row.recurringAmount ?? 0,
    recurringCurrency: row.recurringCurrency || "UYU",
    recurringPaymentEnabled: !!row.recurringPaymentEnabled,
});

const mapTicketRow = (row) => ({
    ...row,
    id: getId(row),
    clientId: row.clientId !== undefined ? String(row.clientId) : (row.client_id !== undefined ? String(row.client_id) : undefined),
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
    assignedTo: row.assignedTo || null,
    assignedGroupId: row.assignedGroupId || null,
    visitData: parseJsonColumn(row.visit_data, null),
    clientNotificationsEnabled: !!row.clientNotificationsEnabled,
    clientEmail: row.clientEmail || '',
});

const extractClientIds = (rows) => {
    const clientIds = new Set();
    rows.forEach((row) => {
        const clientIdValue = row.client_id ?? row.clientId;
        if (clientIdValue !== undefined && clientIdValue !== null) {
            clientIds.add(String(clientIdValue));
        }
    });
    return Array.from(clientIds);
};

const buildClientMap = async (mongoDb, clientIds = []) => {
    if (!clientIds.length) return {};
    const numericIds = [];
    const stringIds = [];
    clientIds.forEach((value) => {
        if (value === undefined || value === null) return;
        const normalized = String(value);
        const parsed = Number(normalized);
        if (!Number.isNaN(parsed)) {
            numericIds.push(parsed);
        }
        stringIds.push(normalized);
    });
    const orClauses = [];
    if (numericIds.length) {
        orClauses.push({ id: { $in: numericIds } });
    }
    if (stringIds.length) {
        orClauses.push({ id: { $in: stringIds } });
    }
    if (!orClauses.length) return {};
    const clients = await mongoDb.collection('clients').find({ $or: orClauses }).toArray();
    const map = {};
    clients.forEach((client) => {
        const key = client.id !== undefined ? String(client.id) : null;
        if (key) {
            map[key] = client.name || client.clientName || "";
        }
        const idFromDoc = getId(client);
        if (idFromDoc) {
            map[idFromDoc] = client.name || client.clientName || "";
        }
    });
    return map;
};

const buildIdFilter = (entityId) => {
    if (!entityId) return null;
    const filters = [];
    const numericId = Number(entityId);
    if (!Number.isNaN(numericId)) {
        filters.push({ id: numericId });
    }
    filters.push({ id: entityId });
    if (ObjectId.isValid(entityId)) {
        filters.push({ _id: new ObjectId(entityId) });
    }
    return filters.length ? { $or: filters } : null;
};

const mapContractRow = (row, clientMap = {}) => {
    const clientIdValue = row.client_id ?? row.clientId;
    const normalizedClientId = clientIdValue !== undefined && clientIdValue !== null ? String(clientIdValue) : undefined;
    return {
        ...row,
        id: getId(row),
        clientId: normalizedClientId,
        clientName: clientMap[normalizedClientId] ?? row.clientName ?? "",
        title: row.title || row.contract_name || "",
        description: row.description || "",
        startDate: row.startDate || null,
        endDate: row.endDate || null,
        status: row.status || "",
        sla: row.sla || "",
        contractType: row.contractType || "",
        amount: row.amount,
        currency: row.currency || 'ARS',
        filePath: row.file_path || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        recurrence: row.recurrence || row.recurring || "",
    };
};


const mapCalendarEventRow = (row) => ({
    ...row,
    id: getId(row),
    title: row.title,
    start: row.start,
    end: row.end || null,
    location: row.location || null,
    sourceType: row.source_type || 'manual',
    sourceId: row.source_id || null,
    clientId: row.ticket_client_id || row.payment_client_id || row.contract_client_id || null,
    assignedTo: row.ticket_assigned_to || null,
    assignedGroup: row.ticket_assigned_group || null,
    locked: !!row.locked,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});


const upsertCalendarEvent = ({
    title,
    start,
    end = null,
    location = null,
    sourceType = 'manual',
    sourceId = null,
    locked = false,
}) =>
    new Promise((resolve, reject) => {
        // SQLite calendar logic removed for brevity, will be replaced by Mongo logic in dedicated routes
        resolve({ id: 'disabled-sqlite-calendar' });
    });

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
    ...row,
    id: getId(row),
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

app.get('/api-docs', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>AdminFlow API Documentation</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
            <script>
                window.onload = () => {
                    window.ui = SwaggerUIBundle({
                        url: '/swagger.json',
                        dom_id: '#swagger-ui',
                    });
                };
            </script>
        </body>
        </html>
    `);
});

app.get('/swagger.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'swagger.json'));
});

app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/register', async (req, res) => {
    const { email, password, name, role = 'user' } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        // Crear usuario en MongoDB
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await mongoDb.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Crear usuario
        const newUser = {
            email,
            password: hash,
            name: name || email.split('@')[0],
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await mongoDb.collection('users').insertOne(newUser);

        // Audit log
        await logEvent({
            user: 'system',
            action: 'create',
            resource: 'user',
            details: { userId: result.insertedId, email },
            ip: req.ip
        });

        return res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertedId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error during registration', detail: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const user = await mongoDb.collection('users').findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password field exists
        if (!user.password) {
            return res.status(401).json({ message: 'Invalid credentials - password not set' });
        }

        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        req.session.userId = user._id;
        return res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
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

app.get('/api/users', async (req, res) => {
    const mongoDb = getMongoDb();
    if (!mongoDb) {
        return res.status(503).json({ message: 'MongoDB no está conectado.' });
    }

    try {
        const groups = await listGroups();
        const groupMap = groups.reduce((acc, group) => {
            const gid = (group._id || group.id)?.toString();
            if (gid) acc[gid] = group;
            return acc;
        }, {});
        const users = await mongoDb.collection('users').find({}).toArray();
        res.json(users.map(u => ({
            id: u._id,
            email: u.email,
            name: u.name || u.email.split('@')[0],
            role: u.role || 'user',
            avatar: u.avatar || null,
            groupId: u.groupId || null,
            groupName: u.groupId ? groupMap[u.groupId]?.name || null : null,
        })));
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        let updated = await updateRegisteredUser(req.params.id, updates);
        let source = 'mongo';

        if (!updated) {
            return res.status(404).json({ message: 'Usuario no encontrado en MongoDB' });
        }

        const targetId = updated._id?.toString?.() || req.params.id;

        logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'update',
            resource: 'user',
            details: {
                userId: targetId,
                updates: Object.keys(updates),
                source,
            },
            ip: req.ip,
        }).catch(() => { });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando usuario', detail: error.message });
    }
});

// Register new user
app.post('/api/users/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        // Check if user already exists
        const existingUser = await mongoDb.collection('users').findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            email,
            password: hashedPassword,
            name: email.split('@')[0],
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await mongoDb.collection('users').insertOne(newUser);

        // Audit log
        await logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'create',
            resource: 'user',
            details: { userId: result.insertedId, email },
            ip: req.ip
        });

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertedId,
            email
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error al registrar usuario', detail: error.message });
    }
});

// Upload avatar
app.post('/api/users/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
    const userId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const { ObjectId } = require('mongodb');
        // Determinar filtro: numérico o ObjectId
        const numericId = Number(userId);
        const filter = (!isNaN(numericId) && userId.toString() === numericId.toString())
            ? { _id: numericId }
            : (ObjectId.isValid(userId) && userId.length === 24)
                ? { _id: new ObjectId(userId) }
                : { _id: userId };

        const result = await mongoDb.collection('users').updateOne(
            filter,
            { $set: { avatar: avatarPath, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ avatarUrl: avatarPath, message: 'Avatar actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar avatar', detail: error.message });
    }
});

// Update user profile (name, avatar, etc.)
app.patch('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, avatar } = req.body;

    if (!name && !avatar) {
        return res.status(400).json({ message: 'Proporciona al menos un campo para actualizar' });
    }

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (avatar) updates.avatar = avatar;
        updates.updatedAt = new Date();

        const { ObjectId } = require('mongodb');
        // Determinar filtro: numérico o ObjectId
        const numericId = Number(userId);
        const filter = (!isNaN(numericId) && userId.toString() === numericId.toString())
            ? { _id: numericId }
            : (ObjectId.isValid(userId) && userId.length === 24)
                ? { _id: new ObjectId(userId) }
                : { _id: userId };

        const result = await mongoDb.collection('users').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(result.value);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario', detail: error.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const { ObjectId } = require('mongodb');
        // Determinar filtro: numérico o ObjectId
        const numericId = Number(userId);
        const filter = (!isNaN(numericId) && userId.toString() === numericId.toString())
            ? { _id: numericId }
            : (ObjectId.isValid(userId) && userId.length === 24)
                ? { _id: new ObjectId(userId) }
                : { _id: userId };

        const result = await mongoDb.collection('users').deleteOne(filter);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Audit log
        await logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'delete',
            resource: 'user',
            details: { userId },
            ip: req.ip
        });

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario', detail: error.message });
    }
});

// Reset user password
app.patch('/api/users/:id/password', async (req, res) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: 'Nueva contraseña es requerida' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { ObjectId } = require('mongodb');
        // Determinar filtro: numérico o ObjectId
        const numericId = Number(userId);
        const filter = (!isNaN(numericId) && userId.toString() === numericId.toString())
            ? { _id: numericId }
            : (ObjectId.isValid(userId) && userId.length === 24)
                ? { _id: new ObjectId(userId) }
                : { _id: userId };

        const result = await mongoDb.collection('users').updateOne(
            filter,
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Audit log
        await logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'update',
            resource: 'user',
            details: { userId, action: 'password_reset', source: 'mongo' },
            ip: req.ip
        }).catch(() => { });

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar contraseña', detail: error.message });
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


app.get('/api/system/database', async (req, res) => {
    try {
        const config = getDbConfigFromFile();
        res.json({
            module: 'database',
            data: {
                engine: config.engine,
                mongoUri: config.mongoUri,
                mongoDb: config.mongoDb
            },
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
    // Solo permitir campos Mongo
    const allowed = {
        engine: 'mongodb',
        mongoUri: payload.mongoUri,
        mongoDb: payload.mongoDb
    };
    try {
        const updated = updateDbConfig(allowed);
        res.json({
            module: 'database',
            data: updated,
            engine: 'mongodb',
        });
    } catch (error) {
        res.status(500).json({ message: 'Error guardando la configuración de base', detail: error.message });
    }
});

app.post('/api/system/database/verify', async (req, res) => {
    const { engine, mongoUri, mongoDb } = req.body || {};
    const dbConfig = getDbConfigFromFile();
    try {
        if (engine === 'mongodb' || !engine) {
            const targetUri = mongoUri || dbConfig.mongoUri;
            const targetDbName = mongoDb || dbConfig.mongoDb || DB_CONFIG_DEFAULTS.mongoDb;
            if (!targetUri) {
                return res.status(400).json({ message: 'Debe indicar la URI de MongoDB.' });
            }
            await testMongoConnection(targetUri, targetDbName);
            return res.json({
                engine: 'mongodb',
                ok: true,
                info: `Conexión correcta con MongoDB en ${targetUri}/${targetDbName}`,
            });
        }
        res.status(400).json({ message: 'Motor no soportado. Este sistema usa MongoDB exclusivamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verificando la base de datos', detail: error.message });
    }
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
        const mongoSummary = await summarizeMongo();
        res.json({
            mongo: mongoSummary,
            engine: 'mongodb',
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generando resumen de bases', detail: error.message });
    }
});

app.post('/api/system/database/collections', async (req, res) => {
    try {
        const { uri } = req.body;

        if (uri) {
            // Connect to specific URI
            const { MongoClient } = require('mongodb');
            let client;
            try {
                client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
                await client.connect();
                const db = client.db();
                const collectionList = await db.listCollections().toArray();

                // Get stats for each collection
                const collectionsWithStats = await Promise.all(
                    collectionList.map(async (col) => {
                        try {
                            const collection = db.collection(col.name);
                            const count = await collection.countDocuments();
                            const stats = await collection.stats();
                            return {
                                name: col.name,
                                count: count,
                                size: stats.size || 0
                            };
                        } catch (error) {
                            return {
                                name: col.name,
                                count: 0,
                                size: 0
                            };
                        }
                    })
                );

                await client.close();

                res.json({
                    success: true,
                    collections: collectionsWithStats
                });
            } catch (error) {
                if (client) await client.close().catch(() => { });
                throw error;
            }
        } else {
            // Use current connection
            const mongoDb = getMongoDb();
            if (!mongoDb) {
                return res.status(503).json({
                    success: false,
                    message: 'MongoDB no está conectado'
                });
            }

            const collectionList = await mongoDb.listCollections().toArray();

            // Get stats for each collection
            const collectionsWithStats = await Promise.all(
                collectionList.map(async (col) => {
                    try {
                        const collection = mongoDb.collection(col.name);
                        const count = await collection.countDocuments();
                        const stats = await collection.stats();
                        return {
                            name: col.name,
                            count: count,
                            size: stats.size || 0
                        };
                    } catch (error) {
                        return {
                            name: col.name,
                            count: 0,
                            size: 0
                        };
                    }
                })
            );

            res.json({
                success: true,
                collections: collectionsWithStats
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener colecciones',
            detail: error.message
        });
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

app.get('/api/system/database/export/mongodb', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=mongodb-snapshot.json`);
    res.send(JSON.stringify({ message: `Export simulado de mongodb`, timestamp: new Date().toISOString() }));
});

app.post('/api/db/select', async (req, res) => {
    res.status(400).json({ message: 'Este endpoint está desactivado. El sistema usa MongoDB exclusivamente.' });
});

/*
app.post('/api/db/sync', async (req, res) => {
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
});
*/

app.post('/api/db/reset', async (req, res) => {
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
});

/*
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
*/

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
    res.json([]);
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

const mapProductRow = (row) => ({
    ...row,
    id: getId(row),
    priceUyu: row.price_uyu ?? row.priceUyu,
    priceUsd: row.price_usd ?? row.priceUsd,
});

// Tickets
app.get('/api/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const rows = await mongoDb.collection('tickets').find().sort({ createdAt: -1 }).toArray();
        res.json(rows.map(mapTicketRow));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const row = await mongoDb.collection('tickets').findOne(getMongoFilter(req.params.id));
        if (!row) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(row));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('tickets');
        
        // Fetch client name if clientId is present
        let clientName = req.body.clientName;
        if (!clientName && req.body.clientId) {
            const { getMongoFilter } = require('./lib/clientFilters');
            const client = await mongoDb.collection('clients').findOne(getMongoFilter(req.body.clientId));
            if (client) {
                clientName = client.name;
            }
        }

        const newTicket = {
            ...req.body,
            id,
            clientName: clientName || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await mongoDb.collection('tickets').insertOne(newTicket);
        res.status(201).json(mapTicketRow(newTicket));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const filter = getMongoFilter(req.params.id);
        
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        delete updates._id;
        delete updates.id;

        // Update client name if clientId is present and clientName is not
        if (!updates.clientName && updates.clientId) {
            const client = await mongoDb.collection('clients').findOne(getMongoFilter(updates.clientId));
            if (client) {
                updates.clientName = client.name;
            }
        }

        const result = await mongoDb.collection('tickets').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        const updatedDoc = result.value || result;
        if (!updatedDoc) return res.status(404).json({ message: 'Ticket not found' });
        res.json(mapTicketRow(updatedDoc));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/tickets/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const result = await mongoDb.collection('tickets').deleteOne(getMongoFilter(req.params.id));
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Ticket not found' });
        res.json({ message: 'Ticket deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Groups
app.get('/api/groups', async (req, res) => {
    try {
        const groups = await listGroups();
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/groups', async (req, res) => {
    try {
        const group = await createGroup(req.body);
        res.status(201).json(group);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Contracts
app.get('/api/contracts', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const rows = await mongoDb.collection('contracts').find().sort({ createdAt: -1 }).toArray();
        const clientIds = extractClientIds(rows);
        const clientMap = await buildClientMap(mongoDb, clientIds);
        res.json(rows.map((row) => mapContractRow(row, clientMap)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/contracts', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('contracts');
        const newContract = {
            ...req.body,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await mongoDb.collection('contracts').insertOne(newContract);
        const clientMap = await buildClientMap(mongoDb, [newContract.clientId ?? newContract.client_id]);
        res.status(201).json(mapContractRow(newContract, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/contracts/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    const filter = buildIdFilter(req.params.id);
    if (!filter) {
        return res.status(400).json({ message: 'ID de contrato inválido.' });
    }
    try {
        const row = await mongoDb.collection('contracts').findOne(filter);
        if (!row) {
            return res.status(404).json({ message: 'Contrato no encontrado.' });
        }
        const clientMap = await buildClientMap(mongoDb, extractClientIds([row]));
        res.json(mapContractRow(row, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/contracts/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    const filter = buildIdFilter(req.params.id);
    if (!filter) {
        return res.status(400).json({ message: 'ID de contrato inválido.' });
    }
    try {
        const updates = {
            ...req.body,
            updatedAt: new Date().toISOString(),
        };
        const result = await mongoDb.collection('contracts').findOneAndUpdate(
            filter,
            { $set: updates },
            { returnDocument: 'after' }
        );
        if (!result.value) {
            return res.status(404).json({ message: 'Contrato no encontrado.' });
        }
        const clientMap = await buildClientMap(mongoDb, extractClientIds([result.value]));
        res.json(mapContractRow(result.value, clientMap));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/contracts/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    const filter = buildIdFilter(req.params.id);
    if (!filter) {
        return res.status(400).json({ message: 'ID de contrato inválido.' });
    }
    try {
        const result = await mongoDb.collection('contracts').deleteOne(filter);
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Contrato no encontrado.' });
        }
        res.json({ message: 'Contrato eliminado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Payments
app.get('/api/payments', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const rows = await mongoDb.collection('payments').find().sort({ createdAt: -1 }).toArray();
        res.json(rows.map(mapPaymentRow));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/payments', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('payments');
        const newPayment = {
            ...req.body,
            id,
            createdAt: new Date().toISOString()
        };
        await mongoDb.collection('payments').insertOne(newPayment);
        res.status(201).json(mapPaymentRow(newPayment));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Products
app.get('/api/products', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const rows = await mongoDb.collection('products').find().toArray();
        res.json(rows.map(mapProductRow));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getNextId } = require('./lib/mongoClient');
        const id = await getNextId('products');
        const newProduct = {
            ...req.body,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await mongoDb.collection('products').insertOne(newProduct);
        res.status(201).json(mapProductRow(newProduct));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Client routes
app.get('/api/clients', async (req, res) => {
    try {
        let clients;

        const mongoDb = getMongoDb();
        if (!mongoDb) {
            return res.status(503).json({ message: 'MongoDB no está conectado.' });
        }
        const rows = await mongoDb.collection('clients').find().toArray();
        clients = rows.map(c => ({
            ...c,
            id: c.id !== undefined && c.id !== null ? String(c.id) : String(c._id || ''),
            notifications_enabled: c.notifications_enabled ?? c.notificationsEnabled ?? 0
        }));

        // Get contract titles for ALL clients (check contracts table, not just contract flag)
        const clientsWithContracts = await Promise.all(clients.map(async (client) => {
            // Always check for contracts in the contracts table
            const contractTitle = await new Promise(async (resolve) => {
                try {
                    const mongoDb = getMongoDb();
                    const contract = await mongoDb.collection('contracts')
                        .findOne({ clientId: client.id.toString() }, { sort: { createdAt: -1 } });
                    resolve(contract ? contract.title : null);
                } catch (e) {
                    resolve(null);
                }
            });
            return { ...client, contract: contractTitle };
        }));

        // Try to add indicators from MongoDB if available
        if (mongoDb) {
            try {
                const clientsWithIndicators = await Promise.all(clientsWithContracts.map(async (client) => {
                    let hasDiagram = false;
                    let hasAccess = false;
                    let hasFiles = false;
                    let hasImplementation = false;

                    try {
                        // Check for diagram
                        const diagram = await mongoDb.collection('client_diagrams').findOne({
                            clientId: client.id.toString()
                        });
                        hasDiagram = !!diagram;
                    } catch (e) {
                        // Silently ignore
                    }

                    try {
                        // Check for access records
                        const access = await mongoDb.collection('client_accesses').findOne({
                            clientId: client.id.toString()
                        });
                        hasAccess = !!access;
                    } catch (e) {
                        // Silently ignore
                    }

                    try {
                        // Check for files in repository
                        const files = await mongoDb.collection('repository_items').findOne({
                            clientId: client.id.toString()
                        });
                        hasFiles = !!files;
                    } catch (e) {
                        // Silently ignore
                    }

                    try {
                        const implementation = await mongoDb.collection('client_implementations').findOne({
                            clientId: client.id.toString()
                        });
                        hasImplementation = !!implementation;
                    } catch (e) {
                        // Silently ignore
                    }

                    return {
                        ...client,
                        hasDiagram,
                        hasAccess,
                        hasFiles,
                        hasImplementation
                    };
                }));

                return res.json(clientsWithIndicators);
            } catch (mongoError) {
                console.warn('MongoDB query failed, returning clients without indicators:', mongoError.message);
                // If MongoDB fails, return clients without indicators
                return res.json(clientsWithContracts);
            }
        }

        // No MongoDB, return clients with contracts
        res.json(clientsWithContracts);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).json({ message: err.message });
    }
});


// GET /api/clients/:id/tickets - Get tickets for a specific client
app.get('/api/clients/:id/tickets', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoClientFilter } = require('./lib/clientFilters');
        const filter = getMongoClientFilter(req.params.id);
        const rows = await mongoDb.collection('tickets').find(filter).sort({ createdAt: -1 }).toArray();
        res.json(rows.map(mapTicketRow));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/clients/:id/payments - Get payments for a specific client
app.get('/api/clients/:id/payments', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoClientFilter } = require('./lib/clientFilters');
        const filter = getMongoClientFilter(req.params.id);
        const rows = await mongoDb.collection('payments').find(filter).sort({ createdAt: -1 }).toArray();
        res.json(rows.map(mapPaymentRow));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/clients/:id/contracts - Get contracts for a specific client
app.get('/api/clients/:id/contracts', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoClientFilter } = require('./lib/clientFilters');
        const filter = getMongoClientFilter(req.params.id);
        const rows = await mongoDb.collection('contracts').find(filter).sort({ createdAt: -1 }).toArray();
        const clientIds = extractClientIds(rows);
        const clientMap = await buildClientMap(mongoDb, clientIds);
        res.json(rows.map((row) => mapContractRow(row, clientMap)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    const { name, alias, rut, email, phone, address, contract, notificationsEnabled } = req.body;
    const latitude = req.body.latitude ?? null;
    const longitude = req.body.longitude ?? null;
    if (!name) {
        return res.status(400).json({ message: 'Name is required.' });
    }

    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;

    try {
        const { getNextId } = require('./lib/mongoClient');
        const clientId = await getNextId('clients');

        const newClient = {
            id: clientId,
            name,
            alias: alias || null,
            rut: rut || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
            latitude,
            longitude,
            contract: !!contract,
            notificationsEnabled: !!notificationsEnabled,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await mongoDb.collection('clients').insertOne(newClient);

        await logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'create',
            resource: 'client',
            details: { clientId: newClient.id, name: newClient.name },
            ip: req.ip
        });
        res.status(201).json(mapClientRow(newClient));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/clients/:id - Get a single client
app.get('/api/clients/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const id = req.params.id;
        const filter = getMongoFilter(id);
        const row = await mongoDb.collection('clients').findOne(filter);
        if (!row) return res.status(404).json({ message: 'Client not found' });
        res.json(mapClientRow(row));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users/:id/avatar - Upload user avatar
app.post('/api/users/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const userId = req.params.id;

    try {
        const mongoDb = getMongoDb();
        if (mongoDb) {
            const { ObjectId } = require('mongodb');

            // Try to update by _id (MongoDB ID)
            let updateResult;
            try {
                const filter = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: parseInt(userId) || userId };
                updateResult = await mongoDb.collection('users').updateOne(
                    filter,
                    { $set: { avatar: avatarUrl } }
                );
            } catch (e) {
                // Invalid ObjectId, ignore
            }

            if (updateResult && updateResult.matchedCount > 0) {
                return res.json({ avatarUrl });
            }

            return res.status(404).json({ message: 'User not found' });
        } else {
            res.status(503).json({ message: 'Database not available' });
        }
    } catch (error) {
        console.error('Error uploading user avatar:', error);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    const clientId = req.params.id;
    const { name, alias, rut, email, phone, address, contract, notificationsEnabled } = req.body;

    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const filter = getMongoFilter(clientId);
        const existing = await mongoDb.collection('clients').findOne(filter);
        if (!existing) return res.status(404).json({ message: 'Client not found.' });

        const updates = {
            name: name ?? existing.name,
            alias: alias ?? existing.alias,
            rut: rut ?? existing.rut,
            email: email ?? existing.email,
            phone: phone ?? existing.phone,
            address: address ?? existing.address,
            latitude: req.body.latitude ?? existing.latitude,
            longitude: req.body.longitude ?? existing.longitude,
            contract: contract ?? existing.contract,
            notificationsEnabled: notificationsEnabled ?? existing.notificationsEnabled,
            recurringAmount: req.body.recurringAmount ?? existing.recurringAmount,
            recurringCurrency: req.body.recurringCurrency ?? existing.recurringCurrency,
            recurringPaymentEnabled: req.body.recurringPaymentEnabled ?? existing.recurringPaymentEnabled,
            updatedAt: new Date()
        };

        await mongoDb.collection('clients').updateOne(filter, { $set: updates });
        const updated = await mongoDb.collection('clients').findOne(filter);
        if (!updated) return res.status(404).json({ message: 'Error recuperando cliente actualizado.' });

        await logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'update',
            resource: 'client',
            details: { clientId: getId(updated), name: updated.name },
            ip: req.ip
        });
        res.json(mapClientRow(updated));
    } catch (err) {
        console.error('Update client error:', err);
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    const clientId = req.params.id;

    try {
        const { getMongoFilter } = require('./lib/clientFilters');
        const filter = getMongoFilter(clientId);
        const result = await mongoDb.collection('clients').deleteOne(filter);
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Client not found.' });

        await logEvent({
            user: req.user ? req.user.email : 'system',
            action: 'delete',
            resource: 'client',
            details: { clientId },
            ip: req.ip
        });

        res.json({ message: 'Client deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// System startup
const { startServer } = require('./lib/serverStart');

startServer(app, PORT).catch((error) => {
    console.error('\n❌ Error fatal arrancando el servidor:', error);
    process.exit(1);
});
