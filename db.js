const Database = require('better-sqlite3');
const path = require('path');

const dbFilePath = path.join(__dirname, 'supermercado.db');
const db = new Database(dbFilePath);

function migrate() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK(price >= 0),
      image TEXT,
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      category TEXT,
      category_id INTEGER,
      isEco INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);
  
  // Añadir columnas si no existen
  try {
    db.exec(`ALTER TABLE products ADD COLUMN isEco INTEGER DEFAULT 0;`);
  } catch (e) {
    // Columna ya existe, ignorar error
  }

  try {
    db.exec(`ALTER TABLE products ADD COLUMN category_id INTEGER;`);
  } catch (e) {
    // Columna ya existe, ignorar error
  }

  // Añadir columna user_id a orders si no existe
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN user_id INTEGER;`);
  } catch (e) {
    // Columna ya existe, ignorar error
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total REAL NOT NULL CHECK(total >= 0),
      status TEXT DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price REAL NOT NULL CHECK(price >= 0),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);

  // Insertar categorías por defecto
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)
  `);
  
  const defaultCategories = [
    ['Frutas', 'Frutas frescas y orgánicas'],
    ['Lácteos', 'Productos lácteos frescos'],
    ['Panadería', 'Pan y productos horneados'],
    ['Huevos', 'Huevos frescos de granja'],
    ['Bebidas', 'Bebidas naturales y refrescos']
  ];
  
  defaultCategories.forEach(([name, desc]) => {
    insertCategory.run(name, desc);
  });

  // Insertar usuario admin por defecto
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)
  `);
  insertUser.run('Administrador', 'admin@gmail.com', 'admin1234', 1);
}

module.exports = { db, migrate };


