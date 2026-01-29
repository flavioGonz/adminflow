const { ObjectId } = require('mongodb');

const { getMongoDb } = require('./mongoClient');
const { listGroups } = require('./groupService');

const getUsersCollection = () => {
  const db = getMongoDb();
  return db ? db.collection('users') : null;
};

/**
 * Normaliza IDs de MongoDB (ObjectIds o numéricos legacy) a string
 */
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

/**
 * Obtiene la lista de usuarios registrados con sus grupos
 */
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
      id: normalizedId,
      _id: normalizedId,
      groupId: user.groupId || null,
      groupName: user.groupId ? groupMap[user.groupId]?.name || null : null,
    };
  });
};

/**
 * Actualiza un usuario por su ID
 */
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
  // Fallback por ID literal
  else {
    filter = { _id: identifier };
  }

  const now = new Date();

  // Separar valores null para usar $unset
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
  
  return value;
};

// Funciones legacy de SQLite removidas (syncSqliteUserToMongo, trackRegisteredUser)

module.exports = {
  listRegisteredUsers,
  updateRegisteredUser,
};
