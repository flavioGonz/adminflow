// server/lib/dbAdapter.js
// Adaptador de base de datos que usa MongoDB como principal

const { getMongoClient } = require('./mongoClient');
const { determineDbEngine } = require('./dbChoice');

/**
 * Adaptador universal de base de datos
 * MongoDB es la fuente principal, SQLite es opcional para compatibilidad
 */
class DatabaseAdapter {
    constructor() {
        this.engine = 'mongodb'; // Siempre MongoDB como principal
        this.mongoClient = null;
        this.db = null;
    }

    /**
     * Inicializa la conexión a la base de datos
     */
    async initialize() {
        try {
            const config = determineDbEngine();

            if (!config.mongoUri) {
                throw new Error('MongoDB URI no configurada. Ejecuta: npm run init-mongo');
            }

            this.mongoClient = await getMongoClient();
            this.db = this.mongoClient.db(config.mongoDb || 'adminflow');

            console.log('✅ Adaptador de BD inicializado (MongoDB)');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar adaptador de BD:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene una colección de MongoDB
     */
    collection(name) {
        if (!this.db) {
            throw new Error('Base de datos no inicializada');
        }
        return this.db.collection(name);
    }

    /**
     * Ejecuta una consulta SELECT
     */
    async find(collectionName, query = {}, options = {}) {
        const collection = this.collection(collectionName);
        const cursor = collection.find(query, options);

        if (options.sort) cursor.sort(options.sort);
        if (options.limit) cursor.limit(options.limit);
        if (options.skip) cursor.skip(options.skip);

        return await cursor.toArray();
    }

    /**
     * Obtiene un solo documento
     */
    async findOne(collectionName, query = {}) {
        const collection = this.collection(collectionName);
        return await collection.findOne(query);
    }

    /**
     * Inserta un documento
     */
    async insertOne(collectionName, document) {
        const collection = this.collection(collectionName);

        // Agregar timestamps automáticamente
        const doc = {
            ...document,
            createdAt: document.createdAt || new Date(),
            updatedAt: document.updatedAt || new Date()
        };

        const result = await collection.insertOne(doc);
        return { ...doc, _id: result.insertedId };
    }

    /**
     * Inserta múltiples documentos
     */
    async insertMany(collectionName, documents) {
        const collection = this.collection(collectionName);

        const docs = documents.map(doc => ({
            ...doc,
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
        }));

        const result = await collection.insertMany(docs);
        return result;
    }

    /**
     * Actualiza un documento
     */
    async updateOne(collectionName, query, update) {
        const collection = this.collection(collectionName);

        // Agregar updatedAt automáticamente
        const updateDoc = {
            ...update,
            $set: {
                ...(update.$set || {}),
                updatedAt: new Date()
            }
        };

        const result = await collection.updateOne(query, updateDoc);
        return result;
    }

    /**
     * Actualiza múltiples documentos
     */
    async updateMany(collectionName, query, update) {
        const collection = this.collection(collectionName);

        const updateDoc = {
            ...update,
            $set: {
                ...(update.$set || {}),
                updatedAt: new Date()
            }
        };

        const result = await collection.updateMany(query, updateDoc);
        return result;
    }

    /**
     * Elimina un documento
     */
    async deleteOne(collectionName, query) {
        const collection = this.collection(collectionName);
        const result = await collection.deleteOne(query);
        return result;
    }

    /**
     * Elimina múltiples documentos
     */
    async deleteMany(collectionName, query) {
        const collection = this.collection(collectionName);
        const result = await collection.deleteMany(query);
        return result;
    }

    /**
     * Cuenta documentos
     */
    async count(collectionName, query = {}) {
        const collection = this.collection(collectionName);
        return await collection.countDocuments(query);
    }

    /**
     * Agregación
     */
    async aggregate(collectionName, pipeline) {
        const collection = this.collection(collectionName);
        return await collection.aggregate(pipeline).toArray();
    }

    /**
     * Obtiene el siguiente ID autoincremental
     */
    async getNextId(collectionName) {
        const countersCollection = this.collection('counters');

        const result = await countersCollection.findOneAndUpdate(
            { _id: collectionName },
            { $inc: { sequence: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        return result.value.sequence;
    }

    /**
     * Transacción (para operaciones que requieren atomicidad)
     */
    async transaction(callback) {
        const session = this.mongoClient.startSession();

        try {
            await session.withTransaction(async () => {
                await callback(session);
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Cierra la conexión
     */
    async close() {
        if (this.mongoClient) {
            await this.mongoClient.close();
            console.log('✅ Conexión a MongoDB cerrada');
        }
    }
}

// Singleton
let adapterInstance = null;

/**
 * Obtiene la instancia del adaptador (singleton)
 */
async function getDbAdapter() {
    if (!adapterInstance) {
        adapterInstance = new DatabaseAdapter();
        await adapterInstance.initialize();
    }
    return adapterInstance;
}

module.exports = {
    DatabaseAdapter,
    getDbAdapter
};
