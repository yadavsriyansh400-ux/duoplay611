
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const { playerId } = req.body;

    // 1. Validate the Player ID.
    if (!playerId || !playerId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a Player ID.',
      });
    }

    // 2. Find the verified recipient.
    const receiver = await User.findOne({
      playerId: playerId.trim(),
      isVerified: true,
    }).select('_id username playerId');

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'No verified player found with this Player ID.',
      });
    }

    // 3. Prevent sending a request to yourself.
    if (receiver._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a friend request to yourself.',
      });
    }

    // 4. Prevent duplicate pending or accepted requests.
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiver._id },
        { sender: receiver._id, receiver: req.user._id },
      ],
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message:
          existingRequest.status === 'accepted'
            ? 'You are already friends with this player.'
            : 'A friend request already exists between you and this player.',
      });
    }

    // 5. Create the request.
    const friendRequest = await FriendRequest.create({
      sender: req.user._id,
      receiver: receiver._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Friend request sent successfully!',
      request: {
        id: friendRequest._id,
        status: friendRequest.status,
        receiver: {
          username: receiver.username,
          playerId: receiver.playerId,
        },
      },
    });
  } catch (error) {
    // Handle a duplicate record safely.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A friend request already exists.',
      });
    }

    console.error('Send friend request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to send friend request right now.',
    });
  }
};


export const getIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending',
    })
      .populate('sender', 'username playerId profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests: requests.map((request) => ({
        id: request._id,
        status: request.status,
        createdAt: request.createdAt,
        sender: request.sender,
      })),
    });
  } catch (error) {
    console.error('Get incoming requests error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load incoming friend requests.',
    });
  }
};


export const respondToFriendRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    // Validate the requested action.
    if (!requestId || !['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Provide a valid request ID and action.',
      });
    }

    // Only the intended receiver can respond to a pending request.
    const request = await FriendRequest.findOne({
      _id: requestId,
      receiver: req.user._id,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending friend request not found.',
      });
    }

    request.status = action;
    await request.save();

    return res.status(200).json({
      success: true,
      message:
        action === 'accepted'
          ? 'Friend request accepted!'
          : 'Friend request rejected.',
      request: {
        id: request._id,
        status: request.status,
      },
    });
  } catch (error) {
    console.error('Respond to friend request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to process friend request right now.',
    });
  }
};


export const getFriends = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      status: 'accepted',
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    })
      .populate('sender', 'username playerId profilePicture')
      .populate('receiver', 'username playerId profilePicture')
      .sort({ updatedAt: -1 });

    const friends = requests.map((request) => {
      const isSender =
        request.sender._id.toString() === req.user._id.toString();

      return isSender ? request.receiver : request.sender;
    });

    return res.status(200).json({
      success: true,
      friends,
    });
  } catch (error) {
    console.error('Get friends error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load friends right now.',
    });
  }
};
