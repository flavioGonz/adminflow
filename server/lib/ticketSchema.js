const { db } = require("../db");

const ensureTicketSchema = () =>
  new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(tickets);", (err, columns) => {
      if (err) {
        console.error("Error leyendo la estructura de tickets:", err.message);
        return reject(err);
      }
      const hasAssignedGroup =
        Array.isArray(columns) &&
        columns.some((column) => column.name === "assigned_group");
      if (hasAssignedGroup) {
        return resolve();
      }
      db.run("ALTER TABLE tickets ADD COLUMN assigned_group TEXT;", (alterErr) => {
        if (alterErr) {
          console.error("No se pudo agregar la columna assigned_group:", alterErr.message);
          return reject(alterErr);
        }
        resolve();
      });
    });
  });

module.exports = { ensureTicketSchema };
