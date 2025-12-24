// bgmi-api/database.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_FILE = process.env.DB_FILE || path.join(__dirname, "bgmi.db");

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite:", err.message);
  } else {
    console.log("SQLite DB connected at", DB_FILE);
  }
});

// Tables create
db.serialize(() => {
  // Users table (plain password + hash dono)
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_plain TEXT,
      created_at TEXT NOT NULL
    )`
  );

  // Agar purani table me password_plain nahi tha, to add karne ki try karo (error ignore)
  db.run(
    `ALTER TABLE users ADD COLUMN password_plain TEXT`,
    () => {}
  );

  // OTPs table
  db.run(
    `CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )`
  );
});

module.exports = db;
