"use strict";

const { MongoClient } = require("mongodb");
const DB_CONFIG_DEFAULTS = require("./dbConfigDefaults");

let clientInstance = null;
let cachedDb = null;
let currentParams = null;

const initMongo = async ({ uri, dbName } = {}) => {
  const connectionUri = uri || process.env.MONGODB_URI || DB_CONFIG_DEFAULTS.mongoUri;
  const databaseName = dbName || process.env.MONGODB_DB || DB_CONFIG_DEFAULTS.mongoDb;

  if (
    cachedDb &&
    currentParams &&
    currentParams.uri === connectionUri &&
    currentParams.dbName === databaseName
  ) {
    return cachedDb;
  }

  if (clientInstance) {
    await clientInstance.close().catch(() => { });
  }

  clientInstance = new MongoClient(connectionUri, {
    serverSelectionTimeoutMS: 5000,
  });
  await clientInstance.connect();
  cachedDb = clientInstance.db(databaseName);
  currentParams = { uri: connectionUri, dbName: databaseName };
  await cachedDb.createCollection("configurations").catch(() => { });
  await cachedDb.createCollection("notifications").catch(() => { });
  await cachedDb.createCollection("users").catch(() => { });
  await cachedDb.createCollection("groups").catch(() => { });
  console.log(`✅ [MongoDB] Conectado a ${databaseName}`);
  console.log(`   URI: ${connectionUri}`);
  return cachedDb;
};

const getMongoDb = () => {
  if (cachedDb && currentParams) {
    // Log every 100th call to avoid spam but maintain visibility
    if (!getMongoDb.callCount) getMongoDb.callCount = 0;
    getMongoDb.callCount++;
    if (getMongoDb.callCount % 100 === 1) {
      console.log(`[MongoDB] Active DB: ${currentParams.dbName} (${currentParams.uri})`);
    }
  }
  return cachedDb;
};

const getMongoClient = () => clientInstance;

const connectToMongoDirect = async (uri, dbName) => {
  const connectionUri = uri || DB_CONFIG_DEFAULTS.mongoUri;
  const databaseName = dbName || DB_CONFIG_DEFAULTS.mongoDb;
  const client = new MongoClient(connectionUri, {
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db(databaseName);
  return { client, db };
};

const closeMongoConnection = async () => {
  if (clientInstance) {
    await clientInstance.close().catch(() => { });
    clientInstance = null;
    cachedDb = null;
    currentParams = null;
  }
};

/**
 * Get next auto-increment ID for a collection
 * Uses a 'counters' collection to track the last ID for each collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<number>} - Next ID number
 */
const getNextId = async (collectionName) => {
  const db = getMongoDb();
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  // Check if counter exists
  const counter = await db.collection('counters').findOne({ _id: collectionName });

  if (!counter) {
    // If no counter, find max ID in the target collection
    const maxItem = await db.collection(collectionName)
      .find({ id: { $type: 'number' } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    let startVal = 0;
    if (maxItem.length > 0) {
      startVal = maxItem[0].id;
    }

    // Initialize counter
    await db.collection('counters').updateOne(
      { _id: collectionName },
      { $set: { sequence: startVal + 1 } },
      { upsert: true }
    );

    return startVal + 1;
  }

  const result = await db.collection('counters').findOneAndUpdate(
    { _id: collectionName },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  return result.value.sequence;
};

module.exports = {
  initMongo,
  getMongoDb,
  getMongoClient,
  connectToMongoDirect,
  closeMongoConnection,
  getNextId,
};
