const { db } = require("../db");

const ensureSupplierSchema = () =>
  new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS suppliers_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        price_uyu REAL DEFAULT 0,
        price_usd REAL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );`,
      (err) => {
        if (err) {
          console.error("Error asegurando la tabla suppliers_catalog:", err.message);
          return reject(err);
        }
        resolve();
      }
    );
  });

module.exports = { ensureSupplierSchema };
