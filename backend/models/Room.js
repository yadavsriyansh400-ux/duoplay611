
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    game: {
      type: String,
      required: true,
      enum: [
        'Tic-Tac-Toe',
        'Connect Four',
        'Guess My Number',
        'Truth or Dare',
        'Shared Canvas',
      ],
    },

    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting',
    },

    gameState: {
      board: {
        type: [String],
        default: () => Array(9).fill(''),
        validate: {
          validator: (board) => board.length === 9,
          message: 'Tic-Tac-Toe board must contain exactly 9 cells.',
        },
      },

      symbols: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      currentTurn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      result: {
        type: String,
        enum: ['playing', 'won', 'draw', 'finished'],
        default: 'playing',
      },

      replayVotes: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
      },
    },


    truthOrDareState: {
      phase: {
        type: String,
        enum: [
          'waiting',
          'choosing',
          'truth',
          'dare-category',
          'dare',
          'finished',
        ],
        default: 'waiting',
      },

      currentGiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      turnType: {
        type: String,
        enum: ['truth', 'dare'],
        default: null,
      },

      selectedCategory: {
        type: String,
        enum: ['fun', 'couple', 'spicy'],
        default: null,
      },

      currentPrompt: {
        type: String,
        default: '',
      },

      usedTruthQuestions: {
        type: [String],
        default: [],
      },

      usedDares: {
        type: [String],
        default: [],
      },
    },


    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

roomSchema.index({ players: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
