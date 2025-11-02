import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import pool from './db/connection';
import authRoutes from './routes/auth.routes';
import secretsRoutes from './routes/secrets.routes';
import usersRoutes from './routes/users.routes';
import { Logger } from './utils/logger';
import auditRoutes from './routes/audit.routes';


const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/secrets', secretsRoutes);
app.use('/api/v1/users', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});
app.use('/api/v1/audit', auditRoutes);


// Start server
app.listen(config.port, () => {
  Logger.info(`Backend server running on port ${config.port}`);
  Logger.info(`Environment: ${config.env}`);
});

export default app;