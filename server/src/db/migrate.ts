import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(
  customDb?: DatabaseSync,
  customSchemaPath?: string
): { success: boolean; tables: string[]; count: number } {
  const db = customDb || getDb();
  const schemaPath = customSchemaPath || path.resolve(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  console.log(`[migrate] Executing schema migration from: ${schemaPath}`);
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute DDL
  db.exec(schemaSql);

  // Verify created tables
  const rows = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as Array<{ name: string }>;

  const tables = rows.map((r) => r.name);
  console.log(`[migrate] Successfully verified ${tables.length} tables in database:`);
  for (const table of tables) {
    console.log(`  - ${table}`);
  }

  return {
    success: true,
    tables,
    count: tables.length,
  };
}

// Auto-run if executed directly via CLI
const isDirectExecution =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'));

if (isDirectExecution) {
  try {
    const result = runMigrations();
    console.log(`[migrate] Schema migration finished successfully with ${result.count} tables.`);
  } catch (error) {
    console.error('[migrate] Error running migration:', error);
    process.exit(1);
  }
}
