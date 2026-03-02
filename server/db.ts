import dotenv from 'dotenv';
import { drizzle as sqliteDrizzle } from "drizzle-orm/better-sqlite3";
import betterSqlite3 from "better-sqlite3";
import * as schema from "@shared/schema";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// load environment variables from workspace root .env
dotenv.config({ path: join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  // default to sqlite file if not specified
  process.env.DATABASE_URL = './dev.db';
}

let db;
let sqliteConn: betterSqlite3.Database | null = null;

// Ensure SQLite schema tables exist
function ensureSqliteSchema(conn: betterSqlite3.Database) {
  conn.exec(
    `CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  conn.exec(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      fleet_group_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  conn.exec(
    `CREATE TABLE IF NOT EXISTS fleet_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  conn.exec(
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_number TEXT NOT NULL UNIQUE,
      owner_name TEXT NOT NULL,
      model TEXT NOT NULL,
      mileage INTEGER NOT NULL,
      fastag_balance INTEGER NOT NULL DEFAULT 0,
      last_service_date TEXT NOT NULL,
      fleet_group_id INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  conn.exec(
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      changes TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );

  conn.exec(`CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs (user_id)`);
  conn.exec(`CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id)`);
}

// Initialize SQLite database
sqliteConn = new betterSqlite3(process.env.DATABASE_URL);
ensureSqliteSchema(sqliteConn);
db = sqliteDrizzle(sqliteConn, { schema });

export { db, sqliteConn };