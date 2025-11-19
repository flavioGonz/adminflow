const db = require('../db');

const getPrimaryDataSource = async () => {
  const config = await db.getSystemConfig();
  return config.primary_db === 'mongo' ? 'mongo' : 'sqlite';
};

const getMongoConnectionInfo = async () => {
  const config = await db.getSystemConfig();
  return {
    uri: config.mongo_uri,
    dbName: config.mongo_db,
  };
};

module.exports = {
  getPrimaryDataSource,
  getMongoConnectionInfo,
};
