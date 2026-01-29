const { ObjectId } = require('mongodb');

const { getMongoDb } = require('./mongoClient');
const { recordSyncEvent } = require('./sqliteSync');
const { listGroups } = require('./groupService');

const getUsersCollection = () => {
  const db = getMongoDb();
  return db ? db.collection('users') : null;
};

const trackRegisteredUser = async ({ sqliteId, email }) => {
  const collection = getUsersCollection();
  if (!collection) return null;
  const now = new Date();
  const { value } = await collection.findOneAndUpdate(
    { sqliteId },
    {
      $set: {
        email,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        roles: ['viewer'],
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  recordSyncEvent('users', value).catch(() => { });
  return value;
};

const normalizeObjectId = (value) => {
  if (!value) return undefined;

  // Si es un número (usuarios antiguos), convertir a string
  if (typeof value === "number") {
    return value.toString();
  }

  // Si es un ObjectId de MongoDB, convertir a string hexadecimal
  if (typeof value === "object" && typeof value.toHexString === "function") {
    return value.toHexString();
  }

  // Si es string, verificar si es un formato ObjectId("...")
  if (typeof value === "string") {
    const match = value.match(/^ObjectId\("([0-9a-fA-F]+)"\)$/);
    return match ? match[1] : value;
  }

  // Fallback: convertir a string
  return typeof value.toString === "function" ? value.toString() : value;
};

const listRegisteredUsers = async () => {
  const collection = getUsersCollection();
  if (!collection) return [];
  const [users, groups] = await Promise.all([
    collection.find({}).sort({ createdAt: -1 }).toArray(),
    listGroups(),
  ]);
  const groupMap = groups.reduce((acc, group) => {
    acc[group._id] = group;
    return acc;
  }, {});
  return users.map((user) => {
    const normalizedId = normalizeObjectId(user._id);
    return {
      ...user,
      id: normalizedId, // Añadir campo 'id' para compatibilidad con frontend
      _id: normalizedId,
      groupId: user.groupId || null,
      groupName: user.groupId ? groupMap[user.groupId]?.name || null : null,
    };
  });
};

const updateRegisteredUser = async (identifier, updates = {}) => {
  const collection = getUsersCollection();
  if (!collection) return null;

  // Determinar el tipo de filtro basado en el identificador
  let filter;

  // Si el identificador es un número o string numérico, buscar por _id numérico
  const numericId = Number(identifier);
  if (!isNaN(numericId) && identifier.toString() === numericId.toString()) {
    filter = { _id: numericId };
  }
  // Si es un ObjectId válido de MongoDB (24 caracteres hexadecimales)
  else if (ObjectId.isValid(identifier) && identifier.length === 24) {
    filter = { _id: new ObjectId(identifier) };
  }
  // Fallback: intentar como sqliteId
  else {
    filter = { sqliteId: Number.isNaN(Number(identifier)) ? identifier : Number(identifier) };
  }

  const now = new Date();

  // Separate null values to use $unset
  const setUpdates = {};
  const unsetUpdates = {};

  Object.keys(updates).forEach(key => {
    if (updates[key] === null) {
      unsetUpdates[key] = "";
    } else {
      setUpdates[key] = updates[key];
    }
  });

  setUpdates.updatedAt = now;

  const updateOperation = {
    $set: setUpdates
  };

  if (Object.keys(unsetUpdates).length > 0) {
    updateOperation.$unset = unsetUpdates;
  }

  const { value } = await collection.findOneAndUpdate(
    filter,
    updateOperation,
    { returnDocument: 'after' }
  );
  if (value) {
    recordSyncEvent('users', value).catch(() => { });
  }
  return value;
};

const syncSqliteUserToMongo = async (sqliteUser, updates = {}) => {
  if (!sqliteUser) return null;
  const collection = getUsersCollection();
  if (!collection) return null;
  const now = new Date();
  const existing = await collection.findOne({ sqliteId: sqliteUser.id });
  const roles = updates.roles ?? existing?.roles ?? ['viewer'];
  const metadata = updates.metadata ?? existing?.metadata ?? {};
  const groupId = updates.groupId ?? existing?.groupId ?? null;
  const avatar = updates.avatar ?? existing?.avatar ?? sqliteUser.avatar ?? null;
  const name =
    updates.name ??
    existing?.name ??
    sqliteUser.name ??
    (sqliteUser.email ? sqliteUser.email.split('@')[0] : 'user');
  const email = updates.email ?? existing?.email ?? sqliteUser.email;
  const doc = {
    email,
    name,
    avatar,
    sqliteId: sqliteUser.id,
    roles,
    metadata,
    groupId,
    updatedAt: now,
  };

  const result = await collection.findOneAndUpdate(
    { sqliteId: sqliteUser.id },
    {
      $set: doc,
      $setOnInsert: {
        createdAt: now,
        password: existing?.password ?? sqliteUser.password ?? undefined,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (!result.value) {
    return null;
  }

  recordSyncEvent('users', result.value).catch(() => { });
  return {
    ...result.value,
    _id: normalizeObjectId(result.value._id),
  };
};

module.exports = {
  trackRegisteredUser,
  listRegisteredUsers,
  updateRegisteredUser,
  syncSqliteUserToMongo,
};
