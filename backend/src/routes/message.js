import express from 'express';
import {
  sendMessage,
  getMessages,
  getConversations,
  getAllMessages,
  markMessageAsRead
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// Get all messages for user (for support chat)
router.get('/', getAllMessages);

// Send a message
router.post('/send', sendMessage);

// Get messages between user and another user
router.get('/conversation/:otherUserId', getMessages);

// Get all conversations for user
router.get('/conversations', getConversations);

// Mark message as read
router.put('/:messageId/read', markMessageAsRead);

export default router;
