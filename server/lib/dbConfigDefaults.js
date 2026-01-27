const path = require("path");

const DB_CONFIG_DEFAULTS = {
  engine: "mongodb",
  mongoUri: "mongodb://crm.infratec.com.uy:29999",
  mongoDb: "adminflow",
  sqlitePath: path.resolve(__dirname, "..", "database", "database.sqlite"),
};

module.exports = DB_CONFIG_DEFAULTS;
