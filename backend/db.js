const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'macctant.db');
const db = new sqlite3.Database(dbPath);

const ensureColumns = (table, columns) => {
  db.all(`PRAGMA table_info(${table})`, [], (err, info) => {
    if (err) return;
    const existing = new Set(info.map((col) => col.name));
    columns.forEach((col) => {
      if (!existing.has(col.name)) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
      }
    });
  });
};

const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      customer_name TEXT,
      phone TEXT,
      date TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      product TEXT PRIMARY KEY,
      stock INTEGER NOT NULL
    )`);

    // Backward-compatible migrations for previously created tables.
    ensureColumns('users', [{ name: 'password', type: 'TEXT' }]);
    ensureColumns('sales', [{ name: 'product', type: 'TEXT' }]);
    ensureColumns('inventory', [
      { name: 'product', type: 'TEXT' },
      { name: 'stock', type: 'INTEGER DEFAULT 0' }
    ]);

    const defaultPasswordHash = bcrypt.hashSync('macctant123', 10);

    db.get('SELECT * FROM users WHERE username = ?', ['owner'], (err, user) => {
      if (err) return;
      if (!user) {
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['owner', defaultPasswordHash]);
      } else if (!user.password) {
        db.run('UPDATE users SET password = ? WHERE username = ?', [defaultPasswordHash, 'owner']);
      }
    });

    db.run(
      `INSERT OR IGNORE INTO inventory (product, stock) VALUES
      ('Lip Balm', 120),
      ('Solid Perfume', 90)`
    );

    db.run('UPDATE inventory SET product = product_name WHERE product IS NULL AND product_name IS NOT NULL');
    db.run('UPDATE inventory SET stock = stock_quantity WHERE stock IS NULL AND stock_quantity IS NOT NULL');
    db.run('UPDATE sales SET product = product_name WHERE product IS NULL AND product_name IS NOT NULL');
  });
};

module.exports = { db, initDb };
