
import express from 'express';

import {
  createRoom,
  getRoomByCode,
} from '../controllers/roomController.js';

import {
  sendRoomInvitation,
  getRoomInvitations,
  respondToRoomInvitation,
} from '../controllers/roomInvitationController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import { 
  makeMove,
  requestRematch,
  leaveGame,
} from '../controllers/gameController.js';

const router = express.Router();

// Create a room
router.post('/create', authMiddleware, createRoom);

// Room invitation routes — register these first
router.post('/invite', authMiddleware, sendRoomInvitation);
router.get('/invitations', authMiddleware, getRoomInvitations);
router.patch(
  '/invitations/respond',
  authMiddleware,
  respondToRoomInvitation
);

router.post('/:roomCode/move', authMiddleware, makeMove);
router.post('/:roomCode/move', authMiddleware, makeMove);
router.post('/:roomCode/rematch', authMiddleware, requestRematch);
router.post('/:roomCode/leave', authMiddleware, leaveGame);



// Keep the dynamic room-code route last
router.get('/:roomCode', authMiddleware, getRoomByCode);

export default router;
