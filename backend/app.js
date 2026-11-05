
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import friendRequestRoutes from './routes/friendRequestRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

import 'dotenv/config';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173' ,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to DuoPlay611 API!',
    status: 'Backend is running',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DuoPlay611 server is healthy',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/players',playerRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
console.log('Registering DuoPlay room routes');
app.use('/api/rooms', roomRoutes);
app.get('/api/debug-route-check', (req, res) => {
  res.json({ message: 'This app.js is handling requests' });
});
// 404 handler - must come after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : 'Internal server error',
  });
});

export default app;
