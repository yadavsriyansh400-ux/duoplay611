import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';

import app from './app.js';
import connectDB from './config/db.js';

import jwt from 'jsonwebtoken';
import User from './models/User.js';

import { registerTruthOrDareHandlers } from './controllers/games/truthOrDareController.js';

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const allowedOrigins = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim());

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

//PART A

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isVerified) {
      return next(new Error('Invalid or unverified user.'));
    }

    socket.userId = user._id.toString();

    next();
  } catch (error) {
    next(new Error('Invalid or expired token.'));
  }
});

//PART B

io.on('connection', (socket) => {
  console.log('Authenticated client connected:', socket.id);
  registerTruthOrDareHandlers(io, socket);
  const userId = socket.userId;

  socket.join(`user:${userId}`);
  socket.on('joinGameRoom', async (roomCode) => {
    try {
      if (typeof roomCode !== 'string') return;

      const normalizedCode = roomCode.trim().toUpperCase();

      if (!/^[A-F0-9]{6}$/.test(normalizedCode)) return;

      const Room = (await import('./models/Room.js')).default;

      const room = await Room.findOne({
        roomCode: normalizedCode,
        players: socket.userId,
        expiresAt: { $gt: new Date() },
      });

      if (!room) {
        socket.emit('gameRoomError', {
          message: 'Room not found or you are not a member.',
        });
        return;
      }

      socket.join(`room:${normalizedCode}`);

      console.log(
        `User ${socket.userId} joined game room ${normalizedCode}`
      );
    } catch (error) {
      console.error('Join game room error:', error.message);

      socket.emit('gameRoomError', {
        message: 'Unable to join the game room.',
      });
    }
  });

  console.log(`User ${userId} registered with Socket.IO`);

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`DuoPlay611 backend running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
  });
};

startServer();
