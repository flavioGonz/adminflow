const { db } = require("../db");

const ensureBudgetSchema = () =>
  new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(budgets);", (err, columns) => {
      if (err) {
        console.error("Error leyendo la estructura de budgets:", err.message);
        return reject(err);
      }

      const hasAssignedTo =
        Array.isArray(columns) &&
        columns.some((column) => column.name === "assigned_to");
      const hasAssignedGroup =
        Array.isArray(columns) &&
        columns.some((column) => column.name === "assigned_group");

      const tasks = [];

      if (!hasAssignedTo) {
        tasks.push(
          new Promise((res, rej) => {
            db.run("ALTER TABLE budgets ADD COLUMN assigned_to TEXT;", (alterErr) => {
              if (alterErr) {
                console.error(
                  "No se pudo agregar la columna assigned_to en budgets:",
                  alterErr.message
                );
                return rej(alterErr);
              }
              res();
            });
          })
        );
      }

      if (!hasAssignedGroup) {
        tasks.push(
          new Promise((res, rej) => {
            db.run("ALTER TABLE budgets ADD COLUMN assigned_group TEXT;", (alterErr) => {
              if (alterErr) {
                console.error(
                  "No se pudo agregar la columna assigned_group en budgets:",
                  alterErr.message
                );
                return rej(alterErr);
              }
              res();
            });
          })
        );
      }

      if (!tasks.length) {
        return resolve();
      }

      Promise.all(tasks)
        .then(resolve)
        .catch(reject);
    });
  });

module.exports = { ensureBudgetSchema };
