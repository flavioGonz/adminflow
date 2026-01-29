const fs = require("fs");
const path = require("path");
const DB_CONFIG_DEFAULTS = require("./dbConfigDefaults");

const CONFIG_FILE = path.resolve(__dirname, "..", ".selected-db.json");
const SUPPORTED_ENGINES = ["mongodb", "sqlite"];

let selectedEngine = process.env.DB_ENGINE ? process.env.DB_ENGINE.toLowerCase() : null;

const readConfigFile = () => {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return { ...DB_CONFIG_DEFAULTS, ...data };
    } catch {
      return { ...DB_CONFIG_DEFAULTS };
    }
  }
  return { ...DB_CONFIG_DEFAULTS };
};

const persistConfig = (payload) => {
  try {
    const current = readConfigFile();
    const merged = { ...current, ...payload };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch (error) {
    console.warn("No se pudo persistir la selección de base de datos:", error.message);
  }
};

const determineDbEngine = async () => {
  const persisted = readConfigFile();
  if (selectedEngine && SUPPORTED_ENGINES.includes(selectedEngine)) {
    process.env.DB_ENGINE = selectedEngine;
    persistConfig({ engine: selectedEngine });
    return selectedEngine;
  }
  if (persisted?.engine && SUPPORTED_ENGINES.includes(persisted.engine)) {
    selectedEngine = persisted.engine;
  } else {
    selectedEngine = DB_CONFIG_DEFAULTS.engine;
  }
  process.env.DB_ENGINE = selectedEngine;
  persistConfig({ engine: selectedEngine });
  return selectedEngine;
};

const getCurrentDbEngine = () => selectedEngine;

const getDbConfigFromFile = () => readConfigFile();

const updateDbConfig = (updates = {}) => {
  const current = readConfigFile();
  const merged = { ...current, ...updates };
  persistConfig(merged);
  if (updates.engine && SUPPORTED_ENGINES.includes(updates.engine)) {
    selectedEngine = updates.engine;
    process.env.DB_ENGINE = selectedEngine;
  }
  return merged;
};

module.exports = {
  determineDbEngine,
  getCurrentDbEngine,
  getDbConfigFromFile,
  updateDbConfig,
};
