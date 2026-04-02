const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'macctant.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
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
      product_name TEXT PRIMARY KEY,
      stock_quantity INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS expense_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      uses INTEGER DEFAULT 1
    )`);

    db.run(
      `INSERT OR IGNORE INTO inventory (product_name, stock_quantity) VALUES
      ('Lip Balm', 100),
      ('Solid Perfume', 100)`
    );

    const defaultPasswordHash = bcrypt.hashSync('1234', 10);
    db.run(
      `INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)` ,
      ['owner', defaultPasswordHash]
    );
  });
};

module.exports = { db, initDb };
