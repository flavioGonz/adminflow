const { ObjectId } = require('mongodb');

const { getMongoDb } = require('./mongoClient');
const { recordSyncEvent } = require('./sqliteSync');

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
  recordSyncEvent('users', value).catch(() => {});
  return value;
};

const listRegisteredUsers = async () => {
  const collection = getUsersCollection();
  if (!collection) return [];
  return collection.find({}).sort({ createdAt: -1 }).toArray();
};

const updateRegisteredUser = async (identifier, updates = {}) => {
  const collection = getUsersCollection();
  if (!collection) return null;
  const filter = ObjectId.isValid(identifier)
    ? { _id: new ObjectId(identifier) }
    : { sqliteId: Number.isNaN(Number(identifier)) ? identifier : Number(identifier) };
  const now = new Date();
  const { value } = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        ...updates,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  );
  if (value) {
    recordSyncEvent('users', value).catch(() => {});
  }
  return value;
};

module.exports = {
  trackRegisteredUser,
  listRegisteredUsers,
  updateRegisteredUser,
};
