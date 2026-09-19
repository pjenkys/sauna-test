import { DatabaseSync } from 'node:sqlite';
/**
 * Calculates Haversine distance in kilometers between two latitude/longitude points.
 */
export declare function haversineDistanceKm(lat1: number | null | undefined, lon1: number | null | undefined, lat2: number | null | undefined, lon2: number | null | undefined): number | null;
/**
 * Resolves the default database path.
 * Checks SAUNA_DB_PATH or DATABASE_PATH env vars, falls back to server/data/sauna.db.
 */
export declare function getDefaultDbPath(): string;
/**
 * Configures and initializes a DatabaseSync instance:
 * 1. Enables WAL journal mode (on disk databases)
 * 2. Enables Foreign Key enforcement
 * 3. Registers custom SQLite functions (e.g. haversine_km)
 */
export declare function configureDatabase(db: DatabaseSync, isMemory: boolean): DatabaseSync;
/**
 * Creates a new DatabaseSync connection.
 * Automatically creates parent directory if missing for disk database.
 */
export declare function createConnection(customPath?: string): DatabaseSync;
/**
 * Returns the singleton DatabaseSync connection.
 */
export declare function getDb(customPath?: string): DatabaseSync;
/**
 * Overrides or resets the singleton DatabaseSync connection (useful in tests).
 */
export declare function setDb(db: DatabaseSync | null): void;
/**
 * Closes the active database connection if open.
 */
export declare function closeDb(): void;
