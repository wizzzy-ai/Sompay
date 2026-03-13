import Message from '../models/Message.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Send message from client to company or company to client
export const sendMessage = async (req, res) => {
  try {
    let { receiverId, content, messageType } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.userType === 'admin' || req.user.userType === 'company' ? 'Company' : 'User';
    let receiverModel = messageType === 'client_to_company' ? 'Company' : 'User';
    const companyId = req.user.companyId;

    // Validate message type
    if (!['client_to_company', 'company_to_client'].includes(messageType)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }
    if (senderModel === 'User' && messageType === 'company_to_client') {
      return res.status(403).json({ error: 'Users cannot send company messages.' });
    }
    if (senderModel === 'Company' && messageType === 'client_to_company') {
      return res.status(403).json({ error: 'Company accounts cannot send client messages with this type.' });
    }

    // If client_to_company and no receiverId, route to the user's company.
    if (messageType === 'client_to_company' && !receiverId) {
      const senderUser = await User.findById(senderId).select('company');
      if (senderUser?.company) {
        receiverId = senderUser.company;
      } else {
        // fallback to first verified company account
        const company = await Company.findOne({ isVerified: true }).select('_id');
        if (!company) {
          return res.status(404).json({ error: 'No verified company available for support chat.' });
        }
        receiverId = company._id;
      }
    }

    // Validate receiver exists in expected collection
    const receiver = receiverModel === 'Company'
      ? await Company.findById(receiverId)
      : await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Prevent cross-company messaging (company accounts can only message users in their own company).
    if (senderModel === 'Company' && receiverModel === 'User') {
      const receiverCompanyId = receiver.company ? receiver.company.toString() : null;
      if (!companyId || !receiverCompanyId || receiverCompanyId !== companyId.toString()) {
        return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
      }
    }

    // Create message
    const message = new Message({
      sender: senderId,
      senderModel,
      receiver: receiverId,
      receiverModel,
      content,
      messageType
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get messages for user (conversation with company)
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    // Company accounts should only access conversations with users in their own company.
    if (req.user.userType === 'admin' || req.user.userType === 'company') {
      const otherUser = await User.findById(otherUserId).select('company');
      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!otherUser.company || !req.user.companyId || otherUser.company.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ error: 'Access denied. User does not belong to your company.' });
      }
    }

    // Get messages between user and other user
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .populate({ path: 'sender', select: 'name email', strictPopulate: false })
    .populate({ path: 'receiver', select: 'name email', strictPopulate: false })
    .sort({ createdAt: 1 });

    // Mark messages as read if user is receiver
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Get message conversations for user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('=== getConversations DEBUG ===');
    console.log('Admin/User ID:', userId);
    console.log('User ID Type:', typeof userId);

    // Check if any messages exist for this user
    const totalMessages = await Message.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }]
    });
    console.log('Total messages involving this user:', totalMessages);

    // Check for messages sent TO this user
    const messagesTo = await Message.countDocuments({ receiver: userId });
    console.log('Messages TO this user:', messagesTo);

    // Check for messages sent FROM this user
    const messagesFrom = await Message.countDocuments({ sender: userId });
    console.log('Messages FROM this user:', messagesFrom);

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$receiver',
              else: '$sender'
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', userId] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      {
        $unwind: '$otherUser'
      },
      {
        $project: {
          _id: 1,
          otherUser: {
            _id: 1,
            name: 1,
            email: 1
          },
          lastMessage: {
            _id: 1,
            content: 1,
            createdAt: 1,
            isRead: 1
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    console.log('After aggregation - Conversations found:', conversations.length);
    if (conversations.length > 0) {
      console.log('First conversation:', JSON.stringify(conversations[0], null, 2));
    }
    
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations: ' + error.message });
  }
};

// Get all messages for user (for support chat)
export const getAllMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .populate({ path: 'sender', select: 'name email', strictPopulate: false })
    .populate({ path: 'receiver', select: 'name email', strictPopulate: false })
    .sort({ createdAt: 1 });

    // Mark messages as read if user is receiver
    await Message.updateMany(
      { receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, receiver: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};
