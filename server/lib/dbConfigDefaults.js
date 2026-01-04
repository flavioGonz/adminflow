const path = require("path");

const DB_CONFIG_DEFAULTS = {
  engine: "mongodb",
  mongoUri: "mongodb://192.168.99.121:27017",
  mongoDb: "adminflow",
  sqlitePath: path.resolve(__dirname, "..", "database", "database.sqlite"),
};

module.exports = DB_CONFIG_DEFAULTS;
