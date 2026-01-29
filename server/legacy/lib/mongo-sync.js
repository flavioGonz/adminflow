const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { MongoClient } = require('mongodb');

const SQLITE_PATH_DEFAULT = path.resolve(__dirname, '..', 'database', 'database.sqlite');

const safeParseJSON = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const tableConfigs = [
  {
    table: 'users',
    collection: 'users',
    transform: (row) => ({
      _id: row.id,
      email: row.email,
      password: row.password,
    }),
  },
  {
    table: 'sessions',
    collection: 'sessions',
    transform: (row) => ({
      _id: row.sid,
      sess: safeParseJSON(row.sess),
      expired: row.expired,
    }),
  },
  {
    table: 'clients',
    collection: 'clients',
    transform: (row) => ({
      _id: row.id,
      name: row.name,
      alias: row.alias,
      rut: row.rut,
      email: row.email,
      phone: row.phone,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      contract: !!row.contract,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }),
  },
  {
    table: 'repository',
    collection: 'repository',
    transform: (row) => ({
      _id: row.id,
      clientId: row.client_id,
      equipo: row.equipo,
      usuario: row.usuario,
      password: row.password,
      macSerie: row.mac_serie,
      comentarios: row.comentarios,
      name: row.name,
      type: row.type,
      category: row.category,
      format: row.format,
      credential: row.credential,
      notes: row.notes,
      content: safeParseJSON(row.content),
      fileName: row.file_name,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }),
  },
  {
    table: 'tickets',
    collection: 'tickets',
    transform: (row) => ({
      _id: row.id,
      clientId: row.client_id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      amount: row.amount,
      visit: !!row.visit,
      annotations: safeParseJSON(row.annotations),
      description: row.description,
      attachments: safeParseJSON(row.attachments),
      audioNotes: safeParseJSON(row.audioNotes),
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }),
  },
  {
    table: 'contracts',
    collection: 'contracts',
    transform: (row) => ({
      _id: row.id,
      clientId: row.client_id,
      title: row.title,
      description: row.description,
      startDate: row.startDate ? new Date(row.startDate) : undefined,
      endDate: row.endDate ? new Date(row.endDate) : undefined,
      status: row.status,
      sla: row.sla,
      contractType: row.contractType,
      amount: row.amount,
      currency: row.currency,
      filePath: row.file_path,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }),
  },
  {
    table: 'products',
    collection: 'products',
    transform: (row) => ({
      _id: row.id,
      name: row.name,
      manufacturer: row.manufacturer,
      description: row.description,
      category: row.category,
      badge: row.badge,
      priceUYU: row.priceUYU,
      priceUSD: row.priceUSD,
      imageUrl: row.image_url,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }),
  },
  {
    table: 'budgets',
    collection: 'budgets',
    transform: (row) => ({
      _id: row.id,
      clientId: row.client_id,
      title: row.title,
      description: row.description,
      amount: row.amount,
      status: row.status,
      sections: safeParseJSON(row.sections),
      filePath: row.file_path,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    }),
  },
  {
    table: 'budget_items',
    collection: 'budget_items',
    transform: (row) => ({
      _id: row.id,
      budgetId: row.budget_id,
      productId: row.product_id,
      description: row.description,
      quantity: row.quantity,
      unitPrice: row.unit_price,
    }),
  },
  {
    table: 'payments',
    collection: 'payments',
    transform: (row) => ({
      _id: row.id,
      invoice: row.invoice,
      ticketId: row.ticket_id,
      ticketTitle: row.ticket_title,
      client: row.client,
      clientId: row.client_id,
      amount: row.amount,
      status: row.status,
      method: row.method,
      note: row.note,
      currency: row.currency,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
    }),
  },
];

const openSqlite = (sqlitePath) =>
  new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });

const fetchAll = (sqliteDb, sql) =>
  new Promise((resolve, reject) => {
    sqliteDb.all(sql, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });

const closeSqlite = (sqliteDb) =>
  new Promise((resolve, reject) => {
    if (!sqliteDb) {
      return resolve();
    }
    sqliteDb.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const migrateTable = async ({
  mongoDb,
  sqliteDb,
  config,
  dropExisting,
  logger,
}) => {
  const rows = await fetchAll(sqliteDb, `SELECT * FROM ${config.table}`);
  const collection = mongoDb.collection(config.collection);
  if (dropExisting) {
    await collection.deleteMany({});
  }
  const documents = rows
    .map((row) => config.transform(row))
    .filter(Boolean);
  if (documents.length === 0) {
    logger?.log?.(
      `[mongo-sync] ${config.table} (${config.collection}): no documents`
    );
    return 0;
  }
  await collection.insertMany(documents, { ordered: false });
  logger?.log?.(
    `[mongo-sync] ${config.table} (${config.collection}): inserted ${documents.length}`
  );
  return documents.length;
};

const syncLocalToMongo = async ({
  uri,
  dbName,
  sqlitePath = SQLITE_PATH_DEFAULT,
  dropExisting = true,
  tables = tableConfigs,
  logger = console,
}) => {
  if (!uri) {
    throw new Error('Mongo URI is required for synchronization.');
  }
  const sqliteDb = await openSqlite(sqlitePath);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const mongoDb = dbName ? client.db(dbName) : client.db();
    const summary = {};

    for (const config of tables) {
      summary[config.collection] = await migrateTable({
        mongoDb,
        sqliteDb,
        config,
        dropExisting,
        logger,
      });
    }

    return summary;
  } finally {
    await closeSqlite(sqliteDb).catch(() => undefined);
    await client.close().catch(() => undefined);
  }
};

const checkMongoConnection = async ({ uri, dbName }) => {
  if (!uri) {
    return { connected: false, message: 'Mongo URI no definido.' };
  }
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  });
  try {
    await client.connect();
    const database = dbName ? client.db(dbName) : client.db();
    await database.command({ ping: 1 });
    return { connected: true, message: 'Conexión válida.' };
  } catch (error) {
    return { connected: false, message: error?.message || 'No se pudo conectar a MongoDB.' };
  } finally {
    await client.close().catch(() => undefined);
  }
};

const getSqliteCount = (sqliteDb, table) =>
  new Promise((resolve, reject) => {
    sqliteDb.get(`SELECT COUNT(*) AS count FROM ${table}`, (err, row) => {
      if (err) return reject(err);
      resolve(row?.count ?? 0);
    });
  });

const getMongoCount = (mongoDb, collection) => mongoDb.collection(collection).countDocuments();

const compareBases = async ({
  uri,
  dbName,
  sqlitePath = SQLITE_PATH_DEFAULT,
  tables = tableConfigs,
}) => {
  if (!uri) {
    throw new Error('Mongo URI es requerido para comparar bases.');
  }
  const sqliteDb = await openSqlite(sqlitePath);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const mongoDb = dbName ? client.db(dbName) : client.db();
    const comparisons = [];
    for (const config of tables) {
      const [sqliteCount, mongoCount] = await Promise.all([
        getSqliteCount(sqliteDb, config.table),
        getMongoCount(mongoDb, config.collection),
      ]);
      comparisons.push({
        table: config.table,
        collection: config.collection,
        sqliteCount,
        mongoCount,
        inSync: sqliteCount === mongoCount,
      });
    }
    return comparisons;
  } finally {
    await closeSqlite(sqliteDb).catch(() => undefined);
    await client.close().catch(() => undefined);
  }
};

module.exports = {
  tableConfigs,
  syncLocalToMongo,
  checkMongoConnection,
  compareBases,
};
