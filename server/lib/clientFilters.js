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

  if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      return { _id: new ObjectId(id) };
    } catch (error) {
      // fall through
    }
  }

  const numericId = Number(id);
  const filters = [];

  if (!Number.isNaN(numericId)) {
    filters.push({ _id: numericId });
  } else {
    filters.push({ _id: id });
  }

  if (!Number.isNaN(numericId)) {
    filters.push({ id: numericId });
    filters.push({ sqliteId: numericId });
  }
  filters.push({ id: String(id) });
  filters.push({ sqliteId: String(id) });

  return filters.length > 1 ? { $or: filters } : filters[0];
};

const getMongoClientFilter = (clientId) => {
  if (!clientId) return {};
  const numericId = Number(clientId);
  const filters = [];
  if (!Number.isNaN(numericId)) {
    filters.push({ clientId: numericId });
    filters.push({ client_id: numericId });
  }
  filters.push({ clientId: String(clientId) });
  filters.push({ client_id: String(clientId) });
  return { $or: filters };
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
