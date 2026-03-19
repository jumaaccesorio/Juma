import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

const DATA_DIR = path.resolve("data");
const DB_PATH = path.join(DATA_DIR, "juma.db");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) return reject(error);
      resolve(row ?? null);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows ?? []);
    });
  });
}

export async function initDb() {
  // Serialize ensures tables are created in order
  await new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await run(`PRAGMA foreign_keys = ON`);

        await run(`CREATE TABLE IF NOT EXISTS categories (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT NOT NULL,
          parent_id  INTEGER REFERENCES categories(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        await run(`CREATE TABLE IF NOT EXISTS clients (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          auth_id    TEXT UNIQUE,
          name       TEXT NOT NULL,
          email      TEXT NOT NULL UNIQUE,
          phone      TEXT NOT NULL DEFAULT '',
          password_hash TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        await run(`CREATE TABLE IF NOT EXISTS products (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          name           TEXT NOT NULL,
          category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          is_featured    INTEGER NOT NULL DEFAULT 0,
          purchase_price REAL NOT NULL DEFAULT 0,
          sale_price     REAL NOT NULL DEFAULT 0,
          stock          INTEGER NOT NULL DEFAULT 0,
          initial_stock  INTEGER NOT NULL DEFAULT 0,
          enabled        INTEGER NOT NULL DEFAULT 1,
          image          TEXT NOT NULL DEFAULT '',
          source_url     TEXT NOT NULL DEFAULT '',
          created_at     TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        await run(`CREATE TABLE IF NOT EXISTS orders (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id    INTEGER REFERENCES clients(id) ON DELETE SET NULL,
          guest_name   TEXT,
          guest_email  TEXT,
          guest_phone  TEXT,
          date         TEXT NOT NULL DEFAULT (date('now')),
          status       TEXT NOT NULL DEFAULT 'PENDIENTE',
          created_at   TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        await run(`CREATE TABLE IF NOT EXISTS order_items (
          id                  INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id          INTEGER REFERENCES products(id) ON DELETE SET NULL,
          quantity            INTEGER NOT NULL DEFAULT 1,
          unit_sale_price     REAL NOT NULL DEFAULT 0,
          unit_purchase_price REAL NOT NULL DEFAULT 0
        )`);

        await run(`CREATE TABLE IF NOT EXISTS favorites (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(client_id, product_id)
        )`);

        await run(`CREATE TABLE IF NOT EXISTS hero_banner (
          id       INTEGER PRIMARY KEY DEFAULT 1,
          tag      TEXT NOT NULL DEFAULT 'Tienda online minorista',
          title    TEXT NOT NULL DEFAULT '3 Cuotas Sin Interes',
          subtitle TEXT NOT NULL DEFAULT '20% off efectivo / 10% off transferencia',
          image    TEXT NOT NULL DEFAULT ''
        )`);

        await run(`CREATE TABLE IF NOT EXISTS featured_panels (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          title       TEXT NOT NULL DEFAULT '',
          cta         TEXT NOT NULL DEFAULT 'Mira mas',
          image       TEXT NOT NULL DEFAULT '',
          class_name  TEXT NOT NULL DEFAULT 'card-left',
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
        )`);

        await run(`CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);

        // Seed defaults
        await run(`INSERT OR IGNORE INTO hero_banner (id) VALUES (1)`);
        // Seed default panels (only if table is empty)
        const panelCount = await get("SELECT COUNT(*) as c FROM featured_panels");
        if (panelCount.c === 0) {
          await run(`INSERT INTO featured_panels (title, cta, image, class_name) VALUES ('Acero Quirurgico Blanco', 'Mira mas', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80', 'card-left')`);
          await run(`INSERT INTO featured_panels (title, cta, image, class_name) VALUES ('Acero Dorado', 'Mira mas', 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1200&q=80', 'card-top')`);
          await run(`INSERT INTO featured_panels (title, cta, image, class_name) VALUES ('Acero Quirurgico', 'Mira mas', 'https://images.unsplash.com/photo-1588444650700-6d6db1f6f7fd?auto=format&fit=crop&w=1200&q=80', 'card-bottom-left')`);
          await run(`INSERT INTO featured_panels (title, cta, image, class_name) VALUES ('Pulseras Charms', 'Mira mas', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80', 'card-bottom-right')`);
        }

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}
