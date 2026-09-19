import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalDb: DatabaseSync | null = null;

/**
 * Calculates Haversine distance in kilometers between two latitude/longitude points.
 */
export function haversineDistanceKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolves the default database path.
 * Checks SAUNA_DB_PATH or DATABASE_PATH env vars, falls back to server/data/sauna.db.
 */
export function getDefaultDbPath(): string {
  if (process.env.SAUNA_DB_PATH) {
    return process.env.SAUNA_DB_PATH;
  }
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  if (process.env.NODE_ENV === 'test' && !process.env.PERSIST_TEST_DB) {
    return ':memory:';
  }
  return path.resolve(__dirname, '../../data/sauna.db');
}

/**
 * Configures and initializes a DatabaseSync instance:
 * 1. Enables WAL journal mode (on disk databases)
 * 2. Enables Foreign Key enforcement
 * 3. Registers custom SQLite functions (e.g. haversine_km)
 */
export function configureDatabase(db: DatabaseSync, isMemory: boolean): DatabaseSync {
  if (!isMemory) {
    try {
      db.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // Ignore if WAL fails on specific filesystems
    }
  }
  db.exec('PRAGMA foreign_keys = ON;');

  // Register haversine_km custom SQL function for proximity calculations
  if (typeof db.function === 'function') {
    db.function('haversine_km', (lat1: unknown, lon1: unknown, lat2: unknown, lon2: unknown) => {
      const nLat1 = typeof lat1 === 'number' ? lat1 : parseFloat(String(lat1));
      const nLon1 = typeof lon1 === 'number' ? lon1 : parseFloat(String(lon1));
      const nLat2 = typeof lat2 === 'number' ? lat2 : parseFloat(String(lat2));
      const nLon2 = typeof lon2 === 'number' ? lon2 : parseFloat(String(lon2));
      if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;
      return haversineDistanceKm(nLat1, nLon1, nLat2, nLon2);
    });
  }

  return db;
}

/**
 * Creates a new DatabaseSync connection.
 * Automatically creates parent directory if missing for disk database.
 */
export function createConnection(customPath?: string): DatabaseSync {
  const dbPath = customPath || getDefaultDbPath();
  const isMemory = dbPath === ':memory:';

  if (!isMemory) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  return configureDatabase(db, isMemory);
}

/**
 * Returns the singleton DatabaseSync connection.
 */
export function getDb(customPath?: string): DatabaseSync {
  if (!globalDb) {
    globalDb = createConnection(customPath);
  }
  return globalDb;
}

/**
 * Overrides or resets the singleton DatabaseSync connection (useful in tests).
 */
export function setDb(db: DatabaseSync | null): void {
  if (globalDb && globalDb !== db) {
    try {
      globalDb.close();
    } catch {
      // Ignore
    }
  }
  globalDb = db;
}

/**
 * Closes the active database connection if open.
 */
export function closeDb(): void {
  if (globalDb) {
    try {
      globalDb.close();
    } catch {
      // Ignore
    }
    globalDb = null;
  }
}
