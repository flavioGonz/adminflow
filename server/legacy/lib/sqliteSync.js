const { db } = require('../db');

const recordSyncEvent = (collection, payload) => {
  return new Promise((resolve, reject) => {
    const serialized = JSON.stringify(payload || {});
    db.run(
      'INSERT INTO sync_events (collection, payload) VALUES (?, ?)',
      [collection, serialized],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve({ id: this.lastID, collection, payload });
      }
    );
  });
};

const fetchRecentSyncEvents = (limit = 25) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM sync_events ORDER BY createdAt DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map((row) => ({ ...row, payload: JSON.parse(row.payload || '{}') })));
      }
    );
  });
};

module.exports = {
  recordSyncEvent,
  fetchRecentSyncEvents,
};
