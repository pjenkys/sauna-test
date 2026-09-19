import { DatabaseSync } from 'node:sqlite';
export declare function runMigrations(customDb?: DatabaseSync, customSchemaPath?: string): {
    success: boolean;
    tables: string[];
    count: number;
};
