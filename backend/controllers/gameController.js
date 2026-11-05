
import Room from '../models/Room.js';

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const makeMove = async (req, res) => {
  try {
    const roomCode = req.params.roomCode.trim().toUpperCase();
    const { cellIndex } = req.body;
    const userId = req.user._id.toString();

    // Validate the selected cell.
    if (
      !Number.isInteger(cellIndex) ||
      cellIndex < 0 ||
      cellIndex > 8
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid cell.',
      });
    }

    const room = await Room.findOne({
      roomCode,
      expiresAt: { $gt: new Date() },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or has expired.',
      });
    }

    // Only players in this room can make moves.
    const isPlayer = room.players.some(
      (playerId) => playerId.toString() === userId
    );

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player in this room.',
      });
    }

    if (room.game !== 'Tic-Tac-Toe') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for Tic-Tac-Toe.',
      });
    }

    if (
      room.players.length !== 2 ||
      room.status !== 'playing' ||
      room.gameState.result !== 'playing'
    ) {
      return res.status(400).json({
        success: false,
        message: 'The game is not currently accepting moves.',
      });
    }

    if (room.gameState.currentTurn?.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'It is not your turn.',
      });
    }

    if (room.gameState.board[cellIndex] !== '') {
      return res.status(400).json({
        success: false,
        message: 'That cell is already occupied.',
      });
    }

    const symbol = room.gameState.symbols.get
      ? room.gameState.symbols.get(userId)
      : room.gameState.symbols[userId];

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Player symbols have not been assigned yet.',
      });
    }

    // Apply the move.
    room.gameState.board[cellIndex] = symbol;

    const hasWon = WINNING_COMBINATIONS.some((combination) =>
      combination.every(
        (index) => room.gameState.board[index] === symbol
      )
    );

    if (hasWon) {
      room.gameState.result = 'won';
      room.gameState.winner = req.user._id;
    } else if (room.gameState.board.every((cell) => cell !== '')) {
      room.gameState.result = 'draw';
      room.gameState.winner = null;
    } else {
      const nextPlayer = room.players.find(
        (playerId) => playerId.toString() !== userId
      );

      room.gameState.currentTurn = nextPlayer;
    }

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('host', 'username playerId')
      .populate('players', 'username playerId')
      .populate('gameState.currentTurn', 'username playerId')
      .populate('gameState.winner', 'username playerId');

    const payload = {
      id: updatedRoom._id,
      roomCode: updatedRoom.roomCode,
      game: updatedRoom.game,
      status: updatedRoom.status,
      host: updatedRoom.host,
      players: updatedRoom.players,
      gameState: updatedRoom.gameState,
    };

    // Notify both players using the room's Socket.IO channel.
    const io = req.app.get('io');

    if (io) {
      io.to(`room:${roomCode}`).emit('gameStateUpdated', payload);
    }

    return res.status(200).json({
      success: true,
      message: 'Move completed.',
      room: payload,
    });
  } catch (error) {
    console.error('Make move error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to make the move.',
    });
  }
};


export const requestRematch = async (req, res) => {
  try {
    const roomCode = req.params.roomCode.trim().toUpperCase();
    const userId = req.user._id.toString();

    const room = await Room.findOne({
      roomCode,
      expiresAt: { $gt: new Date() },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or has expired.',
      });
    }

    const isPlayer = room.players.some(
      (playerId) => playerId.toString() === userId
    );

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player in this room.',
      });
    }

    if (
      room.game !== 'Tic-Tac-Toe' ||
      room.players.length !== 2 ||
      room.gameState.result === 'playing'
    ) {
      return res.status(400).json({
        success: false,
        message: 'A rematch is only available after the game ends.',
      });
    }

    // Record this player's agreement to play again.
    const alreadyVoted = room.gameState.replayVotes.some(
      (playerId) => playerId.toString() === userId
    );

    if (!alreadyVoted) {
      room.gameState.replayVotes.push(req.user._id);
    }

    const bothAgreed = room.players.every((playerId) =>
      room.gameState.replayVotes.some(
        (voteId) => voteId.toString() === playerId.toString()
      )
    );

    if (bothAgreed) {
      // Reset the board for the next round.
      room.gameState.board = Array(9).fill('');

      const firstPlayerIndex = Math.floor(Math.random() * 2);
      const firstPlayer = room.players[firstPlayerIndex];
      const secondPlayer = room.players[1 - firstPlayerIndex];

      room.gameState.symbols = {
        [firstPlayer.toString()]: 'X',
        [secondPlayer.toString()]: 'O',
      };

      room.gameState.currentTurn = firstPlayer;
      room.gameState.winner = null;
      room.gameState.result = 'playing';
      room.gameState.replayVotes = [];
    }

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('host', 'username playerId')
      .populate('players', 'username playerId')
      .populate('gameState.currentTurn', 'username playerId')
      .populate('gameState.winner', 'username playerId');

    const payload = {
      id: updatedRoom._id,
      roomCode: updatedRoom.roomCode,
      game: updatedRoom.game,
      status: updatedRoom.status,
      host: updatedRoom.host,
      players: updatedRoom.players,
      gameState: updatedRoom.gameState,
    };

    const io = req.app.get('io');

    if (io) {
      io.to(`room:${roomCode}`).emit('gameStateUpdated', payload);
    }

    return res.status(200).json({
      success: true,
      message: bothAgreed
        ? 'Both players agreed. A new round has started!'
        : 'Your rematch vote has been recorded. Waiting for your opponent.',
      room: payload,
      waitingForOpponent: !bothAgreed,
    });
  } catch (error) {
    console.error('Request rematch error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to process the rematch.',
    });
  }
};


export const leaveGame = async (req, res) => {
  try {
    const roomCode = req.params.roomCode.trim().toUpperCase();
    const userId = req.user._id.toString();

    const room = await Room.findOne({
      roomCode,
      expiresAt: { $gt: new Date() },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or has expired.',
      });
    }

    const isPlayer = room.players.some(
      (playerId) => playerId.toString() === userId
    );

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player in this room.',
      });
    }

    // Remove the leaving player.
    room.players = room.players.filter(
      (playerId) => playerId.toString() !== userId
    );

    // End this room's current game.
    room.status = 'finished';
    room.gameState.result = 'finished';
    room.gameState.currentTurn = null;
    room.gameState.replayVotes = [];

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('host', 'username playerId')
      .populate('players', 'username playerId')
      .populate('gameState.currentTurn', 'username playerId')
      .populate('gameState.winner', 'username playerId');

    const payload = {
      id: updatedRoom._id,
      roomCode: updatedRoom.roomCode,
      game: updatedRoom.game,
      status: updatedRoom.status,
      host: updatedRoom.host,
      players: updatedRoom.players,
      gameState: updatedRoom.gameState,
      message: 'A player has left the game.',
    };

    const io = req.app.get('io');

    if (io) {
      io.to(`room:${roomCode}`).emit('opponentLeftGame', {
        room: payload,
        leavingUserId: userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'You left the game.',
      room: payload,
    });
  } catch (error) {
    console.error('Leave game error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to leave the game.',
    });
  }
};
