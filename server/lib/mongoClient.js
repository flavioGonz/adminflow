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
    await clientInstance.close().catch(() => {});
  }

  clientInstance = new MongoClient(connectionUri, {
    serverSelectionTimeoutMS: 5000,
  });
  await clientInstance.connect();
  cachedDb = clientInstance.db(databaseName);
  currentParams = { uri: connectionUri, dbName: databaseName };
  await cachedDb.createCollection("configurations").catch(() => {});
  await cachedDb.createCollection("notifications").catch(() => {});
  await cachedDb.createCollection("users").catch(() => {});
  await cachedDb.createCollection("groups").catch(() => {});
  console.log(`Conectado a MongoDB (${connectionUri}/${databaseName}).`);
  return cachedDb;
};

const getMongoDb = () => cachedDb;

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
    await clientInstance.close().catch(() => {});
    clientInstance = null;
    cachedDb = null;
    currentParams = null;
  }
};

module.exports = {
  initMongo,
  getMongoDb,
  getMongoClient,
  connectToMongoDirect,
  closeMongoConnection,
};
