const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@adminflow.uy";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "admin";

let dbInstance = null;

const dbDir = path.resolve(__dirname, 'database');
const dbPath = path.resolve(dbDir, 'database.sqlite');

const ensureDefaultAdmin = (db) => {
  db.get("SELECT id FROM users WHERE email = ?", [DEFAULT_ADMIN_EMAIL], (err, row) => {
    if (err) {
      console.error("Error checking default admin:", err.message);
      return;
    }
    if (row) {
      return;
    }
    bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10, (hashErr, hash) => {
      if (hashErr) {
        console.error("Error hashing default admin password:", hashErr.message);
        return;
      }
      db.run(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [DEFAULT_ADMIN_EMAIL, hash],
        (insertErr) => {
          if (insertErr) {
            console.error("Error inserting default admin user:", insertErr.message);
          } else {
            console.log(`Default admin seeded: ${DEFAULT_ADMIN_EMAIL}`);
          }
        }
      );
    });
  });
};

const addColumnIfMissing = (db, table, column, definition) => {
  db.all(`PRAGMA table_info(${table})`, (pragmaErr, columns) => {
    if (pragmaErr) {
      console.error(`Error reading schema for ${table}:`, pragmaErr.message);
      return;
    }
    const exists = columns.some((col) => col.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`Error adding column ${column} to ${table}:`, alterErr.message);
        } else {
          console.log(`Column ${column} added to ${table}.`);
        }
      });
    }
  });
};

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');
        dbInstance = db;

        db.serialize(() => {
          // Users Table
          db.run(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
              )
            `, (err) => {
            if (err) console.error('Error creating users table:', err.message);
            else {
              console.log('Users table created or already exists.');
              ensureDefaultAdmin(db);
            }
          });

          // Sessions Table
          db.run(`
              CREATE TABLE IF NOT EXISTS sessions (
                sid TEXT PRIMARY KEY,
                sess JSON NOT NULL,
                expired INTEGER NOT NULL
              )
            `, (err) => {
            if (err) console.error('Error creating sessions table:', err.message);
            else console.log('Sessions table created or already exists.');
          });

          // Clients Table
          db.run(`
              CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                alias TEXT,
                rut TEXT,
                email TEXT UNIQUE,
                phone TEXT,
                address TEXT,
                latitude REAL,
                longitude REAL,
                contract BOOLEAN DEFAULT FALSE,
                notifications_enabled BOOLEAN DEFAULT TRUE,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
            if (err) console.error('Error creating clients table:', err.message);
            else {
              console.log('Clients table created or already exists.');
              db.run("ALTER TABLE clients ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE", () => { });
            }
          });

          // Repository Table
          db.run(`
              CREATE TABLE IF NOT EXISTS repository (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                equipo TEXT,
                usuario TEXT,
                password TEXT,
                mac_serie TEXT,
                comentarios TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients (id)
              )
            `, (err) => {
            if (err) console.error('Error creating repository table:', err.message);
            else console.log('Repository table created or already exists.');
          });

          // Tickets Table
          db.run(`
              CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                amount REAL,
                visit BOOLEAN,
                annotations TEXT,
                description TEXT,
                attachments TEXT,
                audioNotes TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients (id)
              )
            `, (err) => {
            if (err) console.error('Error creating tickets table:', err.message);
            else console.log('Tickets table created or already exists.');
          });

          // Calendar Events Table
          db.run(`
              CREATE TABLE IF NOT EXISTS calendar_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                location TEXT,
                start TEXT NOT NULL,
                end TEXT,
                source_type TEXT DEFAULT 'manual',
                source_id TEXT,
                locked BOOLEAN DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
            if (err) console.error('Error creating calendar_events table:', err.message);
            else {
              console.log('Calendar events table created or already exists.');
              db.get('SELECT COUNT(*) AS count FROM calendar_events', (countErr, row) => {
                if (countErr) {
                  console.error('Error checking calendar events seed:', countErr.message);
                  return;
                }
                if (row?.count) {
                  return;
                }
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const format = (date) => date.toISOString().split('T')[0];
                db.run(
                  'INSERT INTO calendar_events (title, location, start, end) VALUES (?, ?, ?, ?)',
                  ['Reunión seguimiento Cliente Demo A', 'Montevideo', format(today), format(today)]
                );
                db.run(
                  'INSERT INTO calendar_events (title, location, start, end) VALUES (?, ?, ?, ?)',
                  ['Capacitación TechNova', 'Punta del Este', format(tomorrow), format(tomorrow)]
                );
              });
            }
          });

          // Contracts Table
          db.run(`
              CREATE TABLE IF NOT EXISTS contracts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                startDate TEXT,
                endDate TEXT,
                status TEXT,
                sla TEXT,
                contractType TEXT,
                amount REAL,
                file_path TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients (id)
              )
            `, (err) => {
            if (err) console.error('Error creating contracts table:', err.message);
            else console.log('Contracts table created or already exists.');
          });

          // Products Table
          db.run(`
              CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                manufacturer TEXT,
                category TEXT,
                price_uyu REAL NOT NULL DEFAULT 0,
                price_usd REAL NOT NULL DEFAULT 0,
                badge TEXT NOT NULL DEFAULT 'Servicio',
                image_url TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
            if (err) console.error('Error creating products table:', err.message);
            else console.log('Products table created or already exists.');
          });

          // Budgets Table
          db.run(`
              CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                amount REAL,
                status TEXT,
                sections TEXT,
                file_path TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients (id)
              )
            `, (err) => {
            if (err) console.error('Error creating budgets table:', err.message);
            else console.log('Budgets table created or already exists.');
          });

          // Budget Items Table
          db.run(`
              CREATE TABLE IF NOT EXISTS budget_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                budget_id INTEGER NOT NULL,
                product_id INTEGER,
                description TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                FOREIGN KEY (budget_id) REFERENCES budgets (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id)
              )
            `, (err) => {
            if (err) console.error('Error creating budget_items table:', err.message);
            else console.log('Budget_items table created or already exists.');
          });

          // Payments Table
          db.run(`
              CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                invoice TEXT,
                ticket_id TEXT,
                ticket_title TEXT,
                client TEXT,
                client_id INTEGER,
                concept TEXT,
                amount REAL NOT NULL,
                status TEXT,
                method TEXT,
                note TEXT,
                currency TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
            if (err) console.error('Error creating payments table:', err.message);
            else console.log('Payments table created or already exists.');
          });

          // Sync Events Table
          db.run(`
              CREATE TABLE IF NOT EXISTS sync_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collection TEXT NOT NULL,
                payload TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
            if (err) console.error('Error creating sync_events table:', err.message);
            else console.log('Sync events table created or already exists.');
          });

          // Audit Logs Table
          db.run(`
              CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT,
                action TEXT NOT NULL,
                resource TEXT NOT NULL,
                details TEXT,
                status TEXT DEFAULT 'success',
                ip TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
            if (err) console.error('Error creating audit_logs table:', err.message);
            else console.log('Audit logs table created or already exists.');
          });

          // Add missing columns
          addColumnIfMissing(db, 'clients', 'latitude', 'latitude REAL');
          addColumnIfMissing(db, 'clients', 'longitude', 'longitude REAL');
          addColumnIfMissing(db, 'tickets', 'description', 'description TEXT');
          addColumnIfMissing(db, 'tickets', 'attachments', 'attachments TEXT');
          addColumnIfMissing(db, 'tickets', 'audioNotes', 'audioNotes TEXT');
          addColumnIfMissing(db, 'contracts', 'title', 'title TEXT');
          addColumnIfMissing(db, 'contracts', 'description', 'description TEXT');
          addColumnIfMissing(db, 'contracts', 'startDate', 'startDate TEXT');
          addColumnIfMissing(db, 'contracts', 'endDate', 'endDate TEXT');
          addColumnIfMissing(db, 'contracts', 'status', 'status TEXT');
          addColumnIfMissing(db, 'contracts', 'sla', 'sla TEXT');
          addColumnIfMissing(db, 'contracts', 'contractType', 'contractType TEXT');
          addColumnIfMissing(db, 'contracts', 'amount', 'amount REAL');
          addColumnIfMissing(db, 'contracts', 'currency', 'currency TEXT');
          addColumnIfMissing(db, 'budget_items', 'product_id', 'product_id INTEGER');
          addColumnIfMissing(db, 'budgets', 'sections', 'sections TEXT');
          addColumnIfMissing(db, 'repository', 'name', 'name TEXT');
          addColumnIfMissing(db, 'repository', 'type', 'type TEXT');
          addColumnIfMissing(db, 'repository', 'category', 'category TEXT');
          addColumnIfMissing(db, 'repository', 'format', 'format TEXT');
          addColumnIfMissing(db, 'repository', 'credential', 'credential TEXT');
          addColumnIfMissing(db, 'repository', 'notes', 'notes TEXT');
          addColumnIfMissing(db, 'repository', 'content', 'content TEXT');
          addColumnIfMissing(db, 'repository', 'file_name', 'file_name TEXT');
          addColumnIfMissing(db, 'calendar_events', 'source_type', "source_type TEXT DEFAULT 'manual'");
          addColumnIfMissing(db, 'calendar_events', 'source_id', 'source_id TEXT');
          addColumnIfMissing(db, 'calendar_events', 'locked', 'locked BOOLEAN DEFAULT 0');

        }); // End serialize

        resolve(db);
      }
    });
  });
};

// Proxy to allow lazy initialization
const dbProxy = new Proxy({}, {
  get: (target, prop) => {
    if (!dbInstance) {
      throw new Error(`Database not initialized. Cannot access property '${String(prop)}'`);
    }
    const value = dbInstance[prop];
    return typeof value === 'function' ? value.bind(dbInstance) : value;
  }
});

module.exports = { db: dbProxy, initDB };
