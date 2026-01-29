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
        // ensure visit_data column exists as well
        const hasVisitData = Array.isArray(columns) && columns.some((c) => c.name === 'visit_data');
        if (hasVisitData) return resolve();
        db.run("ALTER TABLE tickets ADD COLUMN visit_data TEXT;", (alterErr2) => {
          if (alterErr2) {
            console.error("No se pudo agregar la columna visit_data:", alterErr2.message);
            return reject(alterErr2);
          }
          return resolve();
        });
      }
      db.run("ALTER TABLE tickets ADD COLUMN assigned_group TEXT;", (alterErr) => {
        if (alterErr) {
          console.error("No se pudo agregar la columna assigned_group:", alterErr.message);
          return reject(alterErr);
        }
        // after adding assigned_group, ensure visit_data exists
        db.run("ALTER TABLE tickets ADD COLUMN visit_data TEXT;", (alterErr2) => {
          if (alterErr2) {
            console.error("No se pudo agregar la columna visit_data:", alterErr2.message);
            return reject(alterErr2);
          }
          resolve();
        });
      });
    });
  });

module.exports = { ensureTicketSchema };
