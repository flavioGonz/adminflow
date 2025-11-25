const { db } = require('../db');
const { getMongoDb } = require('./mongoClient');

const logEvent = async ({ user, action, resource, details, status = 'success', ip = 'unknown' }) => {
    const timestamp = new Date();
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details);

    // Verificar motor de BD configurado
    const { getCurrentDbEngine } = require('./dbChoice');
    const dbEngine = getCurrentDbEngine();

    // 1. Guardar en SQLite solo si es el motor configurado
    if (dbEngine === 'sqlite') {
        db.run(
            'INSERT INTO audit_logs (user, action, resource, details, status, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user || 'system', action, resource, detailsStr, status, ip, timestamp.toISOString()],
            (err) => {
                if (err) console.error('Error logging to SQLite audit_logs:', err.message);
            }
        );
    }

    // 2. Guardar en MongoDB (si está conectado y es el motor configurado)
    if (dbEngine === 'mongodb') {
        const mongoDb = getMongoDb();
        if (mongoDb) {
            try {
                await mongoDb.collection('audit_logs').insertOne({
                    user: user || 'system',
                    action,
                    resource,
                    details: typeof details === 'object' ? details : { info: details },
                    status,
                    ip,
                    createdAt: timestamp,
                });
            } catch (error) {
                console.error('Error logging to MongoDB audit_logs:', error.message);
            }
        } else {
            console.warn('⚠️  MongoDB no disponible para audit log');
        }
    }
};

const getAuditLogs = async (limit = 50, filters = {}) => {
    const mongoDb = getMongoDb();

    // Intentar leer de MongoDB primero
    if (mongoDb) {
        try {
            const query = {};
            if (filters.resource && filters.resource !== 'all') query.resource = filters.resource;
            if (filters.status && filters.status !== 'all') query.status = filters.status;
            if (filters.search) {
                query.$or = [
                    { action: { $regex: filters.search, $options: 'i' } },
                    { user: { $regex: filters.search, $options: 'i' } },
                    { 'details.info': { $regex: filters.search, $options: 'i' } }
                ];
            }

            const logs = await mongoDb
                .collection('audit_logs')
                .find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .toArray();

            return logs.map(log => ({
                ...log,
                id: log._id.toString(),
                details: JSON.stringify(log.details)
            }));
        } catch (error) {
            console.error('Error reading audit logs from MongoDB:', error.message);
            // Fallback a SQLite
        }
    }

    // Fallback a SQLite
    return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM audit_logs';
        const params = [];
        const conditions = [];

        if (filters.resource && filters.resource !== 'all') {
            conditions.push('resource = ?');
            params.push(filters.resource);
        }
        if (filters.status && filters.status !== 'all') {
            conditions.push('status = ?');
            params.push(filters.status);
        }
        if (filters.search) {
            conditions.push('(action LIKE ? OR user LIKE ? OR details LIKE ?)');
            const searchParam = `%${filters.search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC LIMIT ?';
        params.push(limit);

        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

module.exports = {
    logEvent,
    getAuditLogs,
};
