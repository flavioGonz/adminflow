const DB_CONFIG_DEFAULTS = {
  engine: "mongodb",
  mongoUri: "mongodb://192.168.99.121:27017", // Actualizado a la IP productiva que vimos en los logs
  mongoDb: "adminflow"
};

module.exports = DB_CONFIG_DEFAULTS;
