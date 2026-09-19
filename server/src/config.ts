import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppConfig {
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  NODE_ENV: string;
  DATABASE_PATH: string;
  CORS_ORIGIN: string;
}

export const config: AppConfig = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key-czech-sauna-platform-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_PATH:
    process.env.SAUNA_DB_PATH ||
    process.env.DATABASE_PATH ||
    (process.env.NODE_ENV === 'test' && !process.env.PERSIST_TEST_DB
      ? ':memory:'
      : path.resolve(__dirname, '../data/sauna.db')),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

export default config;
