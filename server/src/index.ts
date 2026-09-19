import { app } from './app.js';
import { config } from './config.js';
import { getDb, closeDb } from './db/connection.js';

const PORT = config.PORT;

// Initialize database connection on startup
try {
  const db = getDb();
  console.log(`[db] SQLite connected successfully.`);
} catch (err) {
  console.error(`[db] Failed to connect to SQLite:`, err);
}

export const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Czech Sauna & Wellness Platform Server`);
  console.log(`  Environment : ${config.NODE_ENV}`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  API Base    : http://localhost:${PORT}/api`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[server] HTTP server closed.');
    closeDb();
    console.log('[db] Database connection closed.');
    process.exit(0);
  });

  // Force close after 5 seconds if still hanging
  setTimeout(() => {
    console.error('[server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default server;
