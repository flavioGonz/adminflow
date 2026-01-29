const { db } = require('../db');

const ensureClientSchema = () =>
  new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(clients);', (err, columns) => {
      if (err) {
        console.error('Error leyendo la estructura de clientes:', err.message);
        return reject(err);
      }

      const columnNames = Array.isArray(columns) ? columns.map(c => c.name) : [];
      const requiredColumns = [
        { name: 'recurringPaymentEnabled', type: 'INTEGER DEFAULT 0' },
        { name: 'recurringAmount', type: 'REAL' },
        { name: 'recurringCurrency', type: 'TEXT DEFAULT \'UYU\'' }
      ];

      const tasks = [];

      for (const col of requiredColumns) {
        if (!columnNames.includes(col.name)) {
          const sql = 'ALTER TABLE clients ADD COLUMN ' + col.name + ' ' + col.type + ';';
          tasks.push(
            new Promise((res, rej) => {
              db.run(sql, (alterErr) => {
                if (alterErr) {
                  console.error('No se pudo agregar la columna ' + col.name + ' en clients:', alterErr.message);
                  return rej(alterErr);
                }
                res();
              });
            })
          );
        }
      }

      if (tasks.length === 0) return resolve();

      Promise.all(tasks).then(resolve).catch(reject);
    });
  });

module.exports = { ensureClientSchema };
