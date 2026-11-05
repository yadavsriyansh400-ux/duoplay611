
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import RoomInvitation from '../models/RoomInvitation.js';
import FriendRequest from '../models/FriendRequest.js';

// Send an invitation to an accepted friend.
export const sendRoomInvitation = async (req, res) => {
  try {
    const { roomId, friendId } = req.body;

    if (
      !mongoose.isValidObjectId(roomId) ||
      !mongoose.isValidObjectId(friendId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room or friend ID.',
      });
    }

    if (friendId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself.',
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the room host can invite players.',
      });
    }

    if (room.status !== 'waiting' || room.players.length >= 2) {
      return res.status(409).json({
        success: false,
        message: 'This room is no longer available.',
      });
    }

    const friendship = await FriendRequest.findOne({
      status: 'accepted',
      $or: [
        { sender: req.user._id, receiver: friendId },
        { sender: friendId, receiver: req.user._id },
      ],
    });

    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'You can only invite accepted friends.',
      });
    }

    const receiverAlreadyInRoom = room.players.some(
      (playerId) => playerId.toString() === friendId
    );

    if (receiverAlreadyInRoom) {
      return res.status(409).json({
        success: false,
        message: 'This friend is already in the room.',
      });
    }

    const existingInvitation = await RoomInvitation.findOne({
      room: room._id,
      receiver: friendId,
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return res.status(409).json({
          success: false,
          message: 'This friend already has a pending invitation.',
        });
      }

      if (
        existingInvitation.status === 'accepted' &&
        room.players.some((id) => id.toString() === friendId)
      ) {
        return res.status(409).json({
          success: false,
          message: 'This friend has already joined the room.',
        });
      }

      if (existingInvitation.status === 'accepted') {
        return res.status(409).json({
          success: false,
          message: 'This invitation has already been accepted.',
        });
      }

      // Allow a new invitation after a previous rejection or cancellation.
      existingInvitation.status = 'pending';
      existingInvitation.sender = req.user._id;
      existingInvitation.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await existingInvitation.save();

      const io = req.app.get('io');

      io?.to(`user:${friendId}`).emit('newRoomInvitation', {
        invitationId: existingInvitation._id,
      });

      return res.status(201).json({
        success: true,
        message: 'Invitation sent successfully.',
        invitation: { id: existingInvitation._id },
      });
    }

    const invitation = await RoomInvitation.create({
      room: room._id,
      sender: req.user._id,
      receiver: friendId,
    });

    const io = req.app.get('io');

    io?.to(`user:${friendId}`).emit('newRoomInvitation', {
      invitationId: invitation._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully.',
      invitation: { id: invitation._id },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An invitation already exists for this friend and room.',
      });
    }

    console.error('Send room invitation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to send invitation right now.',
    });
  }
};

// List invitations received by the logged-in player.
export const getRoomInvitations = async (req, res) => {
  try {
    const invitations = await RoomInvitation.find({
      receiver: req.user._id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('sender', 'username playerId profilePicture')
      .populate('room', 'roomCode game status host players expiresAt')
      .sort({ createdAt: -1 });

    const availableInvitations = invitations.filter(
      (invitation) =>
        invitation.room &&
        invitation.room.status === 'waiting' &&
        invitation.room.expiresAt > new Date() &&
        invitation.room.players.length < 2 &&
        invitation.room.host.toString() === invitation.sender._id.toString()
    );

    return res.status(200).json({
      success: true,
      invitations: availableInvitations,
    });
  } catch (error) {
    console.error('Get room invitations error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load invitations right now.',
    });
  }
};


export const respondToRoomInvitation = async (req, res) => {
  try {
    const { invitationId, action } = req.body;

    if (!mongoose.isValidObjectId(invitationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invitation ID.',
      });
    }

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be accepted or rejected.',
      });
    }

    const invitation = await RoomInvitation.findOne({
      _id: invitationId,
      receiver: req.user._id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or expired.',
      });
    }

    // Handle rejection without changing the room.
    if (action === 'rejected') {
      const result = await RoomInvitation.updateOne(
        {
          _id: invitation._id,
          receiver: req.user._id,
          status: 'pending',
          expiresAt: { $gt: new Date() },
        },
        { $set: { status: 'rejected' } }
      );

      if (result.modifiedCount !== 1) {
        return res.status(409).json({
          success: false,
          message: 'This invitation has already been processed.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Invitation rejected.',
      });
    }

    // Check friendship BEFORE changing room membership.
    const friendship = await FriendRequest.findOne({
      status: 'accepted',
      $or: [
        { sender: invitation.sender, receiver: req.user._id },
        { sender: req.user._id, receiver: invitation.sender },
      ],
    });

    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'You must be an accepted friend to join this room.',
      });
    }

    // Atomically add the friend only if the room has exactly one player.
    // This prevents two different invitations from filling the same slot.

    const room = await Room.findOne({
      _id: invitation.room,
      host: invitation.sender,
      status: 'waiting',
      expiresAt: { $gt: new Date() },
      players: { $size: 1, $ne: req.user._id },
    });

    if (room) {
      // Add the second player.
      room.players.addToSet(req.user._id);
      room.status = 'playing';

      // Initialize Tic-Tac-Toe only.
      if (room.game === 'Tic-Tac-Toe') {
        const players = room.players.map((id) => id.toString());

        // Randomly assign X and O.
        const firstPlayerIndex = Math.floor(Math.random() * 2);
        const firstPlayer = players[firstPlayerIndex];
        const secondPlayer = players[1 - firstPlayerIndex];

        room.gameState.board = Array(9).fill('');
        room.gameState.symbols = {
          [firstPlayer]: 'X',
          [secondPlayer]: 'O',
        };
        room.gameState.currentTurn = firstPlayer;
        room.gameState.winner = null;
        room.gameState.result = 'playing';
        room.gameState.replayVotes = [];
      }


      // Initialize Truth or Dare when both players have joined.
      if (room.game === 'Truth or Dare') {
        const players = room.players.map((id) => id.toString());

        // Randomly choose who gives the first turn.
        const firstPlayerIndex = Math.floor(Math.random() * 2);
        const firstGiver = players[firstPlayerIndex];

        room.truthOrDareState.phase = 'choosing';
        room.truthOrDareState.currentGiver = firstGiver;
        room.truthOrDareState.turnType = null;
        room.truthOrDareState.selectedCategory = null;
        room.truthOrDareState.currentPrompt = '';
        room.truthOrDareState.usedTruthQuestions = [];
        room.truthOrDareState.usedDares = [];
      }


      await room.save();
    }


    if (!room) {
      return res.status(409).json({
        success: false,
        message: 'This room is full, expired, or no longer available.',
      });
    }

    // Mark the invitation accepted only if it is still pending.
    const invitationUpdate = await RoomInvitation.updateOne(
      {
        _id: invitation._id,
        receiver: req.user._id,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      },
      { $set: { status: 'accepted' } }
    );

    if (invitationUpdate.modifiedCount !== 1) {
      // Undo this join if the invitation was processed concurrently.
      await Room.updateOne(
        { _id: room._id },
        {
          $pull: { players: req.user._id },
          $set: { status: 'waiting' },
        }
      );

      return res.status(409).json({
        success: false,
        message: 'This invitation has already been processed.',
      });
    }

    // Notify the host that their friend has joined.
    const io = req.app.get('io');

    if (io) {
      io.to(`user:${invitation.sender.toString()}`).emit('friendJoinedRoom', {
        roomCode: room.roomCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'You joined the room successfully.',
      room: {
        id: room._id,
        roomCode: room.roomCode,
        game: room.game,
        status: room.status,
        players: room.players,
      },
    });
  } catch (error) {
    console.error('Respond to room invitation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to process invitation right now.',
    });
  }
};


