import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

const DATA_DIR = path.resolve("data");
const DB_PATH = path.join(DATA_DIR, "juma.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) return reject(error);
      resolve(row ?? null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows ?? []);
    });
  });
}

export async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}

export async function insertFile(file) {
  const createdAt = new Date().toISOString();
  const result = await run(
    `
      INSERT INTO files (original_name, stored_name, mime_type, size, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [file.originalname, file.filename, file.mimetype, file.size, createdAt],
  );

  return {
    id: result.lastID,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    createdAt,
  };
}

export async function listFiles() {
  const rows = await all(
    `
      SELECT
        id,
        original_name AS originalName,
        stored_name AS storedName,
        mime_type AS mimeType,
        size,
        created_at AS createdAt
      FROM files
      ORDER BY id DESC
    `,
  );
  return rows;
}

export async function findFileById(id) {
  const row = await get(
    `
      SELECT
        id,
        original_name AS originalName,
        stored_name AS storedName,
        mime_type AS mimeType,
        size,
        created_at AS createdAt
      FROM files
      WHERE id = ?
    `,
    [id],
  );
  return row;
}
