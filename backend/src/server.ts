import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services
import { RealtimeService } from './services/realtime';
import { setRealtimeInstance } from './services/realtimeSingleton';
import { logger } from './utils/logger';
import { startPromotionScheduler } from './services/promotionScheduler';

const app = express();
const httpServer = createServer(app);

// Initialize real-time service
const realtime = new RealtimeService(httpServer);
setRealtimeInstance(realtime);
export { realtime };

// Import routes (after realtime is initialized)
import authRoutes from './routes/auth';
import storeRoutes from './routes/stores';
import superadminRoutes from './routes/superadmin';
import displayRoutes from './routes/display';
import menuRoutes from './routes/menu';
import promotionRoutes from './routes/promotions';
import playlistRoutes from './routes/playlists';

// Connect to MongoDB with retry logic
const connectWithRetry = (retries = 5, delay = 5000): void => {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dynaro')
    .then(() => {
      logger.info('Connected to MongoDB');
      startPromotionScheduler();
    })
    .catch((error) => {
      logger.error(`MongoDB connection error (retries left: ${retries}):`, error.message);
      if (retries > 0) {
        logger.info(`Retrying MongoDB connection in ${delay / 1000}s...`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        logger.error('MongoDB connection failed after all retries. Server will continue without DB.');
      }
    });
};
connectWithRetry();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/playlists', playlistRoutes);
// app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack
    })
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Dynaro API Server running on port ${PORT}`);
  logger.info(`📡 Real-time service initialized`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close().then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error closing MongoDB connection:', error);
      process.exit(1);
    });
  });
});

// Don't export realtime here to avoid circular dependency