
import express from 'express';
import { searchPlayer } from '../controllers/playerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', authMiddleware, searchPlayer);

export default router;
