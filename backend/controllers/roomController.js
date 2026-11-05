
import crypto from 'crypto';
import Room from '../models/Room.js';

export const createRoom = async (req, res) => {
  try {
    const { game } = req.body;

    const allowedGames = [
      'Tic-Tac-Toe',
      'Connect Four',
      'Guess My Number',
      'Truth or Dare',
      'Shared Canvas',
    ];

    if (!allowedGames.includes(game)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid game.',
      });
    }

    let room;
    let attempts = 0;

    while (!room && attempts < 5) {
      attempts++;

      const roomCode = crypto
        .randomBytes(4)
        .toString('hex')
        .slice(0, 6)
        .toUpperCase();

      try {
        room = await Room.create({
          roomCode,
          host: req.user._id,
          players: [req.user._id],
          game,
        });
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    if (!room) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate a room code. Please try again.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      room: {
        id: room._id,
        roomCode: room.roomCode,
        game: room.game,
        status: room.status,
        players: room.players,
        host: room.host,
      },
    });
  } catch (error) {
    console.error('Create room error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create a room right now.',
    });
  }
};

// Get room details using its room code.
export const getRoomByCode = async (req, res) => {
  try {
    const roomCode = req.params.roomCode.trim().toUpperCase();

    const room = await Room.findOne({
      roomCode,
      expiresAt: { $gt: new Date() },
    })
      .populate('host', 'username playerId')
      .populate('players', 'username playerId');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or has expired.',
      });
    }

    const isPlayer = room.players.some(
      (player) => player._id.toString() === req.user._id.toString()
    );

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room.',
      });
    }

    return res.status(200).json({
      success: true,
      room: {
        id: room._id,
        roomCode: room.roomCode,
        game: room.game,
        status: room.status,
        host: room.host,
        players: room.players,
        gameState: room.gameState,
        truthOrDareState: room.truthOrDareState,
      },
    });
  } catch (error) {
    console.error('Get room error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch room details.',
    });
  }
};
