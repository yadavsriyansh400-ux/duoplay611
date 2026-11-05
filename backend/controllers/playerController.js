
import User from '../models/User.js';

export const searchPlayer = async (req, res) => {
  try {
    const { playerId } = req.query;

    if (!playerId || !playerId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a Player ID.',
      });
    }

    const player = await User.findOne({
      playerId: playerId.trim(),
      isVerified: true,
    }).select('username playerId profilePicture isVerified');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'No verified player found with this Player ID.',
      });
    }

    // Don't allow players to find themselves.
    if (player._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot search for yourself.',
      });
    }

    return res.status(200).json({
      success: true,
      player: {
        username: player.username,
        playerId: player.playerId,
        profilePicture: player.profilePicture,
      },
    });
  } catch (error) {
    console.error('Player search error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to search for players right now.',
    });
  }
};
