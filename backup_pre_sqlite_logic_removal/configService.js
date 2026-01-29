const { getMongoDb } = require('./mongoClient');
const { recordSyncEvent } = require('./sqliteSync');

const MODULE_DEFAULTS = {
  users: {
    requireVerification: true,
    allowedRoles: ['admin', 'staff', 'viewer'],
    passwordPolicy: 'medium',
    notifications: ['email'],
  },
  tickets: {
    autoCloseDays: 14,
    priorityColors: ['#dc2626', '#f97316', '#059669'],
    notifyOn: ['creation', 'overdue'],
    sla: '24h',
  },
  contracts: {
    renewThresholdDays: 30,
    requireSigned: true,
    depositPercentage: 30,
    autoNotifyStages: ['draft', 'active', 'expiring'],
  },
  payments: {
    defaultMethod: 'Transferencia',
    requireReceipt: true,
    statusOptions: ['Pendiente', 'Confirmado', 'Rechazado'],
    notifyOnLate: true,
  },
  products: {
    syncWithCatalog: true,
    currency: ['UYU', 'USD'],
    taxRate: 0.22,
    featuredTags: ['destacado', 'nuevo'],
  },
  budgets: {
    approvalSteps: ['Revisión', 'Aprobación', 'Pago'],
    defaultCurrency: 'UYU',
    templates: ['clásico', 'moderno'],
  },
  clients: {
    scoringMethod: 'RFM',
    requireContractVerification: true,
    defaultSegment: 'mediano',
  },
};

const getCollection = () => {
  const db = getMongoDb();
  return db ? db.collection('configurations') : null;
};

const getConfig = async (moduleName) => {
  const collection = getCollection();
  if (!collection) {
    return {
      module: moduleName,
      data: MODULE_DEFAULTS[moduleName] || {},
    };
  }
  const doc = await collection.findOne({ module: moduleName });
  if (doc) {
    return doc;
  }
  const defaultDoc = {
    module: moduleName,
    data: MODULE_DEFAULTS[moduleName] || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await collection.insertOne(defaultDoc).catch(() => {});
  return defaultDoc;
};

const listConfigs = async () => {
  const collection = getCollection();
  if (!collection) {
    return Object.keys(MODULE_DEFAULTS).map((module) => ({
      module,
      data: MODULE_DEFAULTS[module],
    }));
  }
  const docs = await collection.find({}).toArray();
  return docs.length ? docs : Object.keys(MODULE_DEFAULTS).map((module) => ({
    module,
    data: MODULE_DEFAULTS[module],
  }));
};

const upsertConfig = async (moduleName, payload) => {
  const collection = getCollection();
  if (!collection) {
    return {
      module: moduleName,
      data: payload,
    };
  }
  const now = new Date();
  const result = await collection.findOneAndUpdate(
    { module: moduleName },
    {
      $set: {
        data: payload,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  recordSyncEvent('configurations', result.value).catch(() => {});
  return result.value;
};

module.exports = {
  getConfig,
  listConfigs,
  upsertConfig,
  MODULE_DEFAULTS,
};
