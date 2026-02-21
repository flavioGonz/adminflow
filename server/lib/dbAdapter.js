const { getMongoDb } = require('./mongoClient');

const dbAdapter = {
    engine: 'mongodb',
    async find(coll, q = {}, opt = {}) {
        const db = getMongoDb();
        if (!db) return [];
        return await db.collection(coll).find(q, opt).toArray();
    },
    async findOne(coll, q = {}) {
        const db = getMongoDb();
        if (!db) return null;
        return await db.collection(coll).findOne(q);
    },
    async insertOne(coll, doc) {
        const db = getMongoDb();
        if (!db) return null;
        return await db.collection(coll).insertOne(doc);
    }
};

module.exports = { getDbAdapter: async () => dbAdapter };
