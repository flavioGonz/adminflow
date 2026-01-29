const fs = require("fs");
const path = require("path");
const DB_CONFIG_DEFAULTS = require("./dbConfigDefaults");

const CONFIG_FILE = path.resolve(__dirname, "..", ".selected-db.json");
const SUPPORTED_ENGINES = ["mongodb"]; // SQLite removido

let selectedEngine = "mongodb"; // Forzado a mongodb

const readConfigFile = () => {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return { ...DB_CONFIG_DEFAULTS, ...data, engine: "mongodb" };
    } catch {
      return { ...DB_CONFIG_DEFAULTS, engine: "mongodb" };
    }
  }
  return { ...DB_CONFIG_DEFAULTS, engine: "mongodb" };
};

const persistConfig = (payload) => {
  try {
    const current = readConfigFile();
    const merged = { ...current, ...payload, engine: "mongodb" };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch (error) {
    console.warn("No se pudo persistir la selección de base de datos:", error.message);
  }
};

const determineDbEngine = async () => {
  // Siempre retornar mongodb
  selectedEngine = "mongodb";
  process.env.DB_ENGINE = "mongodb";
  persistConfig({ engine: "mongodb" });
  return "mongodb";
};

const getCurrentDbEngine = () => "mongodb";

const getDbConfigFromFile = () => readConfigFile();

const updateDbConfig = (updates = {}) => {
  const current = readConfigFile();
  // Ignorar cualquier intento de cambiar el engine que no sea mongodb
  const merged = { ...current, ...updates, engine: "mongodb" };
  persistConfig(merged);
  selectedEngine = "mongodb";
  process.env.DB_ENGINE = "mongodb";
  return merged;
};

module.exports = {
  determineDbEngine,
  getCurrentDbEngine,
  getDbConfigFromFile,
  updateDbConfig,
};
