const { getMongoDb } = require('./mongoClient');

const logEvent = async ({ user, action, resource, details, status = 'success', ip = 'unknown' }) => {
    const timestamp = new Date();
    
    // Guardar exclusivamente en MongoDB
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
};

const getAuditLogs = async (limit = 50, filters = {}) => {
    const mongoDb = getMongoDb();

    if (!mongoDb) {
        return [];
    }

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
        return [];
    }
};

module.exports = {
    logEvent,
    getAuditLogs,
};
