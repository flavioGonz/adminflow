const { ObjectId } = require('mongodb');

const parseSqliteIdentifier = (value) => {
  if (value === undefined || value === null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const getMongoFilter = (id) => {
  if (!id) return {};

  const normalizedId = String(id).trim();
  if (!normalizedId) return {};

  const filters = [];

  if (ObjectId.isValid(normalizedId)) {
    filters.push({ _id: new ObjectId(normalizedId) });
  }

  const numericId = Number(normalizedId);
  if (!Number.isNaN(numericId)) {
    filters.push({ _id: numericId });
    filters.push({ id: numericId });
    filters.push({ sqliteId: numericId });
  }

  filters.push({ id: normalizedId });
  filters.push({ sqliteId: normalizedId });

  return filters.length === 1 ? filters[0] : { $or: filters };
};

const getMongoClientFilter = (clientId) => {
  if (!clientId) return {};

  const normalizedId = String(clientId).trim();
  if (!normalizedId) return {};

  const filters = [];

  // Check for MongoDB ObjectId
  if (ObjectId.isValid(normalizedId)) {
    filters.push({ clientId: new ObjectId(normalizedId) });
    filters.push({ client_id: new ObjectId(normalizedId) });
    // Some docs might store it as string even if it's a valid hex
    filters.push({ clientId: normalizedId });
    filters.push({ client_id: normalizedId });
  }

  // Check for numeric IDs (legacy)
  const numericId = Number(normalizedId);
  if (!Number.isNaN(numericId)) {
    filters.push({ clientId: numericId });
    filters.push({ client_id: numericId });
    // Also store as string
    filters.push({ clientId: String(numericId) });
    filters.push({ client_id: String(numericId) });
  }

  // Final fallback for plain strings
  if (!ObjectId.isValid(normalizedId) && Number.isNaN(numericId)) {
    filters.push({ clientId: normalizedId });
    filters.push({ client_id: normalizedId });
  }

  return filters.length === 1 ? filters[0] : { $or: filters };
};

const normalizeIdentifier = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }
  return String(value).trim();
};

const buildClientReferenceFilter = (clientId, clientDoc = null) => {
  const identifiers = new Set();
  const addIdentifier = (value) => {
    const normalized = normalizeIdentifier(value);
    if (!normalized) return;
    identifiers.add(normalized);
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric)) {
      identifiers.add(numeric);
    }
  };

  addIdentifier(clientId);
  if (clientDoc) {
    addIdentifier(clientDoc.id);
    addIdentifier(clientDoc.numericId);
    addIdentifier(clientDoc.sqliteId);
    addIdentifier(clientDoc._id);
  }

  const filters = [];
  identifiers.forEach((value) => {
    filters.push({ client_id: value });
    filters.push({ clientId: value });
  });

  if (!filters.length) {
    return { clientId };
  }
  if (filters.length === 1) {
    return filters[0];
  }
  return { $or: filters };
};

module.exports = {
  parseSqliteIdentifier,
  getMongoFilter,
  getMongoClientFilter,
  buildClientReferenceFilter,
};
