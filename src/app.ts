import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { db } from './services/database';
import { generalLimiter } from './middleware/rateLimit';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(generalLimiter); // Apply rate limiting
app.use(express.json({
  strict: false,
  type: (req) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return false;
    }
    const contentType = req.headers['content-type'] || '';
    return contentType.includes('application/json');
  }
}));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Movie Recommendation API is running' });
});

// Routes will be added here
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/tmdb', require('./routes/tmdb'));
app.use('/api/enrichment', require('./routes/enrichment'));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    await db.connect();
    console.log('Database connected');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

startServer();

export default app;