const { db } = require("../db");

const PRODUCT_COLUMNS = [
  { name: "stock", definition: "INTEGER DEFAULT 0" },
  { name: "manufacturer_logo_url", definition: "TEXT" },
  { name: "quoted_at", definition: "TEXT" },
  { name: "suppliers", definition: "TEXT" },
];

const ensureProductSchema = () =>
  new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(products);", (err, columns) => {
      if (err) {
        console.error("Error leyendo la estructura de productos:", err.message);
        return reject(err);
      }
      const existing = Array.isArray(columns)
        ? columns.map((column) => column.name)
        : [];
      const toAdd = PRODUCT_COLUMNS.filter((column) => !existing.includes(column.name));
      if (toAdd.length === 0) {
        return resolve();
      }
      let remaining = toAdd.length;
      toAdd.forEach(({ name, definition }) => {
        db.run(`ALTER TABLE products ADD COLUMN ${name} ${definition};`, (alterErr) => {
          if (alterErr) {
            if (alterErr.message && alterErr.message.includes("duplicate column name")) {
              remaining -= 1;
              if (remaining === 0) {
                return resolve();
              }
              return;
            }
            console.error(`No se pudo agregar la columna ${name}:`, alterErr.message);
            return reject(alterErr);
          }
          remaining -= 1;
          if (remaining === 0) {
            resolve();
          }
        });
      });
    });
  });

module.exports = { ensureProductSchema };
