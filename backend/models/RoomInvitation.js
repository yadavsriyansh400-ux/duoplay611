
import mongoose from 'mongoose';

const roomInvitationSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

// Prevent duplicate invitations to the same friend for the same room.
roomInvitationSchema.index(
  { room: 1, receiver: 1 },
  { unique: true }
);

// Quickly find invitations received by a player.
roomInvitationSchema.index({ receiver: 1, status: 1 });

const RoomInvitation = mongoose.model(
  'RoomInvitation',
  roomInvitationSchema
);

export default RoomInvitation;
