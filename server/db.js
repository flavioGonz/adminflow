const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@adminflow.uy";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "admin";

const ensureDefaultAdmin = () => {
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

const dbDir = path.resolve(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.resolve(dbDir, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table created or already exists.');
        ensureDefaultAdmin();
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess JSON NOT NULL,
        expired INTEGER NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating sessions table:', err.message);
      } else {
        console.log('Sessions table created or already exists.');
      }
    });

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
      if (err) {
        console.error('Error creating clients table:', err.message);
      } else {
        console.log('Clients table created or already exists.');
        // Intentar añadir columna para bases de datos existentes
        db.run("ALTER TABLE clients ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE", () => { });
      }
    });

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
      if (err) {
        console.error('Error creating repository table:', err.message);
      } else {
        console.log('Repository table created or already exists.');
      }
    });

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
      if (err) {
        console.error('Error creating tickets table:', err.message);
      } else {
        console.log('Tickets table created or already exists.');
      }
    });

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
      if (err) {
        console.error('Error creating calendar_events table:', err.message);
      } else {
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
      if (err) {
        console.error('Error creating contracts table:', err.message);
      } else {
        console.log('Contracts table created or already exists.');
      }
    });

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
      if (err) {
        console.error('Error creating products table:', err.message);
      } else {
        console.log('Products table created or already exists.');
      }
    });

    const addColumnIfMissing = (table, column, definition) => {
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

    addColumnIfMissing('clients', 'latitude', 'latitude REAL');
    addColumnIfMissing('clients', 'longitude', 'longitude REAL');
    addColumnIfMissing('tickets', 'description', 'description TEXT');
    addColumnIfMissing('tickets', 'attachments', 'attachments TEXT');
    addColumnIfMissing('tickets', 'audioNotes', 'audioNotes TEXT');
    addColumnIfMissing('contracts', 'title', 'title TEXT');
    addColumnIfMissing('contracts', 'description', 'description TEXT');
    addColumnIfMissing('contracts', 'startDate', 'startDate TEXT');
    addColumnIfMissing('contracts', 'endDate', 'endDate TEXT');
    addColumnIfMissing('contracts', 'status', 'status TEXT');
    addColumnIfMissing('contracts', 'sla', 'sla TEXT');
    addColumnIfMissing('contracts', 'contractType', 'contractType TEXT');
    addColumnIfMissing('contracts', 'amount', 'amount REAL');
    addColumnIfMissing('contracts', 'currency', 'currency TEXT');
    addColumnIfMissing('budget_items', 'product_id', 'product_id INTEGER');
    addColumnIfMissing('budgets', 'sections', 'sections TEXT');
    addColumnIfMissing('repository', 'name', 'name TEXT');
    addColumnIfMissing('repository', 'type', 'type TEXT');
    addColumnIfMissing('repository', 'category', 'category TEXT');
    addColumnIfMissing('repository', 'format', 'format TEXT');
    addColumnIfMissing('repository', 'credential', 'credential TEXT');
    addColumnIfMissing('repository', 'notes', 'notes TEXT');
    addColumnIfMissing('repository', 'content', 'content TEXT');
    addColumnIfMissing('repository', 'file_name', 'file_name TEXT');
    addColumnIfMissing('calendar_events', 'source_type', "source_type TEXT DEFAULT 'manual'");
    addColumnIfMissing('calendar_events', 'source_id', 'source_id TEXT');
    addColumnIfMissing('calendar_events', 'locked', 'locked BOOLEAN DEFAULT 0');

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
      if (err) {
        console.error('Error creating budgets table:', err.message);
      } else {
        console.log('Budgets table created or already exists.');
      }
    });

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
      if (err) {
        console.error('Error creating budget_items table:', err.message);
      } else {
        console.log('Budget_items table created or already exists.');
      }
    });

    // Create payments table (removed dangerous DROP TABLE that was causing SQLITE_BUSY errors)
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
      if (err) {
        console.error('Error creating payments table:', err.message);
      } else {
        console.log('Payments table created or already exists.');
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS sync_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating sync_events table:', err.message);
      } else {
        console.log('Sync events table created or already exists.');
      }
    });

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
      if (err) {
        console.error('Error creating audit_logs table:', err.message);
      } else {
        console.log('Audit logs table created or already exists.');
      }
    });
  }
});

module.exports = { db };
