import path from 'path';
import fs from 'fs';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

export const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'czech-sauna-database-server',
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'czech-sauna-database-server',
  });
});

// Mount main REST API router under /api
app.use('/api', apiRouter);

// Serve static client assets if client/dist exists (production and SPA routing)
const clientDistCandidates = [
  path.resolve(process.cwd(), 'client', 'dist'),
  path.resolve(process.cwd(), '..', 'client', 'dist'),
];
const clientDist = clientDistCandidates.find((candidate) => fs.existsSync(candidate));

if (clientDist) {
  app.use(express.static(clientDist));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      const indexHtml = path.join(clientDist, 'index.html');
      if (fs.existsSync(indexHtml)) {
        return res.sendFile(indexHtml);
      }
    }
    next();
  });
}

// 404 Handler for unknown routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
