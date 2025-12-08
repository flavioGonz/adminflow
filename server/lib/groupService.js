const { ObjectId } = require("mongodb");
const { getMongoDb } = require("./mongoClient");

const DEFAULT_GROUPS = [
  {
    slug: "administracion",
    name: "Administracion",
    description: "Equipo interno responsable de la coordinación general",
    members: [],
  },
  {
    slug: "soporte",
    name: "Soporte",
    description: "Grupo de respaldo para incidentes y asistencia técnica",
    members: [],
  },
  {
    slug: "instaladores",
    name: "Instaladores",
    description: "Equipo de instalación y despliegues en sitio",
    members: [],
  },
];

const toResponseGroup = (group) => ({
  ...group,
  id: group._id.toString(),
  _id: group._id.toString(),
});

const ensureDefaultGroups = async () => {
  const db = getMongoDb();
  if (!db) {
    return [];
  }

  const collection = db.collection("groups");
  const now = new Date();
  const results = [];

  for (const group of DEFAULT_GROUPS) {
    const existing = await collection.findOne({ slug: group.slug });
    if (existing) {
      results.push(toResponseGroup(existing));
      continue;
    }
    const payload = {
      ...group,
      members: group.members ?? [],
      createdAt: now,
      updatedAt: now,
    };
    const insertResult = await collection.insertOne(payload);
    const inserted = await collection.findOne({ _id: insertResult.insertedId });
    if (inserted) {
      results.push(toResponseGroup(inserted));
    }
  }

  return results;
};

const listGroups = async () => {
  const db = getMongoDb();
  if (!db) {
    return [];
  }
  const collection = db.collection("groups");
  const groups = await collection.find({}).sort({ name: 1 }).toArray();
  return groups.map(toResponseGroup);
};

const createGroup = async (payload) => {
  const db = getMongoDb();
  if (!db) return null;
  const collection = db.collection("groups");
  const now = new Date();
  const value = {
    ...payload,
    members: payload.members || [],
    createdAt: now,
    updatedAt: now,
  };
  const existing = await collection.findOne({ slug: value.slug });
  if (existing) {
    throw new Error("El slug del grupo ya existe.");
  }
  const result = await collection.insertOne(value);
  const inserted = await collection.findOne({ _id: result.insertedId });
  if (!inserted) return null;
  return toResponseGroup(inserted);
};

const updateGroup = async (id, updates = {}) => {
  const db = getMongoDb();
  if (!db) return null;
  const collection = db.collection("groups");
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const now = new Date();
  if (updates.slug) {
    const slugExists = await collection.findOne({ slug: updates.slug, _id: { $ne: filter._id } });
    if (slugExists) {
      throw new Error("Ya existe otro grupo con ese slug.");
    }
  }
  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        ...updates,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );
  return result.value ? toResponseGroup(result.value) : null;
};

const deleteGroup = async (id) => {
  const db = getMongoDb();
  if (!db) return false;
  const collection = db.collection("groups");
  const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const result = await collection.deleteOne(filter);
  return result.deletedCount > 0;
};

module.exports = {
  ensureDefaultGroups,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
};
