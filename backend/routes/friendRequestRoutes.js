
import express from 'express';

import {
  sendFriendRequest,
  getIncomingRequests,
  respondToFriendRequest,
  getFriends,
} from '../controllers/friendRequestController.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Send a friend request.
router.post('/send', authMiddleware, sendFriendRequest);

// Get incoming pending friend requests.
router.get('/incoming', authMiddleware, getIncomingRequests);
router.patch('/respond', authMiddleware, respondToFriendRequest);
router.get('/friends', authMiddleware, getFriends);


export default router;
